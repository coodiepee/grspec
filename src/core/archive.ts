import { promises as fs } from 'fs';
import path from 'path';
import { copyDirRecursive } from '../utils/file-system.js';
import { getTaskProgressForChange, getIncompleteItemsForChange, formatTaskStatus } from '../utils/task-progress.js';
import { Validator } from './validation/validator.js';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import {
  findSpecUpdates,
  buildUpdatedSpec,
  writeUpdatedSpec,
  type SpecUpdate,
} from './specs-apply.js';
import { readProjectConfig } from './project-config.js';
import {
  detectWikiDeltas,
  mergeWikiDeltas,
  generateWikiIndex,
  appendWikiLog,
  unlockPages,
  isWikiInitialized,
  generateSourceSummary,
  validateWikiPage,
} from './wiki.js';
import { compactVerifySummary } from './compact-verify.js';
import { archiveCompletionFeedback } from './archive-feedback.js';

/** npm script names commonly used for verification (build/test/lint). */
const VERIFICATION_SCRIPT_NAMES = new Set([
  'test',
  'build',
  'lint',
  'verify',
  'check',
  'ci',
  'coverage',
]);

async function collectPackageVerificationScriptNames(projectRoot: string): Promise<string[]> {
  const pkgPath = path.join(projectRoot, 'package.json');
  try {
    const raw = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
    if (!pkg.scripts || typeof pkg.scripts !== 'object') {
      return [];
    }
    const hits: string[] = [];
    for (const name of Object.keys(pkg.scripts)) {
      if (VERIFICATION_SCRIPT_NAMES.has(name)) {
        hits.push(name);
      }
    }
    return hits.sort();
  } catch {
    return [];
  }
}

/**
 * Lightweight pre-archive reminder: do not run arbitrary npm scripts from the CLI.
 */
async function runArchiveVerificationGate(
  projectRoot: string,
  options: { yes?: boolean }
): Promise<boolean> {
  const scriptHits = await collectPackageVerificationScriptNames(projectRoot);
  if (scriptHits.length > 0) {
    logger.info(
      chalk.yellow(
        `\nBefore archiving: run project verification (detected package.json scripts: ${scriptHits.join(', ')}). grspec does not execute these for you.`
      )
    );
  } else {
    logger.info(
      chalk.yellow(
        '\nBefore archiving: run your usual tests or build if the project defines them; grspec does not run verification for you.'
      )
    );
  }

  const config = readProjectConfig(projectRoot);
  const strictVerification = config?.execution?.verification === 'strict';
  if (strictVerification && !options.yes) {
    const { confirm } = await import('@inquirer/prompts');
    const proceed = await confirm({
      message: chalk.yellow(
        'grspec.yaml sets execution.verification: strict. Confirm you have already run project verification before archiving?'
      ),
      default: false,
    });
    if (!proceed) {
      logger.info('Archive cancelled.');
      return false;
    }
  }

  return true;
}


/**
 * Move a directory from src to dest. On Windows, fs.rename() often fails with
 * EPERM when the directory is non-empty or another process has it open (IDE,
 * file watcher, antivirus). Fall back to copy-then-remove when rename fails
 * with EPERM or EXDEV.
 */
async function moveDirectory(src: string, dest: string): Promise<void> {
  try {
    await fs.rename(src, dest);
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    const code = nodeErr?.code;
    if (code === 'EPERM' || code === 'EXDEV') {
      await copyDirRecursive(src, dest);
      await fs.rm(src, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

export class ArchiveCommand {
  async execute(
    changeName?: string,
    options: { yes?: boolean; skipSpecs?: boolean; skipWiki?: boolean; skipVerify?: boolean; noValidate?: boolean; validate?: boolean; force?: boolean } = {}
  ): Promise<void> {
    const targetPath = '.';
    const changesDir = path.join(targetPath, 'grspec', 'changes');
    const archiveDir = path.join(changesDir, 'archive');
    const mainSpecsDir = path.join(targetPath, 'grspec', 'specs');

    // Check if changes directory exists
    try {
      await fs.access(changesDir);
    } catch {
      throw new Error("No grspec changes directory found. Run 'grspec init' first.");
    }

    // Get change name interactively if not provided
    if (!changeName) {
      const selectedChange = await this.selectChange(changesDir);
      if (!selectedChange) {
        logger.info('No change selected. Aborting.');
        return;
      }
      changeName = selectedChange;
    }

    const changeDir = path.join(changesDir, changeName);

    // Verify change exists
    try {
      const stat = await fs.stat(changeDir);
      if (!stat.isDirectory()) {
        throw new Error(`Change '${changeName}' not found.`);
      }
    } catch {
      throw new Error(`Change '${changeName}' not found.`);
    }

    if (!(await runArchiveVerificationGate(targetPath, options))) {
      return;
    }

    const skipValidation = options.validate === false || options.noValidate === true;

    // Validate specs and change before archiving
    if (!skipValidation) {
      const validator = new Validator();
      let hasValidationErrors = false;

      // Validate proposal.md (non-blocking unless strict mode desired in future)
      const changeFile = path.join(changeDir, 'proposal.md');
      try {
        await fs.access(changeFile);
        const changeReport = await validator.validateChange(changeFile);
        // Proposal validation is informative only (do not block archive)
        if (!changeReport.valid) {
          logger.warn(chalk.yellow(`\nProposal warnings in proposal.md (non-blocking):`));
          for (const issue of changeReport.issues) {
            const symbol = issue.level === 'ERROR' ? '⚠' : (issue.level === 'WARNING' ? '⚠' : 'ℹ');
            logger.warn(chalk.yellow(`  ${symbol} ${issue.message}`));
          }
        }
      } catch {
        // Change file doesn't exist, skip validation
      }

      // Validate delta-formatted spec files under the change directory if present
      const changeSpecsDir = path.join(changeDir, 'specs');
      let hasDeltaSpecs = false;
      try {
        const candidates = await fs.readdir(changeSpecsDir, { withFileTypes: true });
        for (const c of candidates) {
          if (c.isDirectory()) {
            try {
              const candidatePath = path.join(changeSpecsDir, c.name, 'spec.md');
              await fs.access(candidatePath);
              const content = await fs.readFile(candidatePath, 'utf-8');
              if (/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements/m.test(content)) {
                hasDeltaSpecs = true;
                break;
              }
            } catch { /* ignore missing files */ }
          }
        }
      } catch { /* ignore unreadable directories */ }
      if (hasDeltaSpecs) {
        const deltaReport = await validator.validateChangeDeltaSpecs(changeDir);
        if (!deltaReport.valid) {
          hasValidationErrors = true;
          logger.error(chalk.red(`\nValidation errors in change delta specs:`));
          for (const issue of deltaReport.issues) {
            if (issue.level === 'ERROR') {
              logger.error(chalk.red(`  ✗ ${issue.message}`));
            } else if (issue.level === 'WARNING') {
              logger.warn(chalk.yellow(`  ⚠ ${issue.message}`));
            }
          }
        }
      }

      if (hasValidationErrors) {
        logger.error(chalk.red('\nValidation failed. Please fix the errors before archiving.'));
        logger.warn(chalk.yellow('To skip validation (not recommended), use --no-validate flag.'));
        return;
      }
    } else {
      // Log warning when validation is skipped
      const timestamp = new Date().toISOString();
      
      if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        const proceed = await confirm({
          message: chalk.yellow('⚠️  WARNING: Skipping validation may archive invalid specs. Continue? (y/N)'),
          default: false
        });
        if (!proceed) {
          logger.info('Archive cancelled.');
          return;
        }
      } else {
        logger.warn(chalk.yellow(`\n⚠️  WARNING: Skipping validation may archive invalid specs.`));
      }
      
      logger.warn(chalk.yellow(`[${timestamp}] Validation skipped for change: ${changeName}`));
      logger.warn(chalk.yellow(`Affected files: ${changeDir}`));
    }

    // Hard-block on incomplete plan/task items unless --force
    const progress = await getTaskProgressForChange(changesDir, changeName);
    const status = formatTaskStatus(progress);
    logger.info(`Task status: ${status}`);

    const incompleteItems = await getIncompleteItemsForChange(changesDir, changeName);
    if (incompleteItems.length > 0) {
      logger.error(chalk.red(`\n${incompleteItems.length} incomplete item(s):`));
      for (const item of incompleteItems) {
        logger.error(chalk.red(`  ${item.file}: ${item.line}`));
      }

      if (options.force) {
        logger.warn(chalk.yellow(`\nProceeding despite incomplete items (--force flag).`));
      } else {
        logger.warn(chalk.yellow('\nArchive blocked. Complete all items or use --force to override.'));
        process.exitCode = 1;
        return;
      }
    }

    // Track spec merge counts and affected capabilities for feedback
    const specMergeTotals = { added: 0, modified: 0, removed: 0 };
    const affectedCapabilities: string[] = [];

    // Handle spec updates unless skipSpecs flag is set
    if (options.skipSpecs) {
      logger.info('Skipping spec updates (--skip-specs flag provided).');
    } else {
      // Find specs to update
      const specUpdates = await findSpecUpdates(changeDir, mainSpecsDir);
      
      if (specUpdates.length > 0) {
        logger.info('\nSpecs to update:');
        for (const update of specUpdates) {
          const status = update.exists ? 'update' : 'create';
          const capability = path.basename(path.dirname(update.target));
          affectedCapabilities.push(capability);
          logger.info(`  ${capability}: ${status}`);
        }

        let shouldUpdateSpecs = true;
        if (!options.yes) {
          const { confirm } = await import('@inquirer/prompts');
          shouldUpdateSpecs = await confirm({
            message: 'Proceed with spec updates?',
            default: true
          });
          if (!shouldUpdateSpecs) {
            logger.info('Skipping spec updates. Proceeding with archive.');
          }
        }

        if (shouldUpdateSpecs) {
          // Prepare all updates first (validation pass, no writes)
          const prepared: Array<{ update: SpecUpdate; rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> = [];
          try {
            for (const update of specUpdates) {
              const built = await buildUpdatedSpec(update, changeName!);
              prepared.push({ update, rebuilt: built.rebuilt, counts: built.counts });
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.info(msg);
            logger.info('Aborted. No files were changed.');
            return;
          }

          // All validations passed; pre-validate rebuilt full spec and then write files and display counts
          const totals = { added: 0, modified: 0, removed: 0, renamed: 0 };
          for (const p of prepared) {
            const specName = path.basename(path.dirname(p.update.target));
            if (!skipValidation) {
              const report = await new Validator().validateSpecContent(specName, p.rebuilt);
              if (!report.valid) {
                logger.error(chalk.red(`\nValidation errors in rebuilt spec for ${specName} (will not write changes):`));
                for (const issue of report.issues) {
                  if (issue.level === 'ERROR') logger.error(chalk.red(`  ✗ ${issue.message}`));
                  else if (issue.level === 'WARNING') logger.warn(chalk.yellow(`  ⚠ ${issue.message}`));
                }
                logger.info('Aborted. No files were changed.');
                return;
              }
            }
            await writeUpdatedSpec(p.update, p.rebuilt, p.counts);
            totals.added += p.counts.added;
            totals.modified += p.counts.modified;
            totals.removed += p.counts.removed;
            totals.renamed += p.counts.renamed;
          }
          specMergeTotals.added = totals.added;
          specMergeTotals.modified = totals.modified;
          specMergeTotals.removed = totals.removed;
          logger.info(
            `Totals: + ${totals.added}, ~ ${totals.modified}, - ${totals.removed}, → ${totals.renamed}`
          );
          logger.info('Specs updated successfully.');
        }
      }
    }

    // Wiki delta processing
    if (!options.skipWiki) {
      const config = readProjectConfig(targetPath);
      const wikiEnabled = config?.wiki?.enabled === true;
      const grspecDir = path.join(targetPath, 'grspec');
      const wikiDir = path.join(grspecDir, 'wiki');
      const changeWikiDir = path.join(changeDir, 'wiki');

      if (wikiEnabled && (await isWikiInitialized(grspecDir))) {
        try {
          const rawDeltas = await detectWikiDeltas(changeWikiDir, wikiDir);

          // Validate delta files before merging (spec: wiki delta validation)
          const deltas = [];
          for (const delta of rawDeltas) {
            if (delta.type === 'removed') {
              deltas.push(delta);
              continue;
            }
            try {
              const content = await fs.readFile(delta.sourcePath, 'utf-8');
              const errors = validateWikiPage(delta.sourcePath, content);
              if (errors.length > 0) {
                const msgs = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
                logger.warn(chalk.yellow(`  ⚠ Skipping invalid wiki delta ${delta.relativePath}: ${msgs}`));
                continue;
              }
              deltas.push(delta);
            } catch (err) {
              logger.warn(chalk.yellow(`  ⚠ Skipping unreadable wiki delta ${delta.relativePath}: ${String(err)}`));
            }
          }

          if (deltas.length > 0) {
            logger.info('\nWiki updates:');
            const report = await mergeWikiDeltas(deltas);

            if (report.added.length > 0) logger.info(`  + ${report.added.length} added`);
            if (report.modified.length > 0) logger.info(`  ~ ${report.modified.length} modified`);
            if (report.removed.length > 0) logger.info(`  - ${report.removed.length} removed`);

            const indexContent = await generateWikiIndex(wikiDir);
            await fs.writeFile(path.join(wikiDir, 'index.md'), indexContent);

            const allAffected = [...report.added, ...report.modified, ...report.removed];
            await appendWikiLog(wikiDir, 'archive', `Merged wiki from change ${changeName}`, allAffected);

            logger.info('Wiki index and log updated.');
          }

          // Generate source summary for the archived change
          try {
            const summaryPath = await generateSourceSummary(changeName!, changeDir, wikiDir);
            if (summaryPath) {
              logger.info(`  Source summary generated.`);
              // Re-generate index after adding source summary
              const updatedIndex = await generateWikiIndex(wikiDir);
              await fs.writeFile(path.join(wikiDir, 'index.md'), updatedIndex);
            }
          } catch (err) {
            logger.warn(chalk.yellow(`  Source summary warning: ${String(err)}`));
          }

          const unlockedPages = await unlockPages(wikiDir, changeName!);
          if (unlockedPages.length > 0) {
            logger.info(`  Released ${unlockedPages.length} page lock(s).`);
          }
        } catch (err) {
          logger.warn(chalk.yellow(`\nWiki processing warning: ${String(err)}`));
        }
      }
    } else {
      logger.info('Skipping wiki updates (--skip-wiki flag provided).');
    }

    // Lightweight verify summary (non-blocking)
    if (!options.skipVerify) {
      const verifySummary = await compactVerifySummary(changeDir);
      if (verifySummary) {
        const taskStatus = `${verifySummary.taskComplete}/${verifySummary.taskTotal} tasks`;
        const reqStatus = verifySummary.requirementTotal > 0
          ? `, ${verifySummary.requirementTotal} requirement(s) specified`
          : '';
        if (verifySummary.hasCriticalIssues) {
          logger.info(chalk.yellow(`\nVerify: ${taskStatus}${reqStatus} — incomplete tasks detected`));
          logger.info(chalk.dim('  Run /grsx:verify for detailed report'));
        } else {
          logger.info(chalk.green(`\nVerify: ${taskStatus}${reqStatus}`));
        }
      }
    }

    // Create archive directory with date prefix
    const archiveName = `${this.getArchiveDate()}-${changeName}`;
    const archivePath = path.join(archiveDir, archiveName);

    // Check if archive already exists
    try {
      await fs.access(archivePath);
      throw new Error(`Archive '${archiveName}' already exists.`);
    } catch (error: unknown) {
      const nodeErr = error as NodeJS.ErrnoException;
      if (nodeErr.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create archive directory if needed
    await fs.mkdir(archiveDir, { recursive: true });

    // Collect feedback before move (changeDir will be gone after)
    const feedback = await archiveCompletionFeedback(
      changeDir,
      changesDir,
      {
        specsAdded: specMergeTotals.added,
        specsModified: specMergeTotals.modified,
        specsRemoved: specMergeTotals.removed,
      },
      mainSpecsDir,
      affectedCapabilities
    );

    // Move change to archive (uses copy+remove on EPERM/EXDEV, e.g. Windows)
    await moveDirectory(changeDir, archivePath);

    logger.info(`\nChange '${changeName}' archived as '${archiveName}'.`);

    // Lifecycle summary
    const ageStr = feedback.changeAgeDays !== null ? ` (${feedback.changeAgeDays} day${feedback.changeAgeDays === 1 ? '' : 's'})` : '';
    logger.info(chalk.dim(`  ${feedback.taskComplete}/${feedback.taskTotal} tasks complete${ageStr}`));

    if (feedback.affectedSpecCounts.length > 0) {
      for (const spec of feedback.affectedSpecCounts) {
        logger.info(chalk.dim(`  specs/${spec.capability}: ${spec.requirementCount} requirement(s) total`));
      }
    }

    if (feedback.remainingChanges.length > 0) {
      logger.info(chalk.dim(`  ${feedback.remainingChanges.length} active change(s) remaining: ${feedback.remainingChanges.join(', ')}`));
    } else {
      logger.info(chalk.dim('  No active changes remaining'));
    }
  }

  private async selectChange(changesDir: string): Promise<string | null> {
    const { select } = await import('@inquirer/prompts');
    // Get all directories in changes (excluding archive)
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    const changeDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'archive')
      .map(entry => entry.name)
      .sort();

    if (changeDirs.length === 0) {
      logger.info('No active changes found.');
      return null;
    }

    // Build choices with progress inline to avoid duplicate lists
    let choices: Array<{ name: string; value: string }> = changeDirs.map(name => ({ name, value: name }));
    try {
      const progressList: Array<{ id: string; status: string }> = [];
      for (const id of changeDirs) {
        const progress = await getTaskProgressForChange(changesDir, id);
        const status = formatTaskStatus(progress);
        progressList.push({ id, status });
      }
      const nameWidth = Math.max(...progressList.map(p => p.id.length));
      choices = progressList.map(p => ({
        name: `${p.id.padEnd(nameWidth)}     ${p.status}`,
        value: p.id
      }));
    } catch {
      // If anything fails, fall back to simple names
      choices = changeDirs.map(name => ({ name, value: name }));
    }

    try {
      const answer = await select({
        message: 'Select a change to archive',
        choices
      });
      return answer;
    } catch (error) {
      // User cancelled (Ctrl+C)
      return null;
    }
  }

  private getArchiveDate(): string {
    // Returns date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  }
}
