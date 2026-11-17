/**
 * Update Command
 *
 * Refreshes grspec skills and commands for configured tools.
 * Supports profile-aware updates, delivery changes, migration, and smart update detection.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { resolveSkillInstructionTransformer } from '../utils/command-references.js';
import { AI_TOOLS, GRSPEC_DIR_NAME } from './config.js';
import { logger } from '../utils/logger.js';
import {
  generateCommands,
  CommandAdapterRegistry,
} from './command-generation/index.js';
import {
  generateRules,
  RuleAdapterRegistry,
  getRuleTemplates,
} from './rule-generation/index.js';
import {
  getToolVersionStatus,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  getToolSkillStatus,
  parseToolsArg,
  type ToolVersionStatus,
} from './shared/index.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, ALL_WORKFLOWS } from './profiles.js';
import { getAvailableTools } from './available-tools.js';
import {
  WORKFLOW_TO_COMMAND_IDS,
  getSkillDirsForWorkflow,
  removeLegacyUiHubSkillDir,
  removeLegacyUiHubCommandFile,
  removeLegacyVerifyChangeSkillDir,
  getCommandConfiguredTools,
  getConfiguredToolsForProfileSync,
  getToolsNeedingProfileSync,
} from './profile-sync-drift.js';
import {
  scanInstalledWorkflows as scanInstalledWorkflowsShared,
  migrateIfNeeded as migrateIfNeededShared,
} from './migration.js';

const require = createRequire(import.meta.url);
const { version: GRSPEC_VERSION } = require('../../package.json');
const OLD_CORE_WORKFLOWS = ['propose', 'explore', 'apply', 'archive'] as const;

/**
 * Options for the update command.
 */
export interface UpdateCommandOptions {
  /** Force update even when tools are up to date */
  force?: boolean;
  /** Limit or expand targets: all, none, or comma-separated tool IDs (e.g. grcode,cursor) */
  tools?: string;
}

/**
 * Scans installed workflow artifacts (skills and managed commands) across all configured tools.
 * Returns the union of detected workflow IDs that match ALL_WORKFLOWS.
 *
 * Wrapper around the shared migration module's scanInstalledWorkflows that accepts tool IDs.
 */
export function scanInstalledWorkflows(projectPath: string, toolIds: string[]): string[] {
  const tools = toolIds
    .map((id) => AI_TOOLS.find((t) => t.value === id))
    .filter((t): t is NonNullable<typeof t> => t != null);
  return scanInstalledWorkflowsShared(projectPath, tools);
}

export class UpdateCommand {
  private readonly force: boolean;
  private readonly toolsArg?: string;

  constructor(options: UpdateCommandOptions = {}) {
    this.force = options.force ?? false;
    this.toolsArg = options.tools;
  }

  async execute(projectPath: string): Promise<void> {
    const resolvedProjectPath = path.resolve(projectPath);
    const grspecPath = path.join(resolvedProjectPath, GRSPEC_DIR_NAME);

    // 1. Check grspec directory exists
    if (!await FileSystemUtils.directoryExists(grspecPath)) {
      throw new Error(`No grspec directory found. Run 'grspec init' first.`);
    }

    // 2. Perform one-time migration if needed before any legacy upgrade generation.
    // Use detected tool directories to preserve existing grsx skills/commands.
    const detectedTools = getAvailableTools(resolvedProjectPath);
    migrateIfNeededShared(resolvedProjectPath, detectedTools);

    // 3. Read global config for profile/delivery
    const globalConfig = getGlobalConfig();
    const profile = globalConfig.profile ?? 'standard';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const profileWorkflows = getProfileWorkflows(profile, globalConfig.workflows);
    const desiredWorkflows = profileWorkflows.filter((workflow): workflow is (typeof ALL_WORKFLOWS)[number] =>
      (ALL_WORKFLOWS as readonly string[]).includes(workflow)
    );
    const shouldGenerateSkills = delivery !== 'commands';
    const shouldGenerateCommands = delivery !== 'skills';

    // 4. Legacy marker-era cleanup is retired (migration window closed)
    const newlyConfiguredTools: string[] = [];

    // 5. Resolve target tools (configured, or explicit via --tools)
    const configuredTools = getConfiguredToolsForProfileSync(resolvedProjectPath);
    const explicitToolIds = this.toolsArg !== undefined ? parseToolsArg(this.toolsArg) : null;
    const targetTools = explicitToolIds ?? configuredTools;

    if (targetTools.length === 0 && newlyConfiguredTools.length === 0) {
      logger.info(chalk.yellow('No configured tools found.'));
      if (explicitToolIds === null) {
        logger.info(chalk.dim('Run "grspec init" to set up tools.'));
      } else {
        logger.info(chalk.dim('No tools selected via --tools.'));
      }
      return;
    }

    // 6. Check version status for target tools
    const commandConfiguredTools = getCommandConfiguredTools(resolvedProjectPath);
    const commandConfiguredSet = new Set(commandConfiguredTools);
    const toolStatuses = targetTools.map((toolId) => {
      const status = getToolVersionStatus(resolvedProjectPath, toolId, GRSPEC_VERSION);
      if (!status.configured && commandConfiguredSet.has(toolId)) {
        return { ...status, configured: true };
      }
      return status;
    });
    const statusByTool = new Map(toolStatuses.map((status) => [status.toolId, status] as const));

    // 7. Smart update detection
    const toolsNeedingVersionUpdate = toolStatuses
      .filter((s) => s.needsUpdate)
      .map((s) => s.toolId);
    const toolsNeedingConfigSync = getToolsNeedingProfileSync(
      resolvedProjectPath,
      desiredWorkflows,
      delivery,
      targetTools
    );
    const toolsToUpdateSet = new Set<string>([
      ...toolsNeedingVersionUpdate,
      ...toolsNeedingConfigSync,
    ]);

    for (const toolId of targetTools) {
      const skillStatus = getToolSkillStatus(resolvedProjectPath, toolId);
      if (!skillStatus.configured && !commandConfiguredSet.has(toolId)) {
        toolsToUpdateSet.add(toolId);
      }
    }

    const toolsUpToDate = toolStatuses.filter((s) => !toolsToUpdateSet.has(s.toolId));

    if (!this.force && toolsToUpdateSet.size === 0) {
      // All tools are up to date
      this.displayUpToDateMessage(toolStatuses);

      // Still check for new tool directories and extra workflows
      this.detectNewTools(resolvedProjectPath, targetTools);
      this.displayExtraWorkflowsNote(resolvedProjectPath, targetTools, desiredWorkflows);
      this.displayOldCoreCustomProfileNote(profile, globalConfig.workflows);
      return;
    }

    // 8. Display update plan
    if (this.force) {
      logger.info(`Force updating ${targetTools.length} tool(s): ${targetTools.join(', ')}`);
    } else {
      this.displayUpdatePlan([...toolsToUpdateSet], statusByTool, toolsUpToDate);
    }
    logger.info('');

    // 9. Determine what to generate based on delivery
    const skillTemplates = shouldGenerateSkills ? getSkillTemplates(desiredWorkflows) : [];
    const commandContents = shouldGenerateCommands ? getCommandContents(desiredWorkflows) : [];

    // 10. Update tools (all targets if force, otherwise only those needing update)
    const toolsToUpdate = this.force ? targetTools : [...toolsToUpdateSet];
    const updatedTools: string[] = [];
    const failedTools: Array<{ name: string; error: string }> = [];
    let removedCommandCount = 0;
    let removedSkillCount = 0;
    let removedDeselectedCommandCount = 0;
    let removedDeselectedSkillCount = 0;

    for (const toolId of toolsToUpdate) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool?.skillsDir) continue;

      const spinner = ora(`Updating ${tool.name}...`).start();

      try {
        const skillsDir = path.join(resolvedProjectPath, tool.skillsDir, 'skills');

        // Generate skill files if delivery includes skills
        if (shouldGenerateSkills) {
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            // Some tools invoke skills with different slash syntax than /grsx:*
            const transformer = resolveSkillInstructionTransformer(tool.value);
            const skillContent = generateSkillContent(template, GRSPEC_VERSION, transformer);
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }

          if (await removeLegacyUiHubSkillDir(skillsDir)) {
            removedDeselectedSkillCount += 1;
          }
          if (await removeLegacyVerifyChangeSkillDir(skillsDir)) {
            removedDeselectedSkillCount += 1;
          }

          removedDeselectedSkillCount += await this.removeUnselectedSkillDirs(skillsDir, desiredWorkflows);
        }

        // Delete skill directories if delivery is commands-only
        if (!shouldGenerateSkills) {
          removedSkillCount += await this.removeSkillDirs(skillsDir);
        }

        // Generate commands if delivery includes commands
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = path.isAbsolute(cmd.path) ? cmd.path : path.join(resolvedProjectPath, cmd.path);
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }

            if (await removeLegacyUiHubCommandFile(resolvedProjectPath, toolId)) {
              removedDeselectedCommandCount += 1;
            }

            removedDeselectedCommandCount += await this.removeUnselectedCommandFiles(
              resolvedProjectPath,
              toolId,
              desiredWorkflows
            );
          }
        }

        // Delete command files if delivery is skills-only
        if (!shouldGenerateCommands) {
          removedCommandCount += await this.removeCommandFiles(resolvedProjectPath, toolId);
        }

        // Generate rules (always, regardless of delivery/profile)
        const ruleAdapter = RuleAdapterRegistry.get(tool.value);
        if (ruleAdapter) {
          const ruleTemplates = getRuleTemplates();
          const ruleContents = ruleTemplates.map(entry => entry.content);
          const generatedRuleFiles = generateRules(ruleContents, ruleAdapter);

          for (const rule of generatedRuleFiles) {
            const ruleFile = path.isAbsolute(rule.path) ? rule.path : path.join(resolvedProjectPath, rule.path);
            await FileSystemUtils.writeFile(ruleFile, rule.fileContent);
          }
        }

        spinner.succeed(`Updated ${tool.name}`);
        updatedTools.push(tool.name);
      } catch (error) {
        spinner.fail(`Failed to update ${tool.name}`);
        failedTools.push({
          name: tool.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 11. Summary
    logger.info('');
    if (updatedTools.length > 0) {
      logger.info(chalk.green(`✓ Updated: ${updatedTools.join(', ')} (v${GRSPEC_VERSION})`));
    }
    if (failedTools.length > 0) {
      logger.error(chalk.red(`✗ Failed: ${failedTools.map(f => `${f.name} (${f.error})`).join(', ')}`));
    }
    if (removedCommandCount > 0) {
      logger.info(chalk.dim(`Removed: ${removedCommandCount} command files (delivery: skills)`));
    }
    if (removedSkillCount > 0) {
      logger.info(chalk.dim(`Removed: ${removedSkillCount} skill directories (delivery: commands)`));
    }
    if (removedDeselectedCommandCount > 0) {
      logger.info(chalk.dim(`Removed: ${removedDeselectedCommandCount} command files (deselected workflows)`));
    }
    if (removedDeselectedSkillCount > 0) {
      logger.info(chalk.dim(`Removed: ${removedDeselectedSkillCount} skill directories (deselected workflows)`));
    }

    // 12. Show onboarding message for newly configured tools from legacy upgrade
    if (newlyConfiguredTools.length > 0) {
      logger.info('');
      logger.info(chalk.bold('Getting started:'));
      logger.info('  /grsx:new       Start a new change');
      logger.info('  /grsx:continue  Create the next artifact');
      logger.info('  /grsx:apply     Implement tasks');
      logger.info('');
      logger.info(`Learn more: ${chalk.cyan('https://github.com/grspec/grspec')}`);
    }

    const configuredAndNewTools = [...new Set([...targetTools, ...newlyConfiguredTools])];

    // 13. Detect new tool directories not currently configured
    this.detectNewTools(resolvedProjectPath, configuredAndNewTools);

    // 14. Display note about extra workflows not in profile
    this.displayExtraWorkflowsNote(resolvedProjectPath, configuredAndNewTools, desiredWorkflows);
    this.displayOldCoreCustomProfileNote(profile, globalConfig.workflows);

    // 15. List affected tools
    if (updatedTools.length > 0) {
      const toolDisplayNames = updatedTools;
      logger.info(chalk.dim(`Tools: ${toolDisplayNames.join(', ')}`));
    }

    logger.info('');
    logger.info(chalk.dim('Restart your IDE for changes to take effect.'));
  }

  /**
   * Display message when all tools are up to date.
   */
  private displayUpToDateMessage(toolStatuses: ToolVersionStatus[]): void {
    const toolNames = toolStatuses.map((s) => s.toolId);
    logger.info(chalk.green(`✓ All ${toolStatuses.length} tool(s) up to date (v${GRSPEC_VERSION})`));
    logger.info(chalk.dim(`  Tools: ${toolNames.join(', ')}`));
    logger.info('');
    logger.info(chalk.dim('Use --force to refresh files anyway.'));
  }

  /**
   * Display the update plan showing which tools need updating.
   */
  private displayUpdatePlan(
    toolsToUpdate: string[],
    statusByTool: Map<string, ToolVersionStatus>,
    upToDate: ToolVersionStatus[]
  ): void {
    const updates = toolsToUpdate.map((toolId) => {
      const status = statusByTool.get(toolId);
      if (status?.needsUpdate) {
        const fromVersion = status.generatedByVersion ?? 'unknown';
        return `${status.toolId} (${fromVersion} → ${GRSPEC_VERSION})`;
      }
      return `${toolId} (config sync)`;
    });

    logger.info(`Updating ${toolsToUpdate.length} tool(s): ${updates.join(', ')}`);

    if (upToDate.length > 0) {
      const upToDateNames = upToDate.map((s) => s.toolId);
      logger.info(chalk.dim(`Already up to date: ${upToDateNames.join(', ')}`));
    }
  }

  /**
   * Detects new tool directories that aren't currently configured and displays a hint.
   */
  private detectNewTools(projectPath: string, configuredTools: string[]): void {
    const availableTools = getAvailableTools(projectPath);
    const configuredSet = new Set(configuredTools);

    const newTools = availableTools.filter((t) => !configuredSet.has(t.value));

    if (newTools.length > 0) {
      const newToolNames = newTools.map((tool) => tool.name);
      const isSingleTool = newToolNames.length === 1;
      const toolNoun = isSingleTool ? 'tool' : 'tools';
      const pronoun = isSingleTool ? 'it' : 'them';
      logger.info('');
      logger.info(
        chalk.yellow(
          `Detected new ${toolNoun}: ${newToolNames.join(', ')}. Run 'grspec update --tools <id>' or 'grspec init' to add ${pronoun}.`
        )
      );
    }
  }

  /**
   * Displays a note about extra workflows installed that aren't in the current profile.
   */
  private displayExtraWorkflowsNote(
    projectPath: string,
    configuredTools: string[],
    profileWorkflows: readonly string[]
  ): void {
    const installedWorkflows = scanInstalledWorkflows(projectPath, configuredTools);
    const profileSet = new Set(profileWorkflows);
    const extraWorkflows = installedWorkflows.filter((w) => !profileSet.has(w));

    if (extraWorkflows.length > 0) {
      logger.info(chalk.dim(`Note: ${extraWorkflows.length} extra workflows not in profile (use \`grspec config profile\` to manage)`));
    }
  }

  /**
   * Suggest opting back into core when a custom profile still matches the old
   * pre-sync core set. Keep custom profiles user-owned; do not mutate them.
   */
  private displayOldCoreCustomProfileNote(profile: Profile, workflows?: readonly string[]): void {
    if (profile !== 'custom' || !workflows) {
      return;
    }

    const workflowSet = new Set(workflows);
    const matchesOldCore =
      workflowSet.size === OLD_CORE_WORKFLOWS.length &&
      OLD_CORE_WORKFLOWS.every((workflow) => workflowSet.has(workflow));

    if (!matchesOldCore) {
      return;
    }

    logger.info(chalk.dim('Note: The standard profile now includes sync. Your custom profile is preserving the old minimal workflow set.'));
    logger.info(chalk.dim('Run `grspec config profile standard` and then `grspec update` to add sync.'));
  }

  /**
   * Removes skill directories for workflows when delivery changed to commands-only.
   * Returns the number of directories removed.
   */
  private async removeSkillDirs(skillsDir: string): Promise<number> {
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      for (const dirName of getSkillDirsForWorkflow(workflow)) {
        const skillDir = path.join(skillsDir, dirName);
        try {
          if (fs.existsSync(skillDir)) {
            await fs.promises.rm(skillDir, { recursive: true, force: true });
            removed++;
          }
        } catch {
          // Ignore errors
        }
      }
    }

    try {
      if (await removeLegacyUiHubSkillDir(skillsDir)) {
        removed++;
      }
    } catch {
      // Ignore errors
    }

    try {
      if (await removeLegacyVerifyChangeSkillDir(skillsDir)) {
        removed++;
      }
    } catch {
      // Ignore errors
    }

    return removed;
  }

  /**
   * Removes skill directories for workflows that are no longer selected in the active profile.
   * Returns the number of directories removed.
   */
  private async removeUnselectedSkillDirs(
    skillsDir: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][]
  ): Promise<number> {
    const desiredSet = new Set(desiredWorkflows);
    let removed = 0;

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
      for (const dirName of getSkillDirsForWorkflow(workflow)) {
        const skillDir = path.join(skillsDir, dirName);
        try {
          if (fs.existsSync(skillDir)) {
            await fs.promises.rm(skillDir, { recursive: true, force: true });
            removed++;
          }
        } catch {
          // Ignore errors
        }
      }
    }

    return removed;
  }

  /**
   * Removes command files for workflows when delivery changed to skills-only.
   * Returns the number of files removed.
   */
  private async removeCommandFiles(
    projectPath: string,
    toolId: string,
  ): Promise<number> {
    let removed = 0;

    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    for (const workflow of ALL_WORKFLOWS) {
      const cmdPath = adapter.getFilePath(workflow);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  /**
   * Removes command files for workflows that are no longer selected in the active profile.
   * Returns the number of files removed.
   */
  private async removeUnselectedCommandFiles(
    projectPath: string,
    toolId: string,
    desiredWorkflows: readonly (typeof ALL_WORKFLOWS)[number][]
  ): Promise<number> {
    let removed = 0;

    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    const desiredSet = new Set(desiredWorkflows);

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredSet.has(workflow)) continue;
      const cmdPath = adapter.getFilePath(workflow);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }
}
