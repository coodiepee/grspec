import { Command } from 'commander';
import { ArchiveCommand } from '../core/archive.js';
import { handleCommandError } from '../utils/command-error.js';

export function registerArchiveCommand(program: Command): void {
  program
    .command('archive [change-name]')
    .description('Archive a completed change and update main specs')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--skip-specs', 'Skip spec update operations (useful for infrastructure, tooling, or doc-only changes)')
    .option('--skip-wiki', 'Skip wiki delta merge during archive')
    .option('--skip-verify', 'Skip the lightweight verification summary')
    .option('--no-validate', 'Skip validation (not recommended, requires confirmation)')
    .option('--force', 'Override incomplete task/plan gate and proceed with archive')
    .action(async (changeName?: string, options?: { yes?: boolean; skipSpecs?: boolean; skipWiki?: boolean; skipVerify?: boolean; noValidate?: boolean; validate?: boolean; force?: boolean }) => {
      try {
        const archiveCommand = new ArchiveCommand();
        await archiveCommand.execute(changeName, options);
      } catch (error) {
        handleCommandError(error, { command: 'archive', changeName });
      }
    });
}
