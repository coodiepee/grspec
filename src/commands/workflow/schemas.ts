/**
 * Schemas Command
 *
 * Lists available workflow schemas with descriptions.
 */

import chalk from 'chalk';
import { listSchemasWithInfo } from '../../core/artifact-graph/index.js';
import { logger } from '../../utils/logger.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SchemasOptions {
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

export async function schemasCommand(options: SchemasOptions): Promise<void> {
  const projectRoot = process.cwd();
  const schemas = listSchemasWithInfo(projectRoot);

  if (options.json) {
    logger.info(JSON.stringify(schemas, null, 2));
    return;
  }

  logger.info('Available schemas:');
  logger.info('');

  for (const schema of schemas) {
    let sourceLabel = '';
    if (schema.source === 'project') {
      sourceLabel = chalk.cyan(' (project)');
    } else if (schema.source === 'user') {
      sourceLabel = chalk.dim(' (user override)');
    }
    logger.info(`  ${chalk.bold(schema.name)}${sourceLabel}`);
    logger.info(`    ${schema.description}`);
    logger.info(`    Artifacts: ${schema.artifacts.join(' → ')}`);
    logger.info('');
  }
}
