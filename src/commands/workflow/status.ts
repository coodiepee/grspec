/**
 * Status Command
 *
 * Displays artifact completion status for a change.
 */

import ora from 'ora';
import chalk from 'chalk';
import {
  loadChangeContext,
  formatChangeStatus,
  type ChangeStatus,
} from '../../core/artifact-graph/index.js';
import {
  validateChangeExists,
  validateSchemaExists,
  getAvailableChanges,
  getStatusIndicator,
  getStatusColor,
} from './shared.js';
import { logger } from '../../utils/logger.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface StatusOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

export async function statusCommand(options: StatusOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Loading change status...').start();

  try {
    const projectRoot = process.cwd();

    // Handle no-changes case gracefully — status is informational,
    // so "no changes" is a valid state, not an error.
    if (!options.change) {
      const available = await getAvailableChanges(projectRoot);
      if (available.length === 0) {
        spinner?.stop();
        if (options.json) {
          logger.info(JSON.stringify({ changes: [], message: 'No active changes.' }, null, 2));
          return;
        }
        logger.info('No active changes. Create one with: grspec new change <name>');
        return;
      }
      // Changes exist but --change not provided
      spinner?.stop();
      throw new Error(
        `Missing required option --change. Available changes:\n  ${available.join('\n  ')}`
      );
    }

    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);
    const status = formatChangeStatus(context);

    spinner?.stop();

    if (options.json) {
      logger.info(JSON.stringify(status, null, 2));
      return;
    }

    printStatusText(status);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printStatusText(status: ChangeStatus): void {
  const doneCount = status.artifacts.filter((a) => a.status === 'done').length;
  const total = status.artifacts.length;

  logger.info(`Change: ${status.changeName}`);
  logger.info(`Schema: ${status.schemaName}`);
  logger.info(`Progress: ${doneCount}/${total} artifacts complete`);
  logger.info('');

  for (const artifact of status.artifacts) {
    const indicator = getStatusIndicator(artifact.status);
    const color = getStatusColor(artifact.status);
    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += color(` (blocked by: ${artifact.missingDeps.join(', ')})`);
    }

    logger.info(line);
  }

  if (status.isComplete) {
    logger.info('');
    logger.info(chalk.green('All artifacts complete!'));
  }
}
