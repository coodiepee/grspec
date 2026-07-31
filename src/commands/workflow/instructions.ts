/**
 * Instructions Command
 *
 * Generates enriched instructions for creating artifacts or applying tasks.
 * Includes both artifact instructions and apply instructions.
 */

import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import {
  loadChangeContext,
  generateInstructions,
  resolveSchema,
  resolveArtifactOutputs,
  type ArtifactInstructions,
} from '../../core/artifact-graph/index.js';
import {
  validateChangeExists,
  validateSchemaExists,
  type TaskItem,
  type ApplyInstructions,
} from './shared.js';
import { readChangeMetadata } from '../../utils/change-metadata.js';
import { loadRules, filterBySeverity } from '../../core/ui/rules.js';
import { discoverUiContextFiles } from '../../core/ui/ui-context.js';
import {
  parseUiArtifactStatus,
  isUiFoundationReady,
  resolveEffectiveUiActive,
} from '../../core/ui/ui-artifact.js';
import { logger } from '../../utils/logger.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
  force?: boolean;
}

export interface ApplyInstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Artifact Instructions Command
// -----------------------------------------------------------------------------

export async function instructionsCommand(
  artifactId: string | undefined,
  options: InstructionsOptions
): Promise<void> {
  const spinner = options.json ? undefined : ora('Generating instructions...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);

    if (!artifactId) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `Missing required argument <artifact>. Valid artifacts:\n  ${validIds.join('\n  ')}`
      );
    }

    const artifact = context.graph.getArtifact(artifactId);

    if (!artifact) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `Artifact '${artifactId}' not found in schema '${context.schemaName}'. Valid artifacts:\n  ${validIds.join('\n  ')}`
      );
    }

    const instructions = generateInstructions(context, artifactId, projectRoot);
    const isBlocked = instructions.dependencies.some((d) => !d.done);

    if (isBlocked && !options.force) {
      spinner?.stop();
      const missing = instructions.dependencies
        .filter((d) => !d.done)
        .map((d) => d.id);
      const msg = `Gate blocked: ${missing.join(', ')} must be completed before ${artifactId}. Use --force to bypass.`;
      if (options.json) {
        logger.info(JSON.stringify({ error: 'gate_blocked', missing, message: msg }, null, 2));
      } else {
        logger.error(msg);
      }
      process.exitCode = 1;
      return;
    }

    if (isBlocked && options.force) {
      const missing = instructions.dependencies
        .filter((d) => !d.done)
        .map((d) => d.id);
      if (!options.json) {
        logger.warn(
          `Warning: bypassing gate — missing dependencies: ${missing.join(', ')}`
        );
      }
    }

    spinner?.stop();

    if (options.json) {
      logger.info(JSON.stringify(instructions, null, 2));
      return;
    }

    printInstructionsText(instructions, isBlocked);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printInstructionsText(instructions: ArtifactInstructions, isBlocked: boolean): void {
  const {
    artifactId,
    changeName,
    schemaName,
    changeDir,
    outputPath,
    description,
    instruction,
    context,
    rules,
    template,
    dependencies,
    unlocks,
  } = instructions;

  // Opening tag
  logger.info(`<artifact id="${artifactId}" change="${changeName}" schema="${schemaName}">`);
  logger.info('');

  // Warning for blocked artifacts
  if (isBlocked) {
    const missing = dependencies.filter((d) => !d.done).map((d) => d.id);
    logger.info('<warning>');
    logger.info('This artifact has unmet dependencies. Complete them first or proceed with caution.');
    logger.info(`Missing: ${missing.join(', ')}`);
    logger.info('</warning>');
    logger.info('');
  }

  // Task directive
  logger.info('<task>');
  logger.info(`Create the ${artifactId} artifact for change "${changeName}".`);
  logger.info(description);
  logger.info('</task>');
  logger.info('');

  // Project context (AI constraint - do not include in output)
  if (context) {
    logger.info('<project_context>');
    logger.info('<!-- This is background information for you. Do NOT include this in your output. -->');
    logger.info(context);
    logger.info('</project_context>');
    logger.info('');
  }

  // Rules (AI constraint - do not include in output)
  if (rules && rules.length > 0) {
    logger.info('<rules>');
    logger.info('<!-- These are constraints for you to follow. Do NOT include this in your output. -->');
    for (const rule of rules) {
      logger.info(`- ${rule}`);
    }
    logger.info('</rules>');
    logger.info('');
  }

  // Dependencies (files to read for context)
  if (dependencies.length > 0) {
    logger.info('<dependencies>');
    logger.info('Read these files for context before creating this artifact:');
    logger.info('');
    for (const dep of dependencies) {
      const status = dep.done ? 'done' : 'missing';
      const fullPath = path.join(changeDir, dep.path);
      logger.info(`<dependency id="${dep.id}" status="${status}">`);
      logger.info(`  <path>${fullPath}</path>`);
      logger.info(`  <description>${dep.description}</description>`);
      logger.info('</dependency>');
    }
    logger.info('</dependencies>');
    logger.info('');
  }

  // Output location
  logger.info('<output>');
  logger.info(`Write to: ${path.join(changeDir, outputPath)}`);
  logger.info('</output>');
  logger.info('');

  // Instruction (guidance)
  if (instruction) {
    logger.info('<instruction>');
    logger.info(instruction.trim());
    logger.info('</instruction>');
    logger.info('');
  }

  // Template
  logger.info('<template>');
  logger.info('<!-- Use this as the structure for your output file. Fill in the sections. -->');
  logger.info(template.trim());
  logger.info('</template>');
  logger.info('');

  // Success criteria placeholder
  logger.info('<success_criteria>');
  logger.info('<!-- To be defined in schema validation rules -->');
  logger.info('</success_criteria>');
  logger.info('');

  // Unlocks
  if (unlocks.length > 0) {
    logger.info('<unlocks>');
    logger.info(`Completing this artifact enables: ${unlocks.join(', ')}`);
    logger.info('</unlocks>');
    logger.info('');
  }

  // Closing tag
  logger.info('</artifact>');
}

// -----------------------------------------------------------------------------
// Apply Instructions Command
// -----------------------------------------------------------------------------

/**
 * Parses plan.md content and extracts task items with their completion status.
 */
function parseTasksFile(content: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const lines = content.split('\n');
  let taskIndex = 0;

  for (const line of lines) {
    // Match checkbox patterns: - [ ] or - [x] or - [X]
    const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)\s*$/);
    if (checkboxMatch) {
      taskIndex++;
      const done = checkboxMatch[1].toLowerCase() === 'x';
      const description = checkboxMatch[2].trim();
      tasks.push({
        id: `${taskIndex}`,
        description,
        done,
      });
    }
  }

  return tasks;
}

/**
 * Generates apply instructions for implementing tasks from a change.
 * Schema-aware: reads apply phase configuration from schema to determine
 * required artifacts, tracking file, and instruction.
 */
export async function generateApplyInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string
): Promise<ApplyInstructions> {
  // loadChangeContext will auto-detect schema from metadata if not provided
  const context = loadChangeContext(projectRoot, changeName, schemaName);
  const changeDir = context.changeDir;
  const schemaVersion = context.schemaVersion;

  // Get the full schema to access the apply phase configuration
  const schema = resolveSchema(context.schemaName, projectRoot, schemaVersion);
  const applyConfig = schema.apply;

  // Determine required artifacts and tracking file from schema
  // Fallback: if no apply block, require all artifacts
  const requiredArtifactIds = applyConfig?.requires ?? schema.artifacts.map((a) => a.id);
  const tracksFile = applyConfig?.tracks ?? null;
  const schemaInstruction = applyConfig?.instruction ?? null;

  // Check which required artifacts are missing
  const missingArtifacts: string[] = [];
  for (const artifactId of requiredArtifactIds) {
    const artifact = schema.artifacts.find((a) => a.id === artifactId);
    if (artifact && resolveArtifactOutputs(changeDir, artifact.generates).length === 0) {
      missingArtifacts.push(artifactId);
    }
  }

  // Build context files from all existing artifacts in schema
  const contextFiles: Record<string, string[]> = {};
  for (const artifact of schema.artifacts) {
    const outputs = resolveArtifactOutputs(changeDir, artifact.generates);
    if (outputs.length > 0) {
      contextFiles[artifact.id] = outputs;
    }
  }

  // Discover UI context files under grspec/ui/ and change ui/
  const uiContextFiles = discoverUiContextFiles(projectRoot, changeDir);
  if (uiContextFiles.length > 0) {
    contextFiles.ui = uiContextFiles;
  }

  let uiArtifactStatus: ApplyInstructions['uiArtifactStatus'];
  let uiFoundationReady: boolean | undefined;
  let effectiveUiActive: boolean | undefined;
  const uiMdPath = path.join(changeDir, 'ui.md');
  if (schemaVersion >= 2 && fs.existsSync(uiMdPath)) {
    uiArtifactStatus = parseUiArtifactStatus(uiMdPath);
    uiFoundationReady = isUiFoundationReady(projectRoot);
  }

  let uiDetected = false;
  try {
    const metadata = readChangeMetadata(changeDir, projectRoot);
    uiDetected = metadata?.uiDetected === true;
  } catch {
    // Metadata read can fail for custom schemas; skip UI enrichment
  }

  effectiveUiActive = resolveEffectiveUiActive({
    changeDir,
    schemaVersion,
    uiDetected,
  });

  // Parse tasks if tracking file exists
  let tasks: TaskItem[] = [];
  let tracksFileExists = false;
  if (tracksFile) {
    const tracksPath = path.join(changeDir, tracksFile);
    tracksFileExists = fs.existsSync(tracksPath);
    if (tracksFileExists) {
      const tasksContent = await fs.promises.readFile(tracksPath, 'utf-8');
      tasks = parseTasksFile(tasksContent);
    }
  }

  // Calculate progress
  const total = tasks.length;
  const complete = tasks.filter((t) => t.done).length;
  const remaining = total - complete;

  // Determine state and instruction
  let state: ApplyInstructions['state'];
  let instruction: string;

  if (missingArtifacts.length > 0) {
    state = 'blocked';
    instruction = `Cannot apply this change yet. Missing artifacts: ${missingArtifacts.join(', ')}.\nUse the grspec-continue-change skill to create the missing artifacts first.`;
  } else if (tracksFile && !tracksFileExists) {
    // Tracking file configured but doesn't exist yet
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `The ${tracksFilename} file is missing and must be created.\nUse grspec-continue-change to generate the tracking file.`;
  } else if (tracksFile && tracksFileExists && total === 0) {
    // Tracking file exists but contains no tasks
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `The ${tracksFilename} file exists but contains no tasks.\nAdd tasks to ${tracksFilename} or regenerate it with grspec-continue-change.`;
  } else if (tracksFile && remaining === 0 && total > 0) {
    state = 'all_done';
    instruction = 'All tasks are complete! This change is ready to be archived.\nConsider running tests and reviewing the changes before archiving.';
  } else if (!tracksFile) {
    // No tracking file configured in schema - ready to apply
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? 'All required artifacts complete. Proceed with implementation.';
  } else {
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? 'Read context files, work through pending tasks, mark complete as you go.\nPause if you hit blockers or need clarification.';
  }

  if (state === 'ready') {
    if (contextFiles.ui) {
      instruction += '\n\nUI context is available (see contextFiles.ui). ' +
        'Reference grspec/ui/MASTER.md for project tokens, change ui.md for scope/decisions, ' +
        'and change ui/pages/ for page-specific overrides when implementing UI tasks.';
    }

    if (effectiveUiActive) {
      try {
        const criticalRules = filterBySeverity(loadRules(), 'CRITICAL');
        if (criticalRules.length > 0) {
          const rulesText = criticalRules
            .map((r) => `- [${r.RuleID}] ${r.Short}: ${r.Do}`)
            .join('\n');
          instruction += '\n\n--- CRITICAL UI/UX Rules (mandatory) ---\n' + rulesText +
            '\n--- End CRITICAL Rules ---';
        }
      } catch {
        // Rules loading failed, skip inline rules
      }
      instruction += '\n\nRun `grspec ui review <path>` after implementation for automated quality checks.';

      if (uiArtifactStatus === 'blocked' || uiArtifactStatus === 'unknown') {
        instruction += '\n\nUI foundation is not ready or ui.md Status is unresolved. ' +
          'Do NOT mark tasks under plan ## UI as complete until Status is done and grspec/ui/MASTER.md exists.';
      }
    }
  }

  return {
    changeName,
    changeDir,
    schemaName: context.schemaName,
    schemaVersion,
    uiArtifactStatus,
    uiFoundationReady,
    effectiveUiActive,
    contextFiles,
    progress: { total, complete, remaining },
    tasks,
    state,
    missingArtifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
    instruction,
  };
}

export async function applyInstructionsCommand(options: ApplyInstructionsOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Generating apply instructions...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // generateApplyInstructions uses loadChangeContext which auto-detects schema
    const instructions = await generateApplyInstructions(projectRoot, changeName, options.schema);

    spinner?.stop();

    if (options.json) {
      logger.info(JSON.stringify(instructions, null, 2));
      return;
    }

    printApplyInstructionsText(instructions);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printApplyInstructionsText(instructions: ApplyInstructions): void {
  const { changeName, schemaName, contextFiles, progress, tasks, state, missingArtifacts, instruction } = instructions;

  logger.info(`## Apply: ${changeName}`);
  logger.info(`Schema: ${schemaName}`);
  logger.info('');

  // Warning for blocked state
  if (state === 'blocked' && missingArtifacts) {
    logger.info('### ⚠️ Blocked');
    logger.info('');
    logger.info(`Missing artifacts: ${missingArtifacts.join(', ')}`);
    logger.info('Use the grspec-continue-change skill to create these first.');
    logger.info('');
  }

  // Context files (dynamically from schema)
  const contextFileEntries = Object.entries(contextFiles);
  if (contextFileEntries.length > 0) {
    logger.info('### Context Files');
    for (const [artifactId, filePaths] of contextFileEntries) {
      for (const filePath of filePaths) {
        logger.info(`- ${artifactId}: ${filePath}`);
      }
    }
    logger.info('');
  }

  // Progress (only show if we have tracking)
  if (progress.total > 0 || tasks.length > 0) {
    logger.info('### Progress');
    if (state === 'all_done') {
      logger.info(`${progress.complete}/${progress.total} complete ✓`);
    } else {
      logger.info(`${progress.complete}/${progress.total} complete`);
    }
    logger.info('');
  }

  // Tasks
  if (tasks.length > 0) {
    logger.info('### Tasks');
    for (const task of tasks) {
      const checkbox = task.done ? '[x]' : '[ ]';
      logger.info(`- ${checkbox} ${task.description}`);
    }
    logger.info('');
  }

  // Instruction
  logger.info('### Instruction');
  logger.info(instruction);
}
