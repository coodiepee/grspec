import { Command } from 'commander';
import path from 'path';
import { UpdateCommand } from '../core/update.js';
import { handleCommandError } from '../utils/command-error.js';
import { AI_TOOLS } from '../core/config.js';

const availableToolIds = AI_TOOLS.filter((tool) => tool.skillsDir).map((tool) => tool.value);
const toolsOptionDescription = `Target tool(s) to update. Use "all", "none", or a comma-separated list of: ${availableToolIds.join(', ')}`;

export function registerUpdateCommand(program: Command): void {
  program
    .command('update [path]')
    .description('Update grspec instruction files')
    .option('--force', 'Force update even when tools are up to date')
    .option('--tools <tools>', toolsOptionDescription)
    .action(async (targetPath = '.', options?: { force?: boolean; tools?: string }) => {
      try {
        const resolvedPath = path.resolve(targetPath);
        const updateCommand = new UpdateCommand({
          force: options?.force,
          tools: options?.tools,
        });
        await updateCommand.execute(resolvedPath);
      } catch (error) {
        handleCommandError(error, { command: 'update' });
      }
    });
}
