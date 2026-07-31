import { Command } from 'commander';
import ora from 'ora';
import { CompletionFactory } from '../core/completions/factory.js';
import { COMMAND_REGISTRY } from '../core/completions/command-registry.js';
import { detectShell, SupportedShell } from '../utils/shell-detection.js';
import { CompletionProvider } from '../core/completions/completion-provider.js';
import { getArchivedChangeIds } from '../utils/item-discovery.js';
import { handleCommandError } from '../utils/command-error.js';
import { logger } from '../utils/logger.js';

interface GenerateOptions {
  shell?: string;
}

interface InstallOptions {
  shell?: string;
  verbose?: boolean;
}

interface UninstallOptions {
  shell?: string;
  yes?: boolean;
}

interface CompleteOptions {
  type: string;
}

/**
 * Command for managing shell completions for grspec CLI
 */
export class CompletionCommand {
  private completionProvider: CompletionProvider;

  constructor() {
    this.completionProvider = new CompletionProvider();
  }
  /**
   * Resolve shell parameter or exit with error
   *
   * @param shell - The shell parameter (may be undefined)
   * @param operationName - Name of the operation (for error messages)
   * @returns Resolved shell or null if should exit
   */
  private resolveShellOrExit(shell: string | undefined, operationName: string): SupportedShell | null {
    const normalizedShell = this.normalizeShell(shell);

    if (!normalizedShell) {
      const detectionResult = detectShell();

      if (detectionResult.shell && CompletionFactory.isSupported(detectionResult.shell)) {
        return detectionResult.shell;
      }

      // Shell was detected but not supported
      if (detectionResult.detected && !detectionResult.shell) {
        logger.error(`Error: Shell '${detectionResult.detected}' is not supported yet. Currently supported: ${CompletionFactory.getSupportedShells().join(', ')}`);
        process.exitCode = 1;
        return null;
      }

      // No shell specified and cannot auto-detect
      logger.error('Error: Could not auto-detect shell. Please specify shell explicitly.');
      logger.error(`Usage: grspec completion ${operationName} [shell]`);
      logger.error(`Currently supported: ${CompletionFactory.getSupportedShells().join(', ')}`);
      process.exitCode = 1;
      return null;
    }

    if (!CompletionFactory.isSupported(normalizedShell)) {
      logger.error(`Error: Shell '${normalizedShell}' is not supported yet. Currently supported: ${CompletionFactory.getSupportedShells().join(', ')}`);
      process.exitCode = 1;
      return null;
    }

    return normalizedShell;
  }

  /**
   * Generate completion script and output to stdout
   *
   * @param options - Options for generation (shell type)
   */
  async generate(options: GenerateOptions = {}): Promise<void> {
    const shell = this.resolveShellOrExit(options.shell, 'generate');
    if (!shell) return;

    await this.generateForShell(shell);
  }

  /**
   * Install completion script to the appropriate location
   *
   * @param options - Options for installation (shell type, verbose output)
   */
  async install(options: InstallOptions = {}): Promise<void> {
    const shell = this.resolveShellOrExit(options.shell, 'install');
    if (!shell) return;

    await this.installForShell(shell, options.verbose || false);
  }

  /**
   * Uninstall completion script from the installation location
   *
   * @param options - Options for uninstallation (shell type, yes flag)
   */
  async uninstall(options: UninstallOptions = {}): Promise<void> {
    const shell = this.resolveShellOrExit(options.shell, 'uninstall');
    if (!shell) return;

    await this.uninstallForShell(shell, options.yes || false);
  }

  /**
   * Generate completion script for a specific shell
   */
  private async generateForShell(shell: SupportedShell): Promise<void> {
    const generator = CompletionFactory.createGenerator(shell);
    const script = generator.generate(COMMAND_REGISTRY);
    logger.info(script);
  }

  /**
   * Install completion script for a specific shell
   */
  private async installForShell(shell: SupportedShell, verbose: boolean): Promise<void> {
    const generator = CompletionFactory.createGenerator(shell);
    const installer = CompletionFactory.createInstaller(shell);

    const spinner = ora(`Installing ${shell} completion script...`).start();

    try {
      // Generate the completion script
      const script = generator.generate(COMMAND_REGISTRY);

      // Install it
      const result = await installer.install(script);

      spinner.stop();

      if (result.success) {
        logger.info(`✓ ${result.message}`);

        if (verbose && result.installedPath) {
          logger.info(`  Installed to: ${result.installedPath}`);
          if (result.backupPath) {
            logger.info(`  Backup created: ${result.backupPath}`);
          }

          // Check if any shell config was updated
          const configWasUpdated = result.zshrcConfigured || result.bashrcConfigured || result.profileConfigured;

          if (configWasUpdated) {
            const configPaths: Record<string, string> = {
              zsh: '~/.zshrc',
              bash: '~/.bashrc',
              fish: '~/.config/fish/config.fish',
              powershell: '$PROFILE',
            };
            const configPath = configPaths[shell] || 'config file';
            logger.info(`  ${configPath} configured automatically`);
          }
        }

        // Display warnings if present
        if (result.warnings && result.warnings.length > 0) {
          logger.info('');
          for (const warning of result.warnings) {
            logger.info(warning);
          }
        }

        // Print instructions (only shown if .zshrc wasn't auto-configured)
        if (result.instructions && result.instructions.length > 0) {
          logger.info('');
          for (const instruction of result.instructions) {
            logger.info(instruction);
          }
        } else {
          // Check if any shell config was updated (InstallationResult has: zshrcConfigured, bashrcConfigured, profileConfigured)
          const configWasUpdated = result.zshrcConfigured || result.bashrcConfigured || result.profileConfigured;

          if (configWasUpdated) {
            logger.info('');

            // Shell-specific reload instructions
            const reloadCommands: Record<string, string> = {
              zsh: 'exec zsh',
              bash: 'exec bash',
              fish: 'exec fish',
              powershell: '. $PROFILE',
            };
            const reloadCmd = reloadCommands[shell] || `restart your ${shell} shell`;

            logger.info(`Restart your shell or run: ${reloadCmd}`);
          }
        }
      } else {
        logger.error(`✗ ${result.message}`);
        process.exitCode = 1;
      }
    } catch (error) {
      spinner.stop();
      logger.error(`✗ Failed to install completion script: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }

  /**
   * Uninstall completion script for a specific shell
   */
  private async uninstallForShell(shell: SupportedShell, skipConfirmation: boolean): Promise<void> {
    const installer = CompletionFactory.createInstaller(shell);

    // Prompt for confirmation unless --yes flag is provided
    if (!skipConfirmation) {
      const { confirm } = await import('@inquirer/prompts');

      // Get shell-specific config file path
      const configPaths: Record<string, string> = {
        zsh: '~/.zshrc',
        bash: '~/.bashrc',
        fish: 'Fish configuration',  // Fish doesn't modify profile, just removes script file
        powershell: '$PROFILE',
      };
      const configPath = configPaths[shell] || `${shell} configuration`;

      const confirmed = await confirm({
        message: `Remove grspec configuration from ${configPath}?`,
        default: false,
      });

      if (!confirmed) {
        logger.info('Uninstall cancelled.');
        return;
      }
    }

    const spinner = ora(`Uninstalling ${shell} completion script...`).start();

    try {
      const result = await installer.uninstall();

      spinner.stop();

      if (result.success) {
        logger.info(`✓ ${result.message}`);
      } else {
        logger.error(`✗ ${result.message}`);
        process.exitCode = 1;
      }
    } catch (error) {
      spinner.stop();
      logger.error(`✗ Failed to uninstall completion script: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }

  /**
   * Output machine-readable completion data for shell consumption
   * Format: tab-separated "id\tdescription" per line
   *
   * @param options - Options specifying completion type
   */
  async complete(options: CompleteOptions): Promise<void> {
    const type = options.type.toLowerCase();

    try {
      switch (type) {
        case 'changes': {
          const changeIds = await this.completionProvider.getChangeIds();
          for (const id of changeIds) {
            logger.info(`${id}\tactive change`);
          }
          break;
        }
        case 'specs': {
          const specIds = await this.completionProvider.getSpecIds();
          for (const id of specIds) {
            logger.info(`${id}\tspecification`);
          }
          break;
        }
        case 'schemas': {
          const schemaNames = await this.completionProvider.getSchemaNames();
          for (const name of schemaNames) {
            logger.info(`${name}\tschema`);
          }
          break;
        }
        case 'archived-changes': {
          const archivedIds = await getArchivedChangeIds();
          for (const id of archivedIds) {
            logger.info(`${id}\tarchived change`);
          }
          break;
        }
        default:
          // Invalid type - silently exit with no output for graceful shell completion failure
          process.exitCode = 1;
          break;
      }
    } catch {
      // Silently fail for graceful shell completion experience
      process.exitCode = 1;
    }
  }

  /**
   * Normalize shell parameter to lowercase
   */
  private normalizeShell(shell?: string): string | undefined {
    return shell?.toLowerCase();
  }
}

export function registerCompletionCommand(program: Command): void {
  const completionCmd = program
    .command('completion')
    .description('Manage shell completions for grspec CLI');

  completionCmd
    .command('generate [shell]')
    .description('Generate completion script for a shell (outputs to stdout)')
    .action(async (shell?: string) => {
      try {
        const completionCommand = new CompletionCommand();
        await completionCommand.generate({ shell });
      } catch (error) {
        handleCommandError(error, { command: 'completion:generate' });
      }
    });

  completionCmd
    .command('install [shell]')
    .description('Install completion script for a shell')
    .option('--verbose', 'Show detailed installation output')
    .action(async (shell?: string, options?: { verbose?: boolean }) => {
      try {
        const completionCommand = new CompletionCommand();
        await completionCommand.install({ shell, verbose: options?.verbose });
      } catch (error) {
        handleCommandError(error, { command: 'completion:install' });
      }
    });

  completionCmd
    .command('uninstall [shell]')
    .description('Uninstall completion script for a shell')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (shell?: string, options?: { yes?: boolean }) => {
      try {
        const completionCommand = new CompletionCommand();
        await completionCommand.uninstall({ shell, yes: options?.yes });
      } catch (error) {
        handleCommandError(error, { command: 'completion:uninstall' });
      }
    });

  // Hidden command for machine-readable completion data
  program
    .command('__complete <type>', { hidden: true })
    .description('Output completion data in machine-readable format (internal use)')
    .action(async (type: string) => {
      try {
        const completionCommand = new CompletionCommand();
        await completionCommand.complete({ type });
      } catch {
        process.exitCode = 1;
      }
    });
}
