import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import {
  isWikiInitialized,
  scanWikiDirectory,
  parseWikiPage,
  isPageLocked,
  detectWikiDeltas,
  generateWikiIndex,
  wikiTopicName,
} from '../core/wiki.js';
import {
  runStructuralLint,
  buildLintResult,
  type LintIssue,
  type WikiLintResult,
} from '../core/wiki-lint.js';
import { logger } from '../utils/logger.js';

const AGENT_ONLY_COMMANDS: Record<string, string> = {
  init: '/grsx-wiki-init',
  ingest: '/grsx-wiki-ingest',
  query: '/grsx-wiki-query',
  sync: '/grsx-wiki-sync',
};

/**
 * Register the `grspec wiki` command group.
 */
export function registerWikiCommand(parent: Command): void {
  const wiki = parent
    .command('wiki')
    .description('Wiki knowledge base management');

  // grspec wiki lint
  wiki
    .command('lint')
    .description('Run wiki health checks')
    .option('--structural', 'Run only structural checks (no LLM)')
    .option('--semantic', 'Run only semantic checks (requires LLM agent)')
    .option('--coverage', 'Run coverage analysis')
    .option('--fix', 'Auto-fix structural issues')
    .option('--json', 'Output results as JSON')
    .action(async (options: {
      structural?: boolean;
      semantic?: boolean;
      coverage?: boolean;
      fix?: boolean;
      json?: boolean;
    }) => {
      const projectRoot = process.cwd();
      const grspecDir = path.join(projectRoot, 'grspec');
      const wikiDir = path.join(grspecDir, 'wiki');

      if (!(await isWikiInitialized(grspecDir))) {
        if (options.json) {
          logger.info(JSON.stringify({ error: 'Wiki not initialized' }));
        } else {
          logger.error(
            chalk.red('Wiki not initialized.') +
            ' Run ' + chalk.cyan('/grsx-wiki-init') + ' or create grspec/wiki/index.md manually.'
          );
        }
        process.exitCode = 1;
        return;
      }

      if (options.semantic && !options.structural) {
        if (options.json) {
          logger.info(JSON.stringify({
            error: 'Semantic checks require an LLM agent. Use /grsx-wiki-lint in your editor.',
          }));
        } else {
          logger.error(
            chalk.yellow('Semantic checks require an LLM agent.') +
            ' Use ' + chalk.cyan('/grsx-wiki-lint') + ' in your editor for full semantic analysis.'
          );
        }
        process.exitCode = 1;
        return;
      }

      const spinner = options.json ? null : ora('Running wiki lint...').start();

      try {
        let structural: LintIssue[] = [];

        if (!options.semantic) {
          structural = await runStructuralLint(wikiDir, projectRoot);
        }

        if (options.coverage) {
          const coverageIssues = structural.filter(
            (i) => i.check === 'spec-coverage' || i.check === 'index-completeness'
          );
          const nonCoverage = structural.filter(
            (i) => i.check !== 'spec-coverage' && i.check !== 'index-completeness'
          );
          structural = options.structural ? structural : [...nonCoverage, ...coverageIssues];
        }

        if (options.fix) {
          const fixableChecks = new Set(['index-completeness']);
          const fixable = structural.filter((i) => fixableChecks.has(i.check));
          if (fixable.length > 0) {
            const indexContent = await generateWikiIndex(wikiDir);
            await fs.writeFile(path.join(wikiDir, 'index.md'), indexContent);
            structural = structural.filter((i) => !fixableChecks.has(i.check));
            spinner?.stop();
            if (!options.json) {
              logger.info(chalk.green(`  Fixed: regenerated index.md (${fixable.length} issue(s) resolved)`));
            }
            if (!options.json) {
              const fixSpinner = ora('Re-running lint after fixes...').start();
              structural = await runStructuralLint(wikiDir, projectRoot);
              fixSpinner.stop();
            } else {
              structural = await runStructuralLint(wikiDir, projectRoot);
            }
          }
        }

        const result = buildLintResult(structural, []);

        spinner?.stop();

        if (options.json) {
          logger.info(JSON.stringify(result, null, 2));
          return;
        }

        printLintResult(result);
      } catch (err) {
        spinner?.fail('Lint failed');
        logger.error(chalk.red(String(err)));
        process.exitCode = 1;
      }
    });

  // grspec wiki status
  wiki
    .command('status')
    .description('Show wiki status overview')
    .action(async () => {
      const projectRoot = process.cwd();
      const grspecDir = path.join(projectRoot, 'grspec');
      const wikiDir = path.join(grspecDir, 'wiki');

      if (!(await isWikiInitialized(grspecDir))) {
        logger.info(chalk.yellow('Wiki not initialized.'));
        return;
      }

      const scan = await scanWikiDirectory(wikiDir);
      const allPages = [
        ...scan.concepts,
        ...scan.entities,
        ...scan.sources,
        ...scan.comparisons,
      ];
      const total = allPages.length;

      logger.info(chalk.bold('Wiki Status'));
      logger.info('');
      logger.info(`  Total pages: ${chalk.cyan(total)}`);
      logger.info(`    Concepts:    ${scan.concepts.length}`);
      logger.info(`    Entities:    ${scan.entities.length}`);
      logger.info(`    Sources:     ${scan.sources.length}`);
      logger.info(`    Comparisons: ${scan.comparisons.length}`);

      const parsed: Array<{ topic: string; updated: string }> = [];
      for (const p of allPages) {
        try {
          const page = await parseWikiPage(p);
          parsed.push({
            topic: wikiTopicName(p),
            updated: page.frontmatter.updated,
          });
        } catch {
          // skip unparseable
        }
      }
      if (parsed.length > 0) {
        parsed.sort((a, b) => b.updated.localeCompare(a.updated));
        logger.info('');
        logger.info(chalk.bold('  Recently updated:'));
        for (const p of parsed.slice(0, 5)) {
          logger.info(`    ${p.updated}  ${p.topic}`);
        }
      }

      const blocked: Array<{ topic: string; by: string; since: string }> = [];
      for (const p of allPages) {
        const lock = await isPageLocked(p);
        if (lock) {
          blocked.push({
            topic: wikiTopicName(p),
            by: lock.blockedBy,
            since: lock.blockedSince,
          });
        }
      }
      if (blocked.length > 0) {
        logger.info('');
        logger.info(chalk.bold(`  Blocked pages: ${chalk.yellow(blocked.length)}`));
        for (const b of blocked) {
          logger.info(`    ${b.topic} — locked by '${b.by}' since ${b.since}`);
        }
      }

      const changesDir = path.join(projectRoot, 'grspec', 'changes');
      try {
        const changeEntries = await fs.readdir(changesDir, { withFileTypes: true });
        const pendingDeltas: Array<{ change: string; count: number }> = [];
        for (const entry of changeEntries) {
          if (!entry.isDirectory() || entry.name === 'archive') continue;
          const changeWikiDir = path.join(changesDir, entry.name, 'wiki');
          try {
            const deltas = await detectWikiDeltas(changeWikiDir, wikiDir);
            if (deltas.length > 0) {
              pendingDeltas.push({ change: entry.name, count: deltas.length });
            }
          } catch {
            // skip
          }
        }
        if (pendingDeltas.length > 0) {
          logger.info('');
          logger.info(chalk.bold('  Pending wiki deltas:'));
          for (const pd of pendingDeltas) {
            logger.info(`    ${pd.change}: ${pd.count} delta(s)`);
          }
        }
      } catch {
        // No changes dir
      }
    });

  // Agent-only commands: direct users to the appropriate slash command
  for (const [name, slashCmd] of Object.entries(AGENT_ONLY_COMMANDS)) {
    wiki
      .command(name)
      .description(`(Agent-only) Use ${slashCmd} in your editor`)
      .allowUnknownOption(true)
      .action(() => {
        logger.info(
          chalk.yellow(`"grspec wiki ${name}" is an agent-driven operation.`) +
          '\n' +
          'Use ' + chalk.cyan(slashCmd) + ' in your editor (Cursor, etc.) to run this command.'
        );
        process.exitCode = 1;
      });
  }
}

function printLintResult(result: WikiLintResult): void {
  const { structural, summary } = result;

  if (summary.total === 0) {
    logger.info(chalk.green('✓ Wiki lint passed — no issues found'));
    return;
  }

  logger.info(chalk.bold('Wiki Lint Results'));
  logger.info('');

  if (structural.length > 0) {
    logger.info(chalk.underline('Structural Checks'));
    logger.info('');

    const grouped = new Map<string, LintIssue[]>();
    for (const issue of structural) {
      const existing = grouped.get(issue.check) || [];
      existing.push(issue);
      grouped.set(issue.check, existing);
    }

    for (const [check, issues] of grouped) {
      logger.info(`  ${chalk.bold(check)} (${issues.length})`);
      for (const issue of issues) {
        const icon = issue.level === 'error' ? chalk.red('✗') : chalk.yellow('⚠');
        logger.info(`    ${icon} ${issue.page}: ${issue.message}`);
      }
      logger.info('');
    }
  }

  logger.info(
    `Summary: ${summary.total} issues (${chalk.red(`${summary.errors} errors`)}, ${chalk.yellow(`${summary.warnings} warnings`)})`
  );
}
