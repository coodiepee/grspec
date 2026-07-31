/**
 * Workflow CLI Commands
 *
 * Commands for the artifact-driven workflow: status, instructions, templates, schemas, new change.
 */

import { Command } from 'commander';
import { handleCommandError } from '../../utils/command-error.js';

export { statusCommand } from './status.js';
export type { StatusOptions } from './status.js';

export { instructionsCommand, applyInstructionsCommand } from './instructions.js';
export type { InstructionsOptions } from './instructions.js';

export { templatesCommand } from './templates.js';
export type { TemplatesOptions } from './templates.js';

export { schemasCommand } from './schemas.js';
export type { SchemasOptions } from './schemas.js';

export { newChangeCommand } from './new-change.js';
export type { NewChangeOptions } from './new-change.js';

export { DEFAULT_SCHEMA } from './shared.js';
import { DEFAULT_SCHEMA as _DEFAULT_SCHEMA } from './shared.js';

export function registerWorkflowCommands(program: Command): void {
  const defaultSchema = _DEFAULT_SCHEMA;

  program
    .command('status')
    .description('Display artifact completion status for a change')
    .option('--change <id>', 'Change name to show status for')
    .option('--schema <name>', 'Schema override (auto-detected from grspec.yaml)')
    .option('--json', 'Output as JSON')
    .action(async (options: import('./status.js').StatusOptions) => {
      try {
        const { statusCommand: cmd } = await import('./status.js');
        await cmd(options);
      } catch (error) {
        handleCommandError(error, { command: 'status', json: options?.json });
      }
    });

  program
    .command('instructions [artifact]')
    .description('Output enriched instructions for creating an artifact or applying tasks')
    .option('--change <id>', 'Change name')
    .option('--schema <name>', 'Schema override (auto-detected from grspec.yaml)')
    .option('--json', 'Output as JSON')
    .option('--force', 'Bypass dependency gate checks')
    .action(async (artifactId: string | undefined, options: import('./instructions.js').InstructionsOptions) => {
      try {
        if (artifactId === 'apply') {
          const { applyInstructionsCommand: cmd } = await import('./instructions.js');
          await cmd(options);
        } else {
          const { instructionsCommand: cmd } = await import('./instructions.js');
          await cmd(artifactId, options);
        }
      } catch (error) {
        handleCommandError(error, { command: 'instructions', json: options?.json });
      }
    });

  program
    .command('templates')
    .description('Show resolved template paths for all artifacts in a schema')
    .option('--schema <name>', `Schema to use (default: ${defaultSchema})`)
    .option('--json', 'Output as JSON mapping artifact IDs to template paths')
    .action(async (options: import('./templates.js').TemplatesOptions) => {
      try {
        const { templatesCommand: cmd } = await import('./templates.js');
        await cmd(options);
      } catch (error) {
        handleCommandError(error, { command: 'templates', json: options?.json });
      }
    });

  program
    .command('schemas')
    .description('List available workflow schemas with descriptions')
    .option('--json', 'Output as JSON (for agent use)')
    .action(async (options: import('./schemas.js').SchemasOptions) => {
      try {
        const { schemasCommand: cmd } = await import('./schemas.js');
        await cmd(options);
      } catch (error) {
        handleCommandError(error, { command: 'schemas', json: options?.json });
      }
    });

  const newCmd = program.command('new').description('Create new items');
  newCmd
    .command('change <name>')
    .description('Create a new change directory')
    .option('--description <text>', 'Description to add to README.md')
    .option('--schema <name>', `Workflow schema to use (default: ${defaultSchema})`)
    .action(async (name: string, options: import('./new-change.js').NewChangeOptions) => {
      try {
        const { newChangeCommand: cmd } = await import('./new-change.js');
        await cmd(name, options);
      } catch (error) {
        handleCommandError(error, { command: 'new:change' });
      }
    });
}
