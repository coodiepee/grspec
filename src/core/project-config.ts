import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const ProjectConfigKnowledgeSchema = z.object({
  constitution: z.string().optional(),
  'domain-model': z.string().optional(),
  'specs-dir': z.string().optional(),
});

const ProjectConfigWorkflowSchema = z.object({
  gates: z
    .object({
      'proposal-review': z.boolean().optional(),
      'design-review': z.boolean().optional(),
      'archive-verification': z.boolean().optional(),
    })
    .optional(),
});

const ProjectConfigExecutionSchema = z.object({
  'tdd-policy': z.enum(['core-logic', 'all', 'none']).optional(),
  'review-policy': z.enum(['dual-stage', 'quality-only', 'none']).optional(),
  verification: z.enum(['strict', 'relaxed']).optional(),
});

const ProjectConfigCodegenSchema = z.object({
  tool: z.string().optional(),
  'schema-dir': z.string().optional(),
  command: z.string().optional(),
});

/**
 * Reserved for future use. Keys are parsed without error but not consumed
 * by any CLI command. Collaboration capabilities (subagent, parallel,
 * worktree, model selection) are implemented as Skill templates, not
 * CLI automation. See docs/pr.md §2.6 for scope clarification.
 */
const ProjectConfigCollaborationSchema = z.object({
  'parallel-strategy': z.string().optional(),
  worktree: z.boolean().optional(),
  'model-selection': z.string().optional(),
});

const ProjectConfigBootstrapSchema = z.object({
  completed: z.boolean().optional(),
  'domain-modeling': z.string().optional(),
  architecture: z.string().optional(),
  'schema-bootstrap': z.string().optional(),
  skeleton: z.string().optional(),
});

const ProjectConfigWikiLintSchema = z.object({
  'on-archive': z.boolean().optional(),
  structural: z.boolean().optional(),
  semantic: z.boolean().optional(),
});

const ProjectConfigWikiAutoIngestSchema = z.object({
  'on-propose': z.boolean().optional(),
  'on-apply': z.boolean().optional(),
  'on-archive': z.boolean().optional(),
});

export const ProjectConfigWikiSchema = z.object({
  enabled: z.boolean().optional(),
  categories: z.array(z.string()).optional(),
  'auto-ingest': ProjectConfigWikiAutoIngestSchema.optional(),
  lint: ProjectConfigWikiLintSchema.optional(),
});

/**
 * Zod schema for project configuration.
 *
 * Purpose:
 * 1. Documentation - clearly defines the config file structure
 * 2. Type safety - TypeScript infers ProjectConfig type from schema
 * 3. Runtime validation - uses safeParse() for resilient field-by-field validation
 *
 * Why Zod over manual validation:
 * - Helps understand grspec's data interfaces at a glance
 * - Single source of truth for type and validation
 * - Consistent with other grspec schemas
 */
export const ProjectConfigSchema = z
  .object({
    // Required: which schema to use (e.g., "spec-driven", or project-local schema name)
    schema: z
      .string()
      .min(1)
      .describe('The workflow schema to use (e.g., "spec-driven")'),

    // Optional: project context (injected into all artifact instructions)
    // Max size: 50KB (enforced during parsing)
    context: z
      .string()
      .optional()
      .describe('Project context injected into all artifact instructions'),

    // Optional: per-artifact rules (additive to schema's built-in guidance)
    rules: z
      .record(
        z.string(), // artifact ID
        z.array(z.string()) // list of rules
      )
      .optional()
      .describe('Per-artifact rules, keyed by artifact ID'),

    // New optional fields for Vibe Coding Framework
    knowledge: ProjectConfigKnowledgeSchema.optional(),
    workflow: ProjectConfigWorkflowSchema.optional(),
    execution: ProjectConfigExecutionSchema.optional(),
    codegen: ProjectConfigCodegenSchema.optional(),
    collaboration: ProjectConfigCollaborationSchema.optional(),
    bootstrap: ProjectConfigBootstrapSchema.optional(),
    wiki: ProjectConfigWikiSchema.optional(),
  })
  .passthrough();

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

const MAX_CONTEXT_SIZE = 50 * 1024; // 50KB hard limit

const RESERVED_TOP_LEVEL_KEYS = new Set([
  'schema',
  'context',
  'rules',
  'knowledge',
  'workflow',
  'execution',
  'codegen',
  'collaboration',
  'bootstrap',
  'wiki',
]);

function parseOptionalConfigSection<T>(
  raw: Record<string, unknown>,
  key: string,
  schema: z.ZodType<T>,
  config: Record<string, unknown>
): void {
  if (raw[key] === undefined) {
    return;
  }
  const result = schema.safeParse(raw[key]);
  if (result.success) {
    config[key] = result.data as unknown;
  } else {
    logger.warn(`Invalid '${key}' field in config, ignoring`);
  }
}

/**
 * Read and parse grspec/grspec.yaml from project root.
 * Uses resilient parsing - validates each field independently using Zod safeParse.
 * Returns null if file doesn't exist.
 * Returns partial config if some fields are invalid (with warnings).
 *
 * Performance note (Jan 2025):
 * Benchmarks showed direct file reads are fast enough without caching:
 * - Typical config (1KB): ~0.5ms per read
 * - Large config (50KB): ~1.6ms per read
 * - Missing config: ~0.01ms per read
 * Config is read 1-2 times per command (schema resolution + instruction loading),
 * adding ~1-3ms total overhead. Caching would add complexity (mtime checks,
 * invalidation logic) for negligible benefit. Direct reads also ensure config
 * changes are reflected immediately without stale cache issues.
 *
 * @param projectRoot - The root directory of the project (where `grspec/` lives)
 * @returns Parsed config or null if file doesn't exist
 */
export function readProjectConfig(projectRoot: string): ProjectConfig | null {
  // Try both .yaml and .yml, prefer .yaml
  let configPath = path.join(projectRoot, 'grspec', 'grspec.yaml');
  if (!existsSync(configPath)) {
    configPath = path.join(projectRoot, 'grspec', 'grspec.yml');
    if (!existsSync(configPath)) {
      return null; // No config is OK
    }
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const raw = parseYaml(content);

    if (!raw || typeof raw !== 'object') {
      logger.warn(`grspec/grspec.yaml is not a valid YAML object`);
      return null;
    }

    const rawRecord = raw as Record<string, unknown>;
    const config: Record<string, unknown> = {};

    // Parse schema field using Zod
    const schemaField = z.string().min(1);
    const schemaResult = schemaField.safeParse(rawRecord.schema);
    if (schemaResult.success) {
      config.schema = schemaResult.data;
    } else if (rawRecord.schema !== undefined) {
      logger.warn(`Invalid 'schema' field in config (must be non-empty string)`);
    }

    // Parse context field with size limit
    if (rawRecord.context !== undefined) {
      const contextField = z.string();
      const contextResult = contextField.safeParse(rawRecord.context);

      if (contextResult.success) {
        const contextSize = Buffer.byteLength(contextResult.data, 'utf-8');
        if (contextSize > MAX_CONTEXT_SIZE) {
          logger.warn(
            `Context too large (${(contextSize / 1024).toFixed(1)}KB, limit: ${MAX_CONTEXT_SIZE / 1024}KB)`
          );
          logger.warn(`Ignoring context field`);
        } else {
          config.context = contextResult.data;
        }
      } else {
        logger.warn(`Invalid 'context' field in config (must be string)`);
      }
    }

    // Parse rules field using Zod
    if (rawRecord.rules !== undefined) {
      // First check if it's an object structure (guard against null since typeof null === 'object')
      if (typeof rawRecord.rules === 'object' && rawRecord.rules !== null && !Array.isArray(rawRecord.rules)) {
        const parsedRules: Record<string, string[]> = {};
        let hasValidRules = false;

        for (const [artifactId, rules] of Object.entries(rawRecord.rules as Record<string, unknown>)) {
          const rulesArrayResult = z.array(z.string()).safeParse(rules);

          if (rulesArrayResult.success) {
            // Filter out empty strings
            const validRules = rulesArrayResult.data.filter((r) => r.length > 0);
            if (validRules.length > 0) {
              parsedRules[artifactId] = validRules;
              hasValidRules = true;
            }
            if (validRules.length < rulesArrayResult.data.length) {
              logger.warn(
                `Some rules for '${artifactId}' are empty strings, ignoring them`
              );
            }
          } else {
            logger.warn(
              `Rules for '${artifactId}' must be an array of strings, ignoring this artifact's rules`
            );
          }
        }

        if (hasValidRules) {
          config.rules = parsedRules;
        }
      } else {
        logger.warn(`Invalid 'rules' field in config (must be object)`);
      }
    }

    parseOptionalConfigSection(rawRecord, 'knowledge', ProjectConfigKnowledgeSchema, config);
    parseOptionalConfigSection(rawRecord, 'workflow', ProjectConfigWorkflowSchema, config);
    parseOptionalConfigSection(rawRecord, 'execution', ProjectConfigExecutionSchema, config);
    parseOptionalConfigSection(rawRecord, 'codegen', ProjectConfigCodegenSchema, config);
    parseOptionalConfigSection(
      rawRecord,
      'collaboration',
      ProjectConfigCollaborationSchema,
      config
    );
    parseOptionalConfigSection(rawRecord, 'bootstrap', ProjectConfigBootstrapSchema, config);
    parseOptionalConfigSection(rawRecord, 'wiki', ProjectConfigWikiSchema, config);

    for (const [key, value] of Object.entries(rawRecord)) {
      if (!RESERVED_TOP_LEVEL_KEYS.has(key)) {
        config[key] = value;
      }
    }

    // Return partial config even if some fields failed
    return Object.keys(config).length > 0 ? (config as ProjectConfig) : null;
  } catch (error) {
    logger.warn(`Failed to parse grspec/grspec.yaml: ${error}`);
    return null;
  }
}

/**
 * Validate artifact IDs in rules against a schema's artifacts.
 * Called during instruction loading (when schema is known).
 * Returns warnings for unknown artifact IDs.
 *
 * @param rules - The rules object from config
 * @param validArtifactIds - Set of valid artifact IDs from the schema
 * @param schemaName - Name of the schema for error messages
 * @returns Array of warning messages for unknown artifact IDs
 */
export function validateConfigRules(
  rules: Record<string, string[]>,
  validArtifactIds: Set<string>,
  schemaName: string
): string[] {
  const warnings: string[] = [];

  for (const artifactId of Object.keys(rules)) {
    if (!validArtifactIds.has(artifactId)) {
      const validIds = Array.from(validArtifactIds).sort().join(', ');
      warnings.push(
        `Unknown artifact ID in rules: "${artifactId}". ` +
          `Valid IDs for schema "${schemaName}": ${validIds}`
      );
    }
  }

  return warnings;
}

/**
 * Suggest valid schema names when user provides invalid schema.
 * Uses fuzzy matching to find similar names.
 *
 * @param invalidSchemaName - The invalid schema name from config
 * @param availableSchemas - List of available schemas with their type (built-in or project-local)
 * @returns Error message with suggestions and available schemas
 */
export function suggestSchemas(
  invalidSchemaName: string,
  availableSchemas: { name: string; isBuiltIn: boolean }[]
): string {
  // Simple fuzzy match: Levenshtein distance
  function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Find closest matches (distance <= 3)
  const suggestions = availableSchemas
    .map((s) => ({ ...s, distance: levenshtein(invalidSchemaName, s.name) }))
    .filter((s) => s.distance <= 3)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  const builtIn = availableSchemas.filter((s) => s.isBuiltIn).map((s) => s.name);
  const projectLocal = availableSchemas.filter((s) => !s.isBuiltIn).map((s) => s.name);

  let message = `Schema '${invalidSchemaName}' not found in grspec/grspec.yaml\n\n`;

  if (suggestions.length > 0) {
    message += `Did you mean one of these?\n`;
    suggestions.forEach((s) => {
      const type = s.isBuiltIn ? 'built-in' : 'project-local';
      message += `  - ${s.name} (${type})\n`;
    });
    message += '\n';
  }

  message += `Available schemas:\n`;
  if (builtIn.length > 0) {
    message += `  Built-in: ${builtIn.join(', ')}\n`;
  }
  if (projectLocal.length > 0) {
    message += `  Project-local: ${projectLocal.join(', ')}\n`;
  } else {
    message += `  Project-local: (none found)\n`;
  }

  message += `\nFix: Edit grspec/grspec.yaml and change 'schema: ${invalidSchemaName}' to a valid schema name`;

  return message;
}
