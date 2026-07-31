import { Command } from 'commander';
import path from 'path';
import { promises as fs } from 'fs';
import { AI_TOOLS } from '../core/config.js';
import { handleCommandError } from '../utils/command-error.js';
import { logger } from '../utils/logger.js';

const availableToolIds = AI_TOOLS.filter((tool) => tool.skillsDir).map((tool) => tool.value);
const toolsOptionDescription = `Configure AI tools non-interactively. Use "all", "none", or a comma-separated list of: ${availableToolIds.join(', ')}`;

async function runInit(
  targetPath: string,
  options: { tools?: string; force?: boolean; profile?: string; track?: string; interactive?: boolean },
  commandName: string,
): Promise<void> {
  try {
    const resolvedPath = path.resolve(targetPath);

    try {
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path "${targetPath}" is not a directory`);
      }
    } catch (error: unknown) {
      const code = error instanceof Error && 'code' in error ? (error as NodeJS.ErrnoException).code : undefined;
      if (code === 'ENOENT') {
        logger.info(`Directory "${targetPath}" doesn't exist, it will be created.`);
      } else if (error instanceof Error && error.message?.includes('not a directory')) {
        throw error;
      } else {
        throw new Error(`Cannot access path "${targetPath}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const { InitCommand } = await import('../core/init.js');
    const initCommand = new InitCommand({
      tools: options.tools,
      force: options.force,
      profile: options.profile,
      track: options.track as 'new-project' | 'existing-project' | undefined,
      interactive: options.interactive,
    });
    await initCommand.execute(targetPath);
  } catch (error) {
    handleCommandError(error, { command: commandName });
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command('init [path]')
    .description('Initialize grspec in your project')
    .option('--tools <tools>', toolsOptionDescription)
    .option('--force', 'Force overwrite of conflicting generated files without prompting')
    .option('--profile <profile>', 'Override global config profile (minimal, standard, full, or custom)')
    .option('--track <track>', 'Project track: new-project or existing-project')
    .action(async (targetPath = '.', options?: { tools?: string; force?: boolean; profile?: string; track?: string }) => {
      await runInit(targetPath, options ?? {}, 'init');
    });
}
