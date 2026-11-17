/**
 * Init Command
 *
 * Sets up grspec with Agent Skills and /grsx:* slash commands.
 * This is the unified setup command that replaces both the old init and experimental commands.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { resolveSkillInstructionTransformer } from '../utils/command-references.js';
import { logger } from '../utils/logger.js';
import {
  AI_TOOLS,
  GRSPEC_DIR_NAME,
  DEFAULT_SCHEMA,
  AIToolOption,
} from './config.js';
import { PALETTE } from './styles/palette.js';
import { isInteractive } from '../utils/interactive.js';
import { serializeConfig } from './config-prompts.js';
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
  getToolsWithSkillsDir,
  getToolStates,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  parseToolsArg,
  type ToolSkillStatus,
} from './shared/index.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, ALL_WORKFLOWS } from './profiles.js';
import { getAvailableTools } from './available-tools.js';
import { migrateIfNeeded } from './migration.js';
import { getConstitutionTemplate } from './templates/constitution.js';
import { getDomainModelTemplate } from './templates/domain-model.js';
import { generateAgentsMdContent, generateClaudeMd, generateGeminiMd, detectProjectMetadata } from './agents-md/index.js';

const require = createRequire(import.meta.url);
const { version: GRSPEC_VERSION } = require('../../package.json');

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PROGRESS_SPINNER = {
  interval: 80,
  frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};

import { getSkillDirsForWorkflow, LEGACY_UI_HUB_SKILL_DIR, LEGACY_VERIFY_CHANGE_SKILL_DIR, removeLegacyUiHubSkillDir, removeLegacyVerifyChangeSkillDir } from './profile-sync-drift.js';
// Types
// -----------------------------------------------------------------------------

type InitCommandOptions = {
  tools?: string;
  force?: boolean;
  interactive?: boolean;
  profile?: string;
  track?: 'new-project' | 'existing-project';
};

// -----------------------------------------------------------------------------
// Init Command Class
// -----------------------------------------------------------------------------

export class InitCommand {
  private readonly toolsArg?: string;
  private readonly force: boolean;
  private readonly interactiveOption?: boolean;
  private readonly profileOverride?: string;
  private readonly track?: 'new-project' | 'existing-project';

  constructor(options: InitCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.force = options.force ?? false;
    this.interactiveOption = options.interactive;
    this.profileOverride = options.profile;
    const rawTrack = options.track?.trim();
    if (rawTrack) {
      const normalized = rawTrack.toLowerCase();
      if (normalized !== 'new-project' && normalized !== 'existing-project') {
        throw new Error(`Invalid track "${rawTrack}". Use: new-project or existing-project`);
      }
      this.track = normalized;
    } else {
      this.track = undefined;
    }
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    const grspecDir = GRSPEC_DIR_NAME;
    const grspecPath = path.join(projectPath, grspecDir);

    // Validation happens silently in the background
    const extendMode = await this.validate(projectPath, grspecPath);

    // Detect available tools in the project (task 7.1)
    const detectedTools = getAvailableTools(projectPath);

    // Migration check: migrate existing projects to profile system (task 7.3)
    if (extendMode) {
      migrateIfNeeded(projectPath, detectedTools);
    }

    // Show animated welcome screen (interactive mode only)
    const canPrompt = this.canPromptInteractively();
    if (canPrompt) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen();
    }

    // Validate profile override early so invalid values fail before tool setup.
    // The resolved value is consumed later when generation reads effective config.
    this.resolveProfileOverride();

    // Get tool states before processing
    const toolStates = getToolStates(projectPath);

    // Get tool selection (pass detected tools for pre-selection)
    const selectedToolIds = await this.getSelectedTools(toolStates, extendMode, detectedTools, projectPath);

    // Validate selected tools
    const validatedTools = this.validateTools(selectedToolIds, toolStates);

    // Create directory structure and config
    await this.createDirectoryStructure(grspecPath, extendMode);
    await this.writeKnowledgeLayerIfTracked(grspecPath);

    // Generate skills and commands for each tool
    const results = await this.generateSkillsAndCommands(projectPath, validatedTools);

    // Generate AGENTS.md at project root (always, regardless of --tools)
    const agentsMdStatus = await this.generateAgentsMd(projectPath, extendMode);

    // Generate tool-specific pointer files (conditional on --tools)
    const pointerFileStatuses = await this.generatePointerFiles(projectPath, validatedTools, extendMode);

    // Create grspec.yaml if needed
    const configStatus = await this.createConfig(grspecPath, extendMode);

    // Display success message
    this.displaySuccessMessage(projectPath, validatedTools, results, configStatus, agentsMdStatus, pointerFileStatuses);
  }

  // ═══════════════════════════════════════════════════════════
  // VALIDATION & SETUP
  // ═══════════════════════════════════════════════════════════

  private async validate(
    projectPath: string,
    grspecPath: string
  ): Promise<boolean> {
    const extendMode = await FileSystemUtils.directoryExists(grspecPath);

    // Check write permissions
    if (!(await FileSystemUtils.ensureWritePermissions(projectPath))) {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }
    return extendMode;
  }

  private canPromptInteractively(): boolean {
    if (this.interactiveOption === false) return false;
    if (this.toolsArg !== undefined) return false;
    return isInteractive({ interactive: this.interactiveOption });
  }

  private resolveProfileOverride(): Profile | undefined {
    if (this.profileOverride === undefined) {
      return undefined;
    }

    const validProfiles: Profile[] = ['minimal', 'standard', 'full', 'custom'];
    if (validProfiles.includes(this.profileOverride as Profile)) {
      return this.profileOverride as Profile;
    }

    throw new Error(`Invalid profile "${this.profileOverride}". Available profiles: minimal, standard, full, custom`);
  }

  // ═══════════════════════════════════════════════════════════
  // TOOL SELECTION
  // ═══════════════════════════════════════════════════════════

  private async getSelectedTools(
    toolStates: Map<string, ToolSkillStatus>,
    extendMode: boolean,
    detectedTools: AIToolOption[],
    projectPath: string
  ): Promise<string[]> {
    // Check for --tools flag first
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    const validTools = getToolsWithSkillsDir();
    const detectedToolIds = new Set(detectedTools.map((t) => t.value));
    const configuredToolIds = new Set(
      [...toolStates.entries()]
        .filter(([, status]) => status.configured)
        .map(([toolId]) => toolId)
    );
    const shouldPreselectDetected = !extendMode && configuredToolIds.size === 0;
    const canPrompt = this.canPromptInteractively();

    // Non-interactive mode: use detected tools as fallback (task 7.8)
    if (!canPrompt) {
      if (detectedToolIds.size > 0) {
        return [...detectedToolIds];
      }
      throw new Error(
        `No tools detected and no --tools flag provided. Valid tools:\n  ${validTools.join('\n  ')}\n\nUse --tools all, --tools none, or --tools claude,cursor,...`
      );
    }

    if (validTools.length === 0) {
      throw new Error(
        `No tools available for skill generation.`
      );
    }

    // Interactive mode: show searchable multi-select
    const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

    // Build choices: pre-select configured tools; keep detected tools visible but unselected.
    const sortedChoices = validTools
      .map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        const status = toolStates.get(toolId);
        const configured = status?.configured ?? false;
        const detected = detectedToolIds.has(toolId);

        return {
          name: tool?.name || toolId,
          value: toolId,
          configured,
          detected: detected && !configured,
          preSelected: configured || (shouldPreselectDetected && detected && !configured),
        };
      })
      .sort((a, b) => {
        // Configured tools first, then detected (not configured), then everything else.
        if (a.configured && !b.configured) return -1;
        if (!a.configured && b.configured) return 1;
        if (a.detected && !b.detected) return -1;
        if (!a.detected && b.detected) return 1;
        return 0;
      });

    const configuredNames = validTools
      .filter((toolId) => configuredToolIds.has(toolId))
      .map((toolId) => AI_TOOLS.find((t) => t.value === toolId)?.name || toolId);

    if (configuredNames.length > 0) {
      logger.info(`grspec configured: ${configuredNames.join(', ')} (pre-selected)`);
    }

    const detectedOnlyNames = detectedTools
      .filter((tool) => !configuredToolIds.has(tool.value))
      .map((tool) => tool.name);

    if (detectedOnlyNames.length > 0) {
      const detectionLabel = shouldPreselectDetected
        ? 'pre-selected for first-time setup'
        : 'not pre-selected';
      logger.info(`Detected tool directories: ${detectedOnlyNames.join(', ')} (${detectionLabel})`);
    }

    const selectedTools = await searchableMultiSelect({
      message: `Select tools to set up (${validTools.length} available)`,
      pageSize: 15,
      choices: sortedChoices,
      validate: (selected: string[]) => selected.length > 0 || 'Select at least one tool',
    });

    if (selectedTools.length === 0) {
      throw new Error('At least one tool must be selected');
    }

    return selectedTools;
  }

  private resolveToolsArg(): string[] | null {
    if (typeof this.toolsArg === 'undefined') {
      return null;
    }

    return parseToolsArg(this.toolsArg);
  }

  private validateTools(
    toolIds: string[],
    toolStates: Map<string, ToolSkillStatus>
  ): Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> {
    const validatedTools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> = [];

    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool) {
        const validToolIds = getToolsWithSkillsDir();
        throw new Error(
          `Unknown tool '${toolId}'. Valid tools:\n  ${validToolIds.join('\n  ')}`
        );
      }

      if (!tool.skillsDir) {
        const validToolsWithSkills = getToolsWithSkillsDir();
        throw new Error(
          `Tool '${toolId}' does not support skill generation.\nTools with skill generation support:\n  ${validToolsWithSkills.join('\n  ')}`
        );
      }

      const preState = toolStates.get(tool.value);
      validatedTools.push({
        value: tool.value,
        name: tool.name,
        skillsDir: tool.skillsDir,
        wasConfigured: preState?.configured ?? false,
      });
    }

    return validatedTools;
  }

  // ═══════════════════════════════════════════════════════════
  // DIRECTORY STRUCTURE
  // ═══════════════════════════════════════════════════════════

  private async createDirectoryStructure(grspecPath: string, extendMode: boolean): Promise<void> {
    if (extendMode) {
      // In extend mode, just ensure directories exist without spinner
      const directories = [
        grspecPath,
        path.join(grspecPath, 'specs'),
        path.join(grspecPath, 'changes'),
        path.join(grspecPath, 'changes', 'archive'),
      ];

      for (const dir of directories) {
        await FileSystemUtils.createDirectory(dir);
      }
      return;
    }

    const spinner = this.startSpinner('Creating grspec structure...');

    const directories = [
      grspecPath,
      path.join(grspecPath, 'specs'),
      path.join(grspecPath, 'changes'),
      path.join(grspecPath, 'changes', 'archive'),
    ];

    for (const dir of directories) {
      await FileSystemUtils.createDirectory(dir);
    }

    spinner.stopAndPersist({
      symbol: PALETTE.white('▌'),
      text: PALETTE.white('grspec structure created'),
    });
  }

  private async writeKnowledgeLayerIfTracked(grspecPath: string): Promise<void> {
    if (this.track === undefined) {
      return;
    }

    const constitutionPath = path.join(grspecPath, 'constitution.md');
    const domainModelPath = path.join(grspecPath, 'domain-model.md');

    if (!fs.existsSync(constitutionPath)) {
      await FileSystemUtils.writeFile(constitutionPath, getConstitutionTemplate(this.track));
    }
    if (!fs.existsSync(domainModelPath)) {
      await FileSystemUtils.writeFile(domainModelPath, getDomainModelTemplate(this.track));
    }
  }

  private newProjectGrspecYamlExtra(): string {
    return `knowledge:
  constitution: constitution.md
  domain-model: domain-model.md

bootstrap:
  completed: false
  domain-modeling: pending
  architecture: pending
  schema-bootstrap: pending
  skeleton: pending
`;
  }

  // ═══════════════════════════════════════════════════════════
  // SKILL & COMMAND GENERATION
  // ═══════════════════════════════════════════════════════════

  private async generateSkillsAndCommands(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>
  ): Promise<{
    createdTools: typeof tools;
    refreshedTools: typeof tools;
    failedTools: Array<{ name: string; error: Error }>;
    commandsSkipped: string[];
    rulesSkipped: string[];
    rulesGenerated: number;
    removedCommandCount: number;
    removedSkillCount: number;
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];
    const commandsSkipped: string[] = [];
    const rulesSkipped: string[] = [];
    let rulesGenerated = 0;
    let removedCommandCount = 0;
    let removedSkillCount = 0;

    // Read global config for profile and delivery settings (use --profile override if set)
    const globalConfig = getGlobalConfig();
    const profile: Profile = this.resolveProfileOverride() ?? globalConfig.profile ?? 'standard';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const workflows = getProfileWorkflows(profile, globalConfig.workflows);

    // Get skill and command templates filtered by profile workflows
    const shouldGenerateSkills = delivery !== 'commands';
    const shouldGenerateCommands = delivery !== 'skills';
    const skillTemplates = shouldGenerateSkills ? getSkillTemplates(workflows) : [];
    const commandContents = shouldGenerateCommands ? getCommandContents(workflows) : [];

    // Process each tool
    for (const tool of tools) {
      const spinner = ora(`Setting up ${tool.name}...`).start();

      try {
        // Generate skill files if delivery includes skills
        if (shouldGenerateSkills) {
          // Use tool-specific skillsDir
          const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

          // Create skill directories and SKILL.md files
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            // Generate SKILL.md content with YAML frontmatter including generatedBy
            // Some tools invoke skills with different slash syntax than /grsx:*
            const transformer = resolveSkillInstructionTransformer(tool.value);
            const skillContent = generateSkillContent(template, GRSPEC_VERSION, transformer);

            // Write the skill file
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
        }
        if (!shouldGenerateSkills) {
          const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
          removedSkillCount += await this.removeSkillDirs(skillsDir);
        }

        // Generate commands if delivery includes commands
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = path.isAbsolute(cmd.path) ? cmd.path : path.join(projectPath, cmd.path);
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }
          } else {
            commandsSkipped.push(tool.value);
          }
        }
        if (!shouldGenerateCommands) {
          removedCommandCount += await this.removeCommandFiles(projectPath, tool.value);
        }

        // Generate rules (always, regardless of delivery/profile)
        const ruleAdapter = RuleAdapterRegistry.get(tool.value);
        if (ruleAdapter) {
          const ruleTemplates = getRuleTemplates();
          const ruleContents = ruleTemplates.map(entry => entry.content);
          const generatedRuleFiles = generateRules(ruleContents, ruleAdapter);

          for (const rule of generatedRuleFiles) {
            const ruleFile = path.isAbsolute(rule.path) ? rule.path : path.join(projectPath, rule.path);
            await FileSystemUtils.writeFile(ruleFile, rule.fileContent);
          }
          rulesGenerated += generatedRuleFiles.length;
        } else {
          rulesSkipped.push(tool.value);
        }

        spinner.succeed(`Setup complete for ${tool.name}`);

        if (tool.wasConfigured) {
          refreshedTools.push(tool);
        } else {
          createdTools.push(tool);
        }
      } catch (error) {
        spinner.fail(`Failed for ${tool.name}`);
        failedTools.push({ name: tool.name, error: error as Error });
      }
    }

    return {
      createdTools,
      refreshedTools,
      failedTools,
      commandsSkipped,
      rulesSkipped,
      rulesGenerated,
      removedCommandCount,
      removedSkillCount,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIG FILE
  // ═══════════════════════════════════════════════════════════

  private async createConfig(grspecPath: string, extendMode: boolean): Promise<'created' | 'exists' | 'skipped'> {
    const configPath = path.join(grspecPath, 'grspec.yaml');
    const configYmlPath = path.join(grspecPath, 'grspec.yml');
    const legacyYaml = path.join(grspecPath, 'config.yaml');
    const legacyYml = path.join(grspecPath, 'config.yml');
    const configYamlExists = fs.existsSync(configPath);
    const configYmlExists = fs.existsSync(configYmlPath);
    const legacyExists = fs.existsSync(legacyYaml) || fs.existsSync(legacyYml);

    if (configYamlExists || configYmlExists || legacyExists) {
      return 'exists';
    }

    // In non-interactive mode without --force, skip config creation
    if (!this.canPromptInteractively() && !this.force) {
      return 'skipped';
    }

    try {
      const baseYaml = serializeConfig({ schema: DEFAULT_SCHEMA });
      const yamlContent =
        this.track === 'new-project' ? baseYaml + this.newProjectGrspecYamlExtra() : baseYaml;
      await FileSystemUtils.writeFile(configPath, yamlContent);
      return 'created';
    } catch {
      return 'skipped';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // AGENTS.MD GENERATION
  // ═══════════════════════════════════════════════════════════

  private async generateAgentsMd(
    projectPath: string,
    extendMode: boolean
  ): Promise<'created' | 'exists' | 'skipped'> {
    const agentsMdPath = path.join(projectPath, 'AGENTS.md');

    if (fs.existsSync(agentsMdPath) && !this.force) {
      if (extendMode) {
        logger.info(chalk.dim('AGENTS.md exists, skipping (use --force to regenerate)'));
      }
      return 'exists';
    }

    try {
      const content = generateAgentsMdContent(projectPath, GRSPEC_VERSION);
      await FileSystemUtils.writeFile(agentsMdPath, content);
      return 'created';
    } catch {
      return 'skipped';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // POINTER FILE GENERATION
  // ═══════════════════════════════════════════════════════════

  private async generatePointerFiles(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>,
    extendMode: boolean,
  ): Promise<Record<string, 'created' | 'exists' | 'skipped'>> {
    const toolIds = new Set(tools.map(t => t.value));
    const metadata = detectProjectMetadata(projectPath);
    const statuses: Record<string, 'created' | 'exists' | 'skipped'> = {};

    const pointerFiles: Array<{
      toolId: string;
      filename: string;
      generate: (name: string) => string;
    }> = [
      { toolId: 'claude', filename: 'CLAUDE.md', generate: generateClaudeMd },
      { toolId: 'gemini', filename: 'GEMINI.md', generate: generateGeminiMd },
    ];

    for (const { toolId, filename, generate } of pointerFiles) {
      if (!toolIds.has(toolId)) continue;

      const filePath = path.join(projectPath, filename);

      if (fs.existsSync(filePath) && !this.force) {
        if (extendMode) {
          logger.info(chalk.dim(`${filename} exists, skipping (use --force to regenerate)`));
        }
        statuses[filename] = 'exists';
        continue;
      }

      try {
        const content = generate(metadata.name);
        await FileSystemUtils.writeFile(filePath, content);
        statuses[filename] = 'created';
      } catch {
        statuses[filename] = 'skipped';
      }
    }

    return statuses;
  }

  // ═══════════════════════════════════════════════════════════
  // UI & OUTPUT
  // ═══════════════════════════════════════════════════════════

  private displaySuccessMessage(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>,
    results: {
      createdTools: typeof tools;
      refreshedTools: typeof tools;
      failedTools: Array<{ name: string; error: Error }>;
      commandsSkipped: string[];
      rulesSkipped: string[];
      rulesGenerated: number;
      removedCommandCount: number;
      removedSkillCount: number;
    },
    configStatus: 'created' | 'exists' | 'skipped',
    agentsMdStatus: 'created' | 'exists' | 'skipped' = 'skipped',
    pointerFileStatuses: Record<string, 'created' | 'exists' | 'skipped'> = {},
  ): void {
    logger.info('');
    logger.info(chalk.bold('grspec Setup Complete'));
    logger.info('');

    // Show created vs refreshed tools
    if (results.createdTools.length > 0) {
      logger.info(`Created: ${results.createdTools.map((t) => t.name).join(', ')}`);
    }
    if (results.refreshedTools.length > 0) {
      logger.info(`Refreshed: ${results.refreshedTools.map((t) => t.name).join(', ')}`);
    }

    // Show counts (respecting profile filter)
    const successfulTools = [...results.createdTools, ...results.refreshedTools];
    if (successfulTools.length > 0) {
      const globalConfig = getGlobalConfig();
      const profile: Profile = (this.profileOverride as Profile) ?? globalConfig.profile ?? 'standard';
      const delivery: Delivery = globalConfig.delivery ?? 'both';
      const workflows = getProfileWorkflows(profile, globalConfig.workflows);
      const toolDirs = [...new Set(successfulTools.map((t) => t.skillsDir))].join(', ');
      const skillCount = delivery !== 'commands' ? getSkillTemplates(workflows).length : 0;
      const commandCount = delivery !== 'skills' ? getCommandContents(workflows).length : 0;
      const ruleCount = results.rulesGenerated > 0 ? Math.round(results.rulesGenerated / successfulTools.length) : 0;
      const parts: string[] = [];
      if (skillCount > 0) parts.push(`${skillCount} skills`);
      if (commandCount > 0) parts.push(`${commandCount} commands`);
      if (ruleCount > 0) parts.push(`${ruleCount} ${ruleCount === 1 ? 'rule' : 'rules'}`);
      if (parts.length > 0) {
        logger.info(`${parts.join(', ')} in ${toolDirs}/`);
      }
    }

    // Show failures
    if (results.failedTools.length > 0) {
      logger.error(chalk.red(`Failed: ${results.failedTools.map((f) => `${f.name} (${f.error.message})`).join(', ')}`));
    }

    // Show skipped commands
    if (results.commandsSkipped.length > 0) {
      logger.info(chalk.dim(`Commands skipped for: ${results.commandsSkipped.join(', ')} (no adapter)`));
    }
    if (results.rulesSkipped.length > 0) {
      logger.info(chalk.dim(`Rules skipped for: ${results.rulesSkipped.join(', ')} (no adapter)`));
    }
    if (results.removedCommandCount > 0) {
      logger.info(chalk.dim(`Removed: ${results.removedCommandCount} command files (delivery: skills)`));
    }
    if (results.removedSkillCount > 0) {
      logger.info(chalk.dim(`Removed: ${results.removedSkillCount} skill directories (delivery: commands)`));
    }

    // Config status
    if (configStatus === 'created') {
      logger.info(`Config: grspec/grspec.yaml (schema: ${DEFAULT_SCHEMA})`);
    } else if (configStatus === 'exists') {
      const grspecYaml = path.join(projectPath, GRSPEC_DIR_NAME, 'grspec.yaml');
      const grspecYml = path.join(projectPath, GRSPEC_DIR_NAME, 'grspec.yml');
      const legacyYaml = path.join(projectPath, GRSPEC_DIR_NAME, 'config.yaml');
      const legacyYml = path.join(projectPath, GRSPEC_DIR_NAME, 'config.yml');
      const configName = fs.existsSync(grspecYaml)
        ? 'grspec.yaml'
        : fs.existsSync(grspecYml)
          ? 'grspec.yml'
          : fs.existsSync(legacyYaml)
            ? 'config.yaml'
            : fs.existsSync(legacyYml)
              ? 'config.yml'
              : 'grspec.yaml';
      logger.info(`Config: grspec/${configName} (exists)`);
    } else {
      logger.info(chalk.dim(`Config: skipped (non-interactive mode)`));
    }

    // AGENTS.md status
    if (agentsMdStatus === 'created') {
      logger.info('AGENTS.md: created (project context for AI tools)');
    } else if (agentsMdStatus === 'exists') {
      logger.info('AGENTS.md: exists');
    }

    // Pointer file statuses
    for (const [filename, status] of Object.entries(pointerFileStatuses)) {
      if (status === 'created') {
        logger.info(`${filename}: created (references AGENTS.md)`);
      } else if (status === 'exists') {
        logger.info(`${filename}: exists`);
      }
    }

    // Getting started (task 7.6: show propose if in profile)
    const globalCfg = getGlobalConfig();
    const activeProfile: Profile = (this.profileOverride as Profile) ?? globalCfg.profile ?? 'standard';
    const activeWorkflows = [...getProfileWorkflows(activeProfile, globalCfg.workflows)];
    logger.info('');
    if (activeWorkflows.includes('propose')) {
      logger.info(chalk.bold('Getting started:'));
      logger.info('  Start your first change: /grsx:propose "your idea"');
    } else if (activeWorkflows.includes('new')) {
      logger.info(chalk.bold('Getting started:'));
      logger.info('  Start your first change: /grsx:new "your idea"');
    } else {
      logger.info("Done. Run 'grspec config profile' to configure your workflows.");
    }

    // Links
    logger.info('');
    logger.info(`Learn more: ${chalk.cyan('https://github.com/grspec/grspec')}`);
    logger.info(`Feedback:   ${chalk.cyan('https://github.com/grspec/grspec/issues')}`);

    // Restart instruction if any tools were configured
    if (results.createdTools.length > 0 || results.refreshedTools.length > 0) {
      logger.info('');
      logger.info(chalk.white('Restart your IDE for slash commands to take effect.'));
    }

    logger.info('');
  }

  private startSpinner(text: string) {
    return ora({
      text,
      stream: process.stdout,
      color: 'gray',
      spinner: PROGRESS_SPINNER,
    }).start();
  }

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
        } catch (err) {
          logger.debug(`Could not remove skill dir ${skillDir}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    const legacyHubDir = path.join(skillsDir, LEGACY_UI_HUB_SKILL_DIR);
    try {
      if (await removeLegacyUiHubSkillDir(skillsDir)) {
        removed++;
      }
    } catch (err) {
      logger.debug(`Could not remove legacy hub skill dir ${legacyHubDir}: ${err instanceof Error ? err.message : String(err)}`);
    }

    const legacyVerifyChangeDir = path.join(skillsDir, LEGACY_VERIFY_CHANGE_SKILL_DIR);
    try {
      if (await removeLegacyVerifyChangeSkillDir(skillsDir)) {
        removed++;
      }
    } catch (err) {
      logger.debug(
        `Could not remove legacy verify-change skill dir ${legacyVerifyChangeDir}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    return removed;
  }

  private async removeCommandFiles(projectPath: string, toolId: string): Promise<number> {
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
      } catch (err) {
        logger.debug(`Could not remove command file ${fullPath}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return removed;
  }
}
