import { Command } from 'commander';
import { spawn, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getGlobalConfigPath,
  getGlobalConfig,
  saveGlobalConfig,
  GlobalConfig,
} from '../core/global-config.js';
import type { Profile, Delivery } from '../core/global-config.js';
import {
  getNestedValue,
  setNestedValue,
  deleteNestedValue,
  coerceValue,
  formatValueYaml,
  validateConfigKeyPath,
  validateConfig,
  DEFAULT_CONFIG,
} from '../core/config-schema.js';
import { MINIMAL_WORKFLOWS, STANDARD_WORKFLOWS, FULL_WORKFLOWS, ALL_WORKFLOWS, getProfileWorkflows, sanitizeWorkflowIds } from '../core/profiles.js';
import { GRSPEC_DIR_NAME } from '../core/config.js';
import { hasProjectConfigDrift } from '../core/profile-sync-drift.js';
import { logger } from '../utils/logger.js';

type ProfileAction = 'both' | 'delivery' | 'workflows' | 'keep';

interface ProfileState {
  profile: Profile;
  delivery: Delivery;
  workflows: string[];
}

interface ProfileStateDiff {
  hasChanges: boolean;
  lines: string[];
}

interface WorkflowPromptMeta {
  name: string;
  description: string;
}

const WORKFLOW_PROMPT_META: Record<string, WorkflowPromptMeta> = {
  propose: {
    name: 'Propose change',
    description: 'Create proposal, design, and tasks from a request',
  },
  explore: {
    name: 'Explore ideas',
    description: 'Investigate a problem before implementation',
  },
  new: {
    name: 'New change',
    description: 'Create a new change scaffold quickly',
  },
  continue: {
    name: 'Continue change',
    description: 'Resume work on an existing change',
  },
  apply: {
    name: 'Apply tasks',
    description: 'Implement tasks from the current change',
  },
  ff: {
    name: 'Fast-forward',
    description: 'Run a faster implementation workflow',
  },
  sync: {
    name: 'Sync specs',
    description: 'Sync change artifacts with specs',
  },
  archive: {
    name: 'Archive change',
    description: 'Finalize and archive a completed change',
  },
  'bulk-archive': {
    name: 'Bulk archive',
    description: 'Archive multiple completed changes together',
  },
  verify: {
    name: 'Verify change',
    description: 'Verify implementation against change artifacts (with evidence gate)',
  },
  validate: {
    name: 'Validate specs',
    description: 'Run grspec validate for structural checks on changes and specs',
  },
  onboard: {
    name: 'Onboard',
    description: 'Guided onboarding flow for grspec',
  },
};

function isPromptCancellationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ExitPromptError' || error.message.includes('force closed the prompt with SIGINT'))
  );
}

/**
 * Resolve the effective current profile state from global config defaults.
 */
export function resolveCurrentProfileState(config: GlobalConfig): ProfileState {
  const profile = config.profile || 'standard';
  const delivery = config.delivery || 'both';
  const workflows = [
    ...getProfileWorkflows(profile, config.workflows ? [...config.workflows] : undefined),
  ];
  return { profile, delivery, workflows };
}

/**
 * Derive profile type from selected workflows.
 */
export function deriveProfileFromWorkflowSelection(selectedWorkflows: string[]): Profile {
  const matches = (tier: readonly string[]) =>
    selectedWorkflows.length === tier.length &&
    tier.every((w) => selectedWorkflows.includes(w));

  if (matches(MINIMAL_WORKFLOWS)) return 'minimal';
  if (matches(STANDARD_WORKFLOWS)) return 'standard';
  if (matches(FULL_WORKFLOWS)) return 'full';
  return 'custom';
}

/**
 * Format a compact workflow summary for the profile header.
 */
export function formatWorkflowSummary(workflows: readonly string[], profile: Profile): string {
  return `${workflows.length} selected (${profile})`;
}

function stableWorkflowOrder(workflows: readonly string[]): string[] {
  const sanitized = sanitizeWorkflowIds(workflows);
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const workflow of ALL_WORKFLOWS) {
    if (sanitized.includes(workflow) && !seen.has(workflow)) {
      ordered.push(workflow);
      seen.add(workflow);
    }
  }

  const extras = sanitized.filter((w) => !ALL_WORKFLOWS.includes(w as (typeof ALL_WORKFLOWS)[number]));
  extras.sort();
  for (const extra of extras) {
    if (!seen.has(extra)) {
      ordered.push(extra);
      seen.add(extra);
    }
  }

  return ordered;
}

/**
 * Build a user-facing diff summary between two profile states.
 */
export function diffProfileState(before: ProfileState, after: ProfileState): ProfileStateDiff {
  const lines: string[] = [];

  if (before.delivery !== after.delivery) {
    lines.push(`delivery: ${before.delivery} -> ${after.delivery}`);
  }

  if (before.profile !== after.profile) {
    lines.push(`profile: ${before.profile} -> ${after.profile}`);
  }

  const beforeOrdered = stableWorkflowOrder(before.workflows);
  const afterOrdered = stableWorkflowOrder(after.workflows);
  const beforeSet = new Set(beforeOrdered);
  const afterSet = new Set(afterOrdered);

  const added = afterOrdered.filter((w) => !beforeSet.has(w));
  const removed = beforeOrdered.filter((w) => !afterSet.has(w));

  if (added.length > 0 || removed.length > 0) {
    const tokens: string[] = [];
    if (added.length > 0) {
      tokens.push(`added ${added.join(', ')}`);
    }
    if (removed.length > 0) {
      tokens.push(`removed ${removed.join(', ')}`);
    }
    lines.push(`workflows: ${tokens.join('; ')}`);
  }

  return {
    hasChanges: lines.length > 0,
    lines,
  };
}

function maybeWarnConfigDrift(
  projectDir: string,
  state: ProfileState,
  colorize: (message: string) => string
): void {
  const grspecDir = path.join(projectDir, GRSPEC_DIR_NAME);
  if (!fs.existsSync(grspecDir)) {
    return;
  }
  if (!hasProjectConfigDrift(projectDir, state.workflows, state.delivery)) {
    return;
  }
  logger.info(colorize('Warning: Global config is not applied to this project. Run `grspec update` to sync.'));
}

/**
 * Register the config command and all its subcommands.
 *
 * @param program - The Commander program instance
 */
export function registerConfigCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('View and modify global grspec configuration')
    .option('--scope <scope>', 'Config scope (only "global" supported currently)')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.scope && opts.scope !== 'global') {
        throw new Error('Project-local config is not yet implemented. Only --scope global is supported.');
      }
    });

  // config path
  configCmd
    .command('path')
    .description('Show config file location')
    .action(() => {
      logger.info(getGlobalConfigPath());
    });

  // config list
  configCmd
    .command('list')
    .description('Show all current settings')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      const config = getGlobalConfig();

      if (options.json) {
        logger.info(JSON.stringify(config, null, 2));
      } else {
        // Read raw config to determine which values are explicit vs defaults
        const configPath = getGlobalConfigPath();
        let rawConfig: Record<string, unknown> = {};
        try {
          if (fs.existsSync(configPath)) {
            rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          }
        } catch {
          // If reading fails, treat all as defaults
        }

        logger.info(formatValueYaml(config));

        // Annotate profile settings
        const profileSource = rawConfig.profile !== undefined ? '(explicit)' : '(default)';
        const deliverySource = rawConfig.delivery !== undefined ? '(explicit)' : '(default)';
        logger.info(`\nProfile settings:`);
        logger.info(`  profile: ${config.profile} ${profileSource}`);
        logger.info(`  delivery: ${config.delivery} ${deliverySource}`);
        const profileWorkflowList = getProfileWorkflows(config.profile || 'standard', config.workflows ? [...config.workflows] : undefined);
        if (config.profile !== 'custom') {
          logger.info(`  workflows: ${[...profileWorkflowList].join(', ')} (from ${config.profile || 'standard'} profile)`);
        } else if (config.workflows && config.workflows.length > 0) {
          logger.info(`  workflows: ${config.workflows.join(', ')} (explicit)`);
        } else {
          logger.info(`  workflows: (none)`);
        }
      }
    });

  // config get
  configCmd
    .command('get <key>')
    .description('Get a specific value (raw, scriptable)')
    .action((key: string) => {
      const config = getGlobalConfig();
      const value = getNestedValue(config as Record<string, unknown>, key);

      if (value === undefined) {
        process.exitCode = 1;
        return;
      }

      if (typeof value === 'object' && value !== null) {
        logger.info(JSON.stringify(value));
      } else {
        logger.info(String(value));
      }
    });

  // config set
  configCmd
    .command('set <key> <value>')
    .description('Set a value (auto-coerce types)')
    .option('--string', 'Force value to be stored as string')
    .option('--allow-unknown', 'Allow setting unknown keys')
    .action((key: string, value: string, options: { string?: boolean; allowUnknown?: boolean }) => {
      const allowUnknown = Boolean(options.allowUnknown);
      const keyValidation = validateConfigKeyPath(key);
      if (!keyValidation.valid && !allowUnknown) {
        const reason = keyValidation.reason ? ` ${keyValidation.reason}.` : '';
        logger.error(`Error: Invalid configuration key "${key}".${reason}`);
        logger.error('Use "grspec config list" to see available keys.');
        logger.error('Pass --allow-unknown to bypass this check.');
        process.exitCode = 1;
        return;
      }

      const config = getGlobalConfig() as Record<string, unknown>;
      const coercedValue = coerceValue(value, options.string || false);

      // Create a copy to validate before saving
      const newConfig = JSON.parse(JSON.stringify(config));
      setNestedValue(newConfig, key, coercedValue);

      // Validate the new config
      const validation = validateConfig(newConfig);
      if (!validation.success) {
        logger.error(`Error: Invalid configuration - ${validation.error}`);
        process.exitCode = 1;
        return;
      }

      // Apply changes and save
      setNestedValue(config, key, coercedValue);
      saveGlobalConfig(config as GlobalConfig);

      const displayValue =
        typeof coercedValue === 'string' ? `"${coercedValue}"` : String(coercedValue);
      logger.info(`Set ${key} = ${displayValue}`);
    });

  // config unset
  configCmd
    .command('unset <key>')
    .description('Remove a key (revert to default)')
    .action((key: string) => {
      const config = getGlobalConfig() as Record<string, unknown>;
      const existed = deleteNestedValue(config, key);

      if (existed) {
        saveGlobalConfig(config as GlobalConfig);
        logger.info(`Unset ${key} (reverted to default)`);
      } else {
        logger.info(`Key "${key}" was not set`);
      }
    });

  // config reset
  configCmd
    .command('reset')
    .description('Reset configuration to defaults')
    .option('--all', 'Reset all configuration (required)')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options: { all?: boolean; yes?: boolean }) => {
      if (!options.all) {
        logger.error('Error: --all flag is required for reset');
        logger.error('Usage: grspec config reset --all [-y]');
        process.exitCode = 1;
        return;
      }

      if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        let confirmed: boolean;
        try {
          confirmed = await confirm({
            message: 'Reset all configuration to defaults?',
            default: false,
          });
        } catch (error) {
          if (isPromptCancellationError(error)) {
            logger.info('Reset cancelled.');
            process.exitCode = 130;
            return;
          }
          throw error;
        }

        if (!confirmed) {
          logger.info('Reset cancelled.');
          return;
        }
      }

      saveGlobalConfig({ ...DEFAULT_CONFIG });
      logger.info('Configuration reset to defaults');
    });

  // config edit
  configCmd
    .command('edit')
    .description('Open config in $EDITOR')
    .action(async () => {
      const editor = process.env.EDITOR || process.env.VISUAL;

      if (!editor) {
        logger.error('Error: No editor configured');
        logger.error('Set the EDITOR or VISUAL environment variable to your preferred editor');
        logger.error('Example: export EDITOR=vim');
        process.exitCode = 1;
        return;
      }

      const configPath = getGlobalConfigPath();

      // Ensure config file exists with defaults
      if (!fs.existsSync(configPath)) {
        saveGlobalConfig({ ...DEFAULT_CONFIG });
      }

      // Spawn editor and wait for it to close
      // Avoid shell parsing to correctly handle paths with spaces in both
      // the editor path and config path
      const child = spawn(editor, [configPath], {
        stdio: 'inherit',
        shell: false,
      });

      await new Promise<void>((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Editor exited with code ${code}`));
          }
        });
        child.on('error', reject);
      });

      try {
        const rawConfig = fs.readFileSync(configPath, 'utf-8');
        const parsedConfig = JSON.parse(rawConfig);
        const validation = validateConfig(parsedConfig);

        if (!validation.success) {
          logger.error(`Error: Invalid configuration - ${validation.error}`);
          process.exitCode = 1;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          logger.error(`Error: Config file not found at ${configPath}`);
        } else if (error instanceof SyntaxError) {
          logger.error(`Error: Invalid JSON in ${configPath}`);
          logger.error(error.message);
        } else {
          logger.error(`Error: Unable to validate configuration - ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exitCode = 1;
      }
    });

  // config profile [preset]
  configCmd
    .command('profile [preset]')
    .description('Configure workflow profile (interactive picker or preset shortcut)')
    .action(async (preset?: string) => {
      const presetMap: Record<string, { profile: Profile; workflows: readonly string[] }> = {
        minimal: { profile: 'minimal', workflows: MINIMAL_WORKFLOWS },
        standard: { profile: 'standard', workflows: STANDARD_WORKFLOWS },
        full: { profile: 'full', workflows: FULL_WORKFLOWS },
      };

      if (preset && preset in presetMap) {
        const entry = presetMap[preset];
        const config = getGlobalConfig();
        config.profile = entry.profile;
        config.workflows = [...entry.workflows];
        saveGlobalConfig(config);
        logger.info('Config updated. Run `grspec update` in your projects to apply.');
        return;
      }

      if (preset) {
        logger.error(`Error: Unknown profile preset "${preset}". Available presets: minimal, standard, full`);
        process.exitCode = 1;
        return;
      }

      // Non-interactive check
      if (!process.stdout.isTTY) {
        logger.error('Interactive mode required. Use `grspec config profile standard` or set config via environment/flags.');
        process.exitCode = 1;
        return;
      }

      // Interactive picker
      const { select, checkbox, confirm } = await import('@inquirer/prompts');
      const chalk = (await import('chalk')).default;

      try {
        const config = getGlobalConfig();
        const currentState = resolveCurrentProfileState(config);

        logger.info(chalk.bold('\nCurrent profile settings'));
        logger.info(`  Delivery: ${currentState.delivery}`);
        logger.info(`  Workflows: ${formatWorkflowSummary(currentState.workflows, currentState.profile)}`);
        logger.info(chalk.dim('  Delivery = where workflow files are generated (skills, commands, or both)'));
        logger.info(chalk.dim('  Workflows = which AI skill files are generated (all CLI commands work regardless)'));
        logger.info('');

        const action = await select<ProfileAction>({
          message: 'What do you want to configure?',
          choices: [
            {
              value: 'both',
              name: 'Delivery and workflows',
              description: 'Update install mode and available actions together',
            },
            {
              value: 'delivery',
              name: 'Delivery only',
              description: 'Change where workflows are installed',
            },
            {
              value: 'workflows',
              name: 'Workflows only',
              description: 'Change which workflows get AI skill files generated',
            },
            {
              value: 'keep',
              name: 'Keep current settings (exit)',
              description: 'Leave configuration unchanged and exit',
            },
          ],
        });

        if (action === 'keep') {
          logger.info('No config changes.');
          maybeWarnConfigDrift(process.cwd(), currentState, chalk.yellow);
          return;
        }

        const nextState: ProfileState = {
          profile: currentState.profile,
          delivery: currentState.delivery,
          workflows: [...currentState.workflows],
        };

        if (action === 'both' || action === 'delivery') {
          const deliveryChoices: { value: Delivery; name: string; description: string }[] = [
            {
              value: 'both' as Delivery,
              name: 'Both (skills + commands)',
              description: 'Install workflows as both skills and slash commands',
            },
            {
              value: 'skills' as Delivery,
              name: 'Skills only',
              description: 'Install workflows only as skills',
            },
            {
              value: 'commands' as Delivery,
              name: 'Commands only',
              description: 'Install workflows only as slash commands',
            },
          ];
          for (const choice of deliveryChoices) {
            if (choice.value === currentState.delivery) {
              choice.name += ' [current]';
            }
          }

          nextState.delivery = await select<Delivery>({
            message: 'Delivery mode (how workflows are installed):',
            choices: deliveryChoices,
            default: currentState.delivery,
          });
        }

        if (action === 'both' || action === 'workflows') {
          const formatWorkflowChoice = (workflow: string) => {
            const metadata = WORKFLOW_PROMPT_META[workflow] ?? {
              name: workflow,
              description: `Workflow: ${workflow}`,
            };
            return {
              value: workflow,
              name: metadata.name,
              description: metadata.description,
              short: metadata.name,
              checked: currentState.workflows.includes(workflow),
            };
          };

          const selectedWorkflows = await checkbox<string>({
            message: 'Select workflows to generate AI skill files for:',
            instructions: 'Space to toggle, Enter to confirm',
            pageSize: ALL_WORKFLOWS.length,
            theme: {
              icon: {
                checked: '[x]',
                unchecked: '[ ]',
              },
            },
            choices: ALL_WORKFLOWS.map(formatWorkflowChoice),
          });
          nextState.workflows = selectedWorkflows;
          nextState.profile = deriveProfileFromWorkflowSelection(selectedWorkflows);
        }

        const diff = diffProfileState(currentState, nextState);
        if (!diff.hasChanges) {
          logger.info('No config changes.');
          maybeWarnConfigDrift(process.cwd(), nextState, chalk.yellow);
          return;
        }

        logger.info(chalk.bold('\nConfig changes:'));
        for (const line of diff.lines) {
          logger.info(`  ${line}`);
        }
        logger.info('');

        config.profile = nextState.profile;
        config.delivery = nextState.delivery;
        config.workflows = nextState.workflows;
        saveGlobalConfig(config);

        // Check if inside an grspec project
        const projectDir = process.cwd();
        const grspecDir = path.join(projectDir, GRSPEC_DIR_NAME);
        if (fs.existsSync(grspecDir)) {
          const applyNow = await confirm({
            message: 'Apply changes to this project now?',
            default: true,
          });

          if (applyNow) {
            try {
              execSync('npx grspec update', { stdio: 'inherit', cwd: projectDir });
              logger.info('Run `grspec update` in your other projects to apply.');
            } catch {
              logger.error('`grspec update` failed. Please run it manually to apply the profile changes.');
              process.exitCode = 1;
            }
            return;
          }
        }

        logger.info('Config updated. Run `grspec update` in your projects to apply.');
      } catch (error) {
        if (isPromptCancellationError(error)) {
          logger.info('Config profile cancelled.');
          process.exitCode = 130;
          return;
        }
        throw error;
      }
    });
}
