import { Command } from 'commander';
import { createRequire } from 'module';
import { registerInitCommand } from '../commands/init.js';
import { registerUpdateCommand } from '../commands/update.js';
import { registerListCommand } from '../commands/list-cmd.js';
import { registerViewCommand } from '../commands/view-cmd.js';
import { registerArchiveCommand } from '../commands/archive-cmd.js';
import { registerChangeCommand } from '../commands/change.js';
import { registerValidateCommand } from '../commands/validate.js';
import { registerShowCommand } from '../commands/show.js';
import { registerFeedbackCommand } from '../commands/feedback.js';
import { registerCompletionCommand } from '../commands/completion.js';
import { registerActivityCommand } from '../commands/activity.js';
import { registerConfigCommand } from '../commands/config.js';
import { registerSchemaCommand } from '../commands/schema.js';
import { registerWorkspaceCommand } from '../commands/workspace.js';
import { registerWikiCommand } from '../commands/wiki.js';
import { registerUiCommand } from '../commands/ui.js';
import { registerWorkflowCommands } from '../commands/workflow/index.js';
import { maybeShowTelemetryNotice, trackCommand, shutdown } from '../telemetry/index.js';
import { logger, LogLevel } from '../utils/logger.js';

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

/**
 * Get the full command path for nested commands.
 * For example: 'change show' -> 'change:show'
 */
function getCommandPath(command: Command): string {
  const names: string[] = [];
  let current: Command | null = command;

  while (current) {
    const name = current.name();
    if (name && name !== 'grspec') {
      names.unshift(name);
    }
    current = current.parent;
  }

  return names.join(':') || 'grspec';
}

program
  .name('grspec')
  .description('AI-native system for spec-driven development')
  .version(version);

program.option('--no-color', 'Disable color output');
program.option('--verbose', 'Enable debug output');

program.hook('preAction', async (thisCommand, actionCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }
  if (opts.verbose) {
    logger.setLevel(LogLevel.DEBUG);
  }
  await maybeShowTelemetryNotice();
  const commandPath = getCommandPath(actionCommand);
  await trackCommand(commandPath, version);
});

program.hook('postAction', async () => {
  await shutdown();
});

// Register all commands
registerInitCommand(program);
registerUpdateCommand(program);
registerListCommand(program);
registerViewCommand(program);
registerArchiveCommand(program);
registerChangeCommand(program);
registerConfigCommand(program);
registerSchemaCommand(program);
registerWorkspaceCommand(program);
registerWikiCommand(program);
registerUiCommand(program);
registerActivityCommand(program);
registerValidateCommand(program);
registerShowCommand(program);
registerFeedbackCommand(program);
registerCompletionCommand(program);
registerWorkflowCommands(program);

program.parse();
