import { Command } from 'commander';
import { ListCommand } from '../core/list.js';
import { handleCommandError } from '../utils/command-error.js';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List items (changes by default). Use --specs to list specs.')
    .option('--specs', 'List specs instead of changes')
    .option('--changes', 'List changes explicitly (default)')
    .option('--sort <order>', 'Sort order: "recent" (default) or "name"', 'recent')
    .option('--json', 'Output as JSON (for programmatic use)')
    .action(async (options?: { specs?: boolean; changes?: boolean; sort?: string; json?: boolean }) => {
      try {
        const listCommand = new ListCommand();
        const mode: 'changes' | 'specs' = options?.specs ? 'specs' : 'changes';
        const sort = options?.sort === 'name' ? 'name' : 'recent';
        await listCommand.execute('.', mode, { sort, json: options?.json });
      } catch (error) {
        handleCommandError(error, { command: 'list', json: options?.json });
      }
    });
}
