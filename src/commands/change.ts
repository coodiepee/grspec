import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { JsonConverter } from '../core/converters/json-converter.js';
import { Validator } from '../core/validation/validator.js';
import { ChangeParser } from '../core/parsers/change-parser.js';
import { Change } from '../core/schemas/index.js';
import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds } from '../utils/item-discovery.js';
import { readChangeMetadata } from '../utils/change-metadata.js';
import {
  computeTopologicalOrder,
  getNextUnblocked,
  detectOverlaps,
  detectCycles,
  type ChangeStackEntry,
} from '../core/validation/stack-validator.js';
import { splitChange, SplitError } from '../core/split.js';
import { TASK_PATTERN, COMPLETED_TASK_PATTERN } from '../utils/task-progress.js';
import { handleCommandError } from '../utils/command-error.js';
import { logger } from '../utils/logger.js';

const ARCHIVE_DIR = 'archive';

export class ChangeCommand {
  private converter: JsonConverter;

  constructor() {
    this.converter = new JsonConverter();
  }

  /**
   * Show a change proposal.
   * - Text mode: raw markdown passthrough (no filters)
   * - JSON mode: minimal object with deltas; --deltas-only returns same object with filtered deltas
   */
  async show(changeName?: string, options?: { json?: boolean; deltasOnly?: boolean; noInteractive?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'grspec', 'changes');

    if (!changeName) {
      const canPrompt = isInteractive(options);
      const changes = await this.getActiveChanges(changesPath);
      if (canPrompt && changes.length > 0) {
        const { select } = await import('@inquirer/prompts');
        const selected = await select({
          message: 'Select a change to show',
          choices: changes.map(id => ({ name: id, value: id })),
        });
        changeName = selected;
      } else {
        if (changes.length === 0) {
          logger.error('No change specified. No active changes found.');
        } else {
          logger.error(`No change specified. Available IDs: ${changes.join(', ')}`);
        }
        logger.error('Hint: use "grspec change list" to view available changes.');
        process.exitCode = 1;
        return;
      }
    }

    const proposalPath = path.join(changesPath, changeName, 'proposal.md');

    try {
      await fs.access(proposalPath);
    } catch {
      throw new Error(`Change "${changeName}" not found at ${proposalPath}`);
    }

    if (options?.json) {
      const jsonOutput = await this.converter.convertChangeToJson(proposalPath);


      const parsed: Change = JSON.parse(jsonOutput);
      const contentForTitle = await fs.readFile(proposalPath, 'utf-8');
      const title = this.extractTitle(contentForTitle, changeName);
      const id = parsed.name;
      const deltas = parsed.deltas || [];

      if (options.deltasOnly) {
        const output = { id, title, deltaCount: deltas.length, deltas };
        logger.info(JSON.stringify(output, null, 2));
      } else {
        const output = {
          id,
          title,
          deltaCount: deltas.length,
          deltas,
        };
        logger.info(JSON.stringify(output, null, 2));
      }
    } else {
      const content = await fs.readFile(proposalPath, 'utf-8');
      logger.info(content);
    }
  }

  /**
   * List active changes.
   * - Text default: IDs only; --long prints minimal details (title, counts)
   * - JSON: array of { id, title, deltaCount, taskStatus }, sorted by id
   */
  async list(options?: { json?: boolean; long?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'grspec', 'changes');
    
    const changes = await this.getActiveChanges(changesPath);
    
    if (options?.json) {
      const changeDetails = await Promise.all(
        changes.map(async (changeName) => {
          const proposalPath = path.join(changesPath, changeName, 'proposal.md');
          const planPath = path.join(changesPath, changeName, 'plan.md');
          
          try {
            const content = await fs.readFile(proposalPath, 'utf-8');
            const changeDir = path.join(changesPath, changeName);
            const parser = new ChangeParser(content, changeDir);
            const change = await parser.parseChangeWithDeltas(changeName);
            
            let taskStatus = { total: 0, completed: 0 };
            try {
              const planContent = await fs.readFile(planPath, 'utf-8');
              taskStatus = this.countTasks(planContent);
            } catch (error) {
              if (process.env.DEBUG) {
                logger.error(`Failed to read plan file at ${planPath}: ${error}`);
              }
            }
            
            return {
              id: changeName,
              title: this.extractTitle(content, changeName),
              deltaCount: change.deltas.length,
              taskStatus,
            };
          } catch (error) {
            return {
              id: changeName,
              title: 'Unknown',
              deltaCount: 0,
              taskStatus: { total: 0, completed: 0 },
            };
          }
        })
      );
      
      const sorted = changeDetails.sort((a, b) => a.id.localeCompare(b.id));
      logger.info(JSON.stringify(sorted, null, 2));
    } else {
      if (changes.length === 0) {
        logger.info('No items found');
        return;
      }
      const sorted = [...changes].sort();
      if (!options?.long) {
        // IDs only
        sorted.forEach(id => logger.info(id));
        return;
      }

      // Long format: id: title and minimal counts
      for (const changeName of sorted) {
        const proposalPath = path.join(changesPath, changeName, 'proposal.md');
        const planPath = path.join(changesPath, changeName, 'plan.md');
        try {
          const content = await fs.readFile(proposalPath, 'utf-8');
          const title = this.extractTitle(content, changeName);
          let taskStatusText = '';
          try {
            const planContent = await fs.readFile(planPath, 'utf-8');
            const { total, completed } = this.countTasks(planContent);
            taskStatusText = ` [tasks ${completed}/${total}]`;
          } catch (error) {
            if (process.env.DEBUG) {
              logger.error(`Failed to read plan file at ${planPath}: ${error}`);
            }
          }
          const changeDir = path.join(changesPath, changeName);
          const parser = new ChangeParser(await fs.readFile(proposalPath, 'utf-8'), changeDir);
          const change = await parser.parseChangeWithDeltas(changeName);
          const deltaCountText = ` [deltas ${change.deltas.length}]`;
          logger.info(`${changeName}: ${title}${deltaCountText}${taskStatusText}`);
        } catch {
          logger.info(`${changeName}: (unable to read)`);
        }
      }
    }
  }

  async validate(changeName?: string, options?: { strict?: boolean; json?: boolean; noInteractive?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'grspec', 'changes');
    
    if (!changeName) {
      const canPrompt = isInteractive(options);
      const changes = await getActiveChangeIds();
      if (canPrompt && changes.length > 0) {
        const { select } = await import('@inquirer/prompts');
        const selected = await select({
          message: 'Select a change to validate',
          choices: changes.map(id => ({ name: id, value: id })),
        });
        changeName = selected;
      } else {
        if (changes.length === 0) {
          logger.error('No change specified. No active changes found.');
        } else {
          logger.error(`No change specified. Available IDs: ${changes.join(', ')}`);
        }
        logger.error('Hint: use "grspec change list" to view available changes.');
        process.exitCode = 1;
        return;
      }
    }
    
    const changeDir = path.join(changesPath, changeName);
    
    try {
      await fs.access(changeDir);
    } catch {
      throw new Error(`Change "${changeName}" not found at ${changeDir}`);
    }
    
    const validator = new Validator(options?.strict || false);
    const report = await validator.validateChangeDeltaSpecs(changeDir);
    
    if (options?.json) {
      logger.info(JSON.stringify(report, null, 2));
    } else {
      if (report.valid) {
        logger.info(`Change "${changeName}" is valid`);
      } else {
        logger.error(`Change "${changeName}" has issues`);
        report.issues.forEach(issue => {
          const label = issue.level === 'ERROR' ? 'ERROR' : 'WARNING';
          const prefix = issue.level === 'ERROR' ? '✗' : '⚠';
          logger.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
        });
        // Next steps footer to guide fixing issues
        this.printNextSteps();
        if (!options?.json) {
          process.exitCode = 1;
        }
      }
    }
  }

  async graph(options?: { json?: boolean }): Promise<void> {
    const entries = await this.loadStackEntries();

    const cycles = detectCycles(entries);
    if (cycles.length > 0) {
      const cycleDesc = cycles.map((c) => c.path.join(' → ')).join('\n');
      if (options?.json) {
        logger.info(JSON.stringify({ error: 'cycle', cycles: cycles.map((c) => c.path) }, null, 2));
      } else {
        logger.error(`Dependency cycle detected:\n${cycleDesc}`);
        logger.error('\nBreak the cycle by removing a dependsOn entry from one of the involved changes.');
      }
      process.exitCode = 1;
      return;
    }

    const order = computeTopologicalOrder(entries);

    if (options?.json) {
      const graph = entries.map((e) => ({
        id: e.id,
        dependsOn: e.dependsOn ?? [],
        provides: e.provides ?? [],
        requires: e.requires ?? [],
      }));
      logger.info(JSON.stringify({ order, graph }, null, 2));
    } else {
      logger.info('Dependency order (execute top to bottom):');
      for (let i = 0; i < order.length; i++) {
        const entry = entries.find((e) => e.id === order[i]);
        const deps = entry?.dependsOn?.length ? ` (depends on: ${entry.dependsOn.join(', ')})` : '';
        logger.info(`  ${i + 1}. ${order[i]}${deps}`);
      }
    }
  }

  async next(options?: { json?: boolean }): Promise<void> {
    const entries = await this.loadStackEntries();
    const unblocked = getNextUnblocked(entries);

    if (options?.json) {
      logger.info(JSON.stringify({ next: unblocked }, null, 2));
    } else {
      if (unblocked.length === 0) {
        logger.info('No unblocked changes found.');
      } else {
        logger.info('Unblocked changes (ready to implement/archive):');
        for (const id of unblocked) {
          logger.info(`  - ${id}`);
        }
      }
    }
  }

  async overlap(options?: { json?: boolean; file?: string }): Promise<void> {
    const entries = await this.loadStackEntries();

    if (options?.file) {
      const matching = entries.filter((e) =>
        e.touches?.some((t) => t.path === options.file)
      );
      if (options?.json) {
        const result = matching.map((e) => ({
          id: e.id,
          intent: e.touches?.find((t) => t.path === options.file)?.intent,
        }));
        logger.info(JSON.stringify({ file: options.file, changes: result }, null, 2));
      } else {
        if (matching.length === 0) {
          logger.info(`No active changes touch "${options.file}".`);
        } else {
          logger.info(`Changes touching "${options.file}":`);
          for (const entry of matching) {
            const touch = entry.touches?.find((t) => t.path === options.file);
            logger.info(`  - ${entry.id}: ${touch?.intent ?? '(no intent)'}`);
          }
        }
      }
      return;
    }

    const overlaps = detectOverlaps(entries);

    if (options?.json) {
      logger.info(JSON.stringify({ overlaps }, null, 2));
    } else {
      if (overlaps.length === 0) {
        logger.info('No file-level overlaps detected across active changes.');
      } else {
        logger.info('File-level overlaps:');
        for (const o of overlaps) {
          logger.info(`\n  ${o.path}:`);
          for (const [changeId, intent] of Object.entries(o.intents)) {
            logger.info(`    - ${changeId}: "${intent}"`);
          }
        }
      }
    }
  }

  async split(changeId: string, options?: { children?: string[]; overwrite?: boolean; force?: boolean; json?: boolean }): Promise<void> {
    const changesPath = path.join(process.cwd(), 'grspec', 'changes');
    const childNames = options?.children ?? [];

    if (childNames.length === 0) {
      logger.error('No child names specified. Use: grspec change split <id> --children child-1 child-2');
      process.exitCode = 1;
      return;
    }

    try {
      const result = await splitChange(changesPath, changeId, {
        children: childNames,
        overwrite: options?.overwrite || options?.force,
      });

      if (options?.json) {
        logger.info(JSON.stringify(result, null, 2));
      } else {
        logger.info(`Split "${result.parent}" into ${result.children.length} children:`);
        for (const child of result.children) {
          logger.info(`  - ${child}`);
        }
      }
    } catch (err) {
      if (err instanceof SplitError) {
        logger.error(`Error: ${err.message}`);
        process.exitCode = 1;
      } else {
        throw err;
      }
    }
  }

  private async loadStackEntries(): Promise<ChangeStackEntry[]> {
    const changesPath = path.join(process.cwd(), 'grspec', 'changes');
    const activeIds = await this.getActiveChanges(changesPath);
    const entries: ChangeStackEntry[] = [];

    for (const id of activeIds) {
      const changeDir = path.join(changesPath, id);
      try {
        const metadata = readChangeMetadata(changeDir);
        entries.push({
          id,
          dependsOn: metadata?.dependsOn,
          provides: metadata?.provides,
          requires: metadata?.requires,
          parent: metadata?.parent,
          touches: metadata?.touches,
        });
      } catch {
        entries.push({ id });
      }
    }

    return entries;
  }

  private async getActiveChanges(changesPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(changesPath, { withFileTypes: true });
      const result: string[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === ARCHIVE_DIR) continue;
        const proposalPath = path.join(changesPath, entry.name, 'proposal.md');
        try {
          await fs.access(proposalPath);
          result.push(entry.name);
        } catch {
          // skip directories without proposal.md
        }
      }
      return result.sort();
    } catch {
      return [];
    }
  }

  private extractTitle(content: string, changeName: string): string {
    const match = content.match(/^#\s+(?:Change:\s+)?(.+)$/im);
    return match ? match[1].trim() : changeName;
  }

  private countTasks(content: string): { total: number; completed: number } {
    const lines = content.split('\n');
    let total = 0;
    let completed = 0;
    
    for (const line of lines) {
      if (line.match(TASK_PATTERN)) {
        total++;
        if (line.match(COMPLETED_TASK_PATTERN)) {
          completed++;
        }
      }
    }
    
    return { total, completed };
  }

  private printNextSteps(): void {
    const bullets: string[] = [];
    bullets.push('- Ensure change has deltas in specs/: use headers ## ADDED/MODIFIED/REMOVED/RENAMED Requirements');
    bullets.push('- Each requirement MUST include at least one #### Scenario: block');
    bullets.push('- Debug parsed deltas: grspec show <id> --json --deltas-only');
    logger.error('Next steps:');
    bullets.forEach(b => logger.error(`  ${b}`));
  }
}

export function registerChangeCommand(program: Command): void {
  const changeCmd = program
    .command('change')
    .description('Stacking helpers for active changes (overlap, graph, next, split)');

  changeCmd
    .command('graph')
    .description('Show dependency graph and recommended execution order for active changes')
    .option('--json', 'Output as JSON')
    .action(async (options?: { json?: boolean }) => {
      try {
        const changeCommand = new ChangeCommand();
        await changeCommand.graph(options);
      } catch (error) {
        handleCommandError(error, { command: 'change:graph', json: options?.json });
      }
    });

  changeCmd
    .command('next')
    .description('Show changes not blocked by unresolved dependencies')
    .option('--json', 'Output as JSON')
    .action(async (options?: { json?: boolean }) => {
      try {
        const changeCommand = new ChangeCommand();
        await changeCommand.next(options);
      } catch (error) {
        handleCommandError(error, { command: 'change:next', json: options?.json });
      }
    });

  changeCmd
    .command('overlap')
    .description('Show file-level overlap matrix across active changes')
    .option('--json', 'Output as JSON')
    .option('--file <path>', 'Show changes touching a specific file')
    .action(async (options?: { json?: boolean; file?: string }) => {
      try {
        const changeCommand = new ChangeCommand();
        await changeCommand.overlap(options);
      } catch (error) {
        handleCommandError(error, { command: 'change:overlap', json: options?.json });
      }
    });

  changeCmd
    .command('split <change-id>')
    .description('Split a large change into stackable child slices')
    .option('--children <names...>', 'Names for child changes')
    .option('--overwrite', 'Regenerate existing child scaffolds')
    .option('--force', 'Alias for --overwrite')
    .option('--json', 'Output as JSON')
    .action(async (changeId: string, options?: { children?: string[]; overwrite?: boolean; force?: boolean; json?: boolean }) => {
      try {
        const changeCommand = new ChangeCommand();
        await changeCommand.split(changeId, options);
      } catch (error) {
        handleCommandError(error, { command: 'change:split', json: options?.json });
      }
    });
}
