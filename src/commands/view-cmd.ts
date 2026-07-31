import { Command } from 'commander';
import { ViewCommand } from '../core/view.js';
import { handleCommandError } from '../utils/command-error.js';

export function registerViewCommand(program: Command): void {
  program
    .command('view')
    .description('Display an interactive dashboard of specs and changes')
    .action(async () => {
      try {
        const viewCommand = new ViewCommand();
        await viewCommand.execute('.');
      } catch (error) {
        handleCommandError(error, { command: 'view' });
      }
    });
}
