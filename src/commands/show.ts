import { Command } from 'commander';
import path from 'path';
import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds, getSpecIds } from '../utils/item-discovery.js';
import { ChangeCommand } from './change.js';
import { SpecCommand } from './spec.js';
import { nearestMatches } from '../utils/match.js';
import { handleCommandError } from '../utils/command-error.js';
import { logger } from '../utils/logger.js';

type ItemType = 'change' | 'spec';

const CHANGE_FLAG_KEYS = new Set(['deltasOnly']);
const SPEC_FLAG_KEYS = new Set(['requirements', 'scenarios', 'requirement']);

export class ShowCommand {
  async execute(itemName?: string, options: { json?: boolean; type?: string; noInteractive?: boolean; [k: string]: unknown } = {}): Promise<void> {
    const interactive = isInteractive(options);
    const typeOverride = this.normalizeType(options.type);

    if (!itemName) {
      if (interactive) {
        const { select } = await import('@inquirer/prompts');
        const type = await select<ItemType>({
          message: 'What would you like to show?',
          choices: [
            { name: 'Change', value: 'change' as const },
            { name: 'Spec', value: 'spec' as const },
          ],
        });
        await this.runInteractiveByType(type, options);
        return;
      }
      this.printNonInteractiveHint();
      process.exitCode = 1;
      return;
    }

    await this.showDirect(itemName, { typeOverride, options });
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'spec') return v;
    return undefined;
  }

  private async runInteractiveByType(type: ItemType, options: { json?: boolean; noInteractive?: boolean; [k: string]: unknown }): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    if (type === 'change') {
      const changes = await getActiveChangeIds();
      if (changes.length === 0) {
        logger.error('No changes found.');
        process.exitCode = 1;
        return;
      }
      const picked = await select<string>({ message: 'Pick a change', choices: changes.map(id => ({ name: id, value: id })) });
      const cmd = new ChangeCommand();
      await cmd.show(picked, options as Record<string, unknown>);
      return;
    }

    const specs = await getSpecIds();
    if (specs.length === 0) {
      logger.error('No specs found.');
      process.exitCode = 1;
      return;
    }
    const picked = await select<string>({ message: 'Pick a spec', choices: specs.map(id => ({ name: id, value: id })) });
    const cmd = new SpecCommand();
    await cmd.show(picked, options as Record<string, unknown>);
  }

  private async showDirect(itemName: string, params: { typeOverride?: ItemType; options: { json?: boolean; [k: string]: unknown } }): Promise<void> {
    // Optimize lookups when type is pre-specified
    let isChange = false;
    let isSpec = false;
    let changes: string[] = [];
    let specs: string[] = [];
    if (params.typeOverride === 'change') {
      changes = await getActiveChangeIds();
      isChange = changes.includes(itemName);
    } else if (params.typeOverride === 'spec') {
      specs = await getSpecIds();
      isSpec = specs.includes(itemName);
    } else {
      [changes, specs] = await Promise.all([getActiveChangeIds(), getSpecIds()]);
      isChange = changes.includes(itemName);
      isSpec = specs.includes(itemName);
    }

    const resolvedType = params.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);

    if (!resolvedType) {
      logger.error(`Unknown item '${itemName}'`);
      const suggestions = nearestMatches(itemName, [...changes, ...specs]);
      if (suggestions.length) logger.error(`Did you mean: ${suggestions.join(', ')}?`);
      process.exitCode = 1;
      return;
    }

    if (!params.typeOverride && isChange && isSpec) {
      logger.error(`Ambiguous item '${itemName}' matches both a change and a spec.`);
      logger.error('Pass --type change|spec to disambiguate');
      process.exitCode = 1;
      return;
    }

    this.warnIrrelevantFlags(resolvedType, params.options);
    if (resolvedType === 'change') {
      const cmd = new ChangeCommand();
      await cmd.show(itemName, params.options as Record<string, unknown>);
      return;
    }
    const cmd = new SpecCommand();
    await cmd.show(itemName, params.options as Record<string, unknown>);
  }

  private printNonInteractiveHint(): void {
    logger.error('Nothing to show. Try one of:');
    logger.error('  grspec show <item>');
    logger.error('  grspec show --type change');
    logger.error('  grspec show --type spec');
    logger.error('Or run in an interactive terminal.');
  }

  private warnIrrelevantFlags(type: ItemType, options: { [k: string]: unknown }): boolean {
    const irrelevant: string[] = [];
    if (type === 'change') {
      for (const k of SPEC_FLAG_KEYS) if (k in options) irrelevant.push(k);
    } else {
      for (const k of CHANGE_FLAG_KEYS) if (k in options) irrelevant.push(k);
    }
    if (irrelevant.length > 0) {
      logger.error(`Warning: Ignoring flags not applicable to ${type}: ${irrelevant.join(', ')}`);
      return true;
    }
    return false;
  }
}

export function registerShowCommand(program: Command): void {
  program
    .command('show [item-name]')
    .description('Show a change or spec')
    .option('--json', 'Output as JSON')
    .option('--type <type>', 'Specify item type when ambiguous: change|spec')
    .option('--no-interactive', 'Disable interactive prompts')
    .option('--deltas-only', 'Show only deltas (JSON only, change)')
    .option('--requirements', 'JSON only: Show only requirements (exclude scenarios)')
    .option('--no-scenarios', 'JSON only: Exclude scenario content')
    .option('-r, --requirement <id>', 'JSON only: Show specific requirement by ID (1-based)')
    .allowUnknownOption(true)
    .action(async (itemName?: string, options?: { json?: boolean; type?: string; noInteractive?: boolean; [k: string]: unknown }) => {
      try {
        const showCommand = new ShowCommand();
        await showCommand.execute(itemName, options ?? {});
      } catch (error) {
        handleCommandError(error, { command: 'show', json: options?.json });
      }
    });
}
