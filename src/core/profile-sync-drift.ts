import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS } from './config.js';
import type { Delivery } from './global-config.js';
import { ALL_WORKFLOWS } from './profiles.js';
import { CommandAdapterRegistry } from './command-generation/index.js';
import { COMMAND_IDS, getConfiguredTools } from './shared/index.js';

type WorkflowId = (typeof ALL_WORKFLOWS)[number];

/**
 * Maps workflow IDs to their command IDs.
 * Most workflows have a 1:1 mapping; wiki expands to 6 individual commands.
 */
export const WORKFLOW_TO_COMMAND_IDS: Record<WorkflowId, readonly string[]> = {
  'explore': ['explore'],
  'new': ['new'],
  'continue': ['continue'],
  'apply': ['apply'],
  'ff': ['ff'],
  'sync': ['sync'],
  'archive': ['archive'],
  'bulk-archive': ['bulk-archive'],
  'validate': ['validate'],
  'verify': ['verify'],
  'onboard': ['onboard'],
  'propose': ['propose'],
  'tdd': [],
  'debug': [],
  'review': [],
  'parallel': [],
  'subagent': [],
  'wiki': ['wiki', 'wiki-init', 'wiki-ingest', 'wiki-lint', 'wiki-query', 'wiki-sync', 'wiki-status'],
  'ui': [
    'ui-init',
    'ui-search',
    'ui-design-system',
    'ui-rules',
    'ui-reference',
    'ui-review',
    'ui-status',
    'ui-detect',
    'ui-install',
    'ui-sync',
  ],
};

/** Subcommand skill directories installed for workflow `ui` (no hub). */
export const UI_SUBCOMMAND_SKILL_DIRS = [
  'grspec-ui-init',
  'grspec-ui-search',
  'grspec-ui-design-system',
  'grspec-ui-rules',
  'grspec-ui-reference',
  'grspec-ui-review',
  'grspec-ui-status',
  'grspec-ui-detect',
  'grspec-ui-install',
  'grspec-ui-sync',
] as const;

/** Legacy hub removed in ui-artifact-workflow; presence triggers profile drift. */
export const LEGACY_UI_HUB_SKILL_DIR = 'grspec-ui';

/** Legacy hub slash command id (`grsx-ui.md`); subcommands use `ui-init`, etc. */
export const LEGACY_UI_HUB_COMMAND_ID = 'ui';

export const WORKFLOW_TO_SKILL_DIRS: Partial<Record<WorkflowId, readonly string[]>> = {
  ui: UI_SUBCOMMAND_SKILL_DIRS,
};

/**
 * Maps workflow IDs to their primary skill directory (1:1 workflows only).
 * Multi-skill workflows use WORKFLOW_TO_SKILL_DIRS instead.
 */
/** Legacy skill dir renamed to `grspec-verify` (verify workflow). */
export const LEGACY_VERIFY_CHANGE_SKILL_DIR = 'grspec-verify-change';

export const WORKFLOW_TO_SKILL_DIR: Partial<Record<WorkflowId, string>> = {
  'explore': 'grspec-explore',
  'new': 'grspec-new-change',
  'continue': 'grspec-continue-change',
  'apply': 'grspec-apply-change',
  'ff': 'grspec-ff-change',
  'sync': 'grspec-sync-specs',
  'archive': 'grspec-archive-change',
  'bulk-archive': 'grspec-bulk-archive-change',
  'validate': 'grspec-validate',
  'verify': 'grspec-verify',
  'onboard': 'grspec-onboard',
  'propose': 'grspec-propose',
  'tdd': 'grspec-tdd',
  'debug': 'grspec-debug',
  'review': 'grspec-review',
  'parallel': 'grspec-parallel',
  'subagent': 'grspec-subagent',
  'wiki': 'grspec-wiki',
};

export function getSkillDirsForWorkflow(workflow: WorkflowId): readonly string[] {
  const multiSkillDirs = WORKFLOW_TO_SKILL_DIRS[workflow];
  if (multiSkillDirs) {
    return multiSkillDirs;
  }

  const singleSkillDir = WORKFLOW_TO_SKILL_DIR[workflow];
  if (singleSkillDir) {
    return [singleSkillDir];
  }

  return [];
}

function toKnownWorkflows(workflows: readonly string[]): WorkflowId[] {
  return workflows.filter(
    (workflow): workflow is WorkflowId =>
      (ALL_WORKFLOWS as readonly string[]).includes(workflow)
  );
}

/**
 * Checks whether a tool has at least one generated grspec command file.
 */
export function toolHasAnyConfiguredCommand(projectPath: string, toolId: string): boolean {
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) return false;

  for (const commandId of COMMAND_IDS) {
    const cmdPath = adapter.getFilePath(commandId);
    const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
    if (fs.existsSync(fullPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns tools with at least one generated command file on disk.
 */
export function getCommandConfiguredTools(projectPath: string): string[] {
  return AI_TOOLS
    .filter((tool) => {
      if (!tool.skillsDir) return false;
      const toolDir = path.join(projectPath, tool.skillsDir);
      try {
        return fs.statSync(toolDir).isDirectory();
      } catch {
        return false;
      }
    })
    .map((tool) => tool.value)
    .filter((toolId) => toolHasAnyConfiguredCommand(projectPath, toolId));
}

/**
 * Returns tools that are configured via either skills or commands.
 */
export function getConfiguredToolsForProfileSync(projectPath: string): string[] {
  const skillConfigured = getConfiguredTools(projectPath);
  const commandConfigured = getCommandConfiguredTools(projectPath);
  return [...new Set([...skillConfigured, ...commandConfigured])];
}

/**
 * Detects if a single tool has profile/delivery drift against the desired state.
 *
 * This function covers:
 * - required artifacts missing for selected workflows
 * - artifacts that should not exist for the selected delivery mode
 * - artifacts for workflows that were deselected from the current profile
 */
export function hasToolProfileOrDeliveryDrift(
  projectPath: string,
  toolId: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery
): boolean {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool?.skillsDir) return false;

  const knownDesiredWorkflows = toKnownWorkflows(desiredWorkflows);
  const desiredWorkflowSet = new Set<WorkflowId>(knownDesiredWorkflows);
  const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
  const adapter = CommandAdapterRegistry.get(toolId);
  const shouldGenerateSkills = delivery !== 'commands';
  const shouldGenerateCommands = delivery !== 'skills';

  if (shouldGenerateSkills) {
    for (const workflow of knownDesiredWorkflows) {
      for (const dirName of getSkillDirsForWorkflow(workflow)) {
        const skillFile = path.join(skillsDir, dirName, 'SKILL.md');
        if (!fs.existsSync(skillFile)) {
          return true;
        }
      }
    }

    const legacyHubDir = path.join(skillsDir, LEGACY_UI_HUB_SKILL_DIR);
    if (fs.existsSync(legacyHubDir)) {
      return true;
    }

    const legacyVerifyChangeDir = path.join(skillsDir, LEGACY_VERIFY_CHANGE_SKILL_DIR);
    if (fs.existsSync(legacyVerifyChangeDir)) {
      return true;
    }

    const legacyHubCommand = resolveLegacyUiHubCommandPath(projectPath, toolId);
    if (legacyHubCommand && fs.existsSync(legacyHubCommand)) {
      return true;
    }

    // Deselecting workflows in a profile should trigger sync.
    for (const workflow of ALL_WORKFLOWS) {
      if (desiredWorkflowSet.has(workflow)) continue;
      for (const dirName of getSkillDirsForWorkflow(workflow)) {
        const skillDir = path.join(skillsDir, dirName);
        if (fs.existsSync(skillDir)) {
          return true;
        }
      }
    }
  } else {
    for (const workflow of ALL_WORKFLOWS) {
      for (const dirName of getSkillDirsForWorkflow(workflow)) {
        const skillDir = path.join(skillsDir, dirName);
        if (fs.existsSync(skillDir)) {
          return true;
        }
      }
    }

    const legacyHubDir = path.join(skillsDir, LEGACY_UI_HUB_SKILL_DIR);
    if (fs.existsSync(legacyHubDir)) {
      return true;
    }

    const legacyVerifyChangeDir = path.join(skillsDir, LEGACY_VERIFY_CHANGE_SKILL_DIR);
    if (fs.existsSync(legacyVerifyChangeDir)) {
      return true;
    }
  }

  if (shouldGenerateCommands && adapter) {
    for (const workflow of knownDesiredWorkflows) {
      const cmdIds = WORKFLOW_TO_COMMAND_IDS[workflow] ?? [];
      for (const cmdId of cmdIds) {
        const cmdPath = adapter.getFilePath(cmdId);
        const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
        if (!fs.existsSync(fullPath)) {
          return true;
        }
      }
    }

    for (const workflow of ALL_WORKFLOWS) {
      if (desiredWorkflowSet.has(workflow)) continue;
      const cmdIds = WORKFLOW_TO_COMMAND_IDS[workflow] ?? [];
      for (const cmdId of cmdIds) {
        const cmdPath = adapter.getFilePath(cmdId);
        const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
        if (fs.existsSync(fullPath)) {
          return true;
        }
      }
    }
  } else if (!shouldGenerateCommands && adapter) {
    for (const workflow of ALL_WORKFLOWS) {
      const cmdIds = WORKFLOW_TO_COMMAND_IDS[workflow] ?? [];
      for (const cmdId of cmdIds) {
        const cmdPath = adapter.getFilePath(cmdId);
        const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
        if (fs.existsSync(fullPath)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Returns configured tools that currently need a profile/delivery sync.
 */
export function getToolsNeedingProfileSync(
  projectPath: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery,
  configuredTools?: readonly string[]
): string[] {
  const tools = configuredTools ? [...new Set(configuredTools)] : getConfiguredToolsForProfileSync(projectPath);
  return tools.filter((toolId) =>
    hasToolProfileOrDeliveryDrift(projectPath, toolId, desiredWorkflows, delivery)
  );
}

function getInstalledWorkflowsForTool(
  projectPath: string,
  toolId: string,
  options: { includeSkills: boolean; includeCommands: boolean }
): WorkflowId[] {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool?.skillsDir) return [];

  const installed = new Set<WorkflowId>();
  const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

  if (options.includeSkills) {
    for (const workflow of ALL_WORKFLOWS) {
      for (const dirName of getSkillDirsForWorkflow(workflow)) {
        const skillFile = path.join(skillsDir, dirName, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          installed.add(workflow);
          break;
        }
      }
    }
  }

  if (options.includeCommands) {
    const adapter = CommandAdapterRegistry.get(toolId);
    if (adapter) {
      for (const workflow of ALL_WORKFLOWS) {
        const cmdIds = WORKFLOW_TO_COMMAND_IDS[workflow] ?? [];
        const hasAny = cmdIds.some((cmdId) => {
          const cmdPath = adapter.getFilePath(cmdId);
          const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
          return fs.existsSync(fullPath);
        });
        if (hasAny) {
          installed.add(workflow);
        }
      }
    }
  }

  return [...installed];
}

/**
 * Detects whether the current project has any profile/delivery drift.
 */
export function hasProjectConfigDrift(
  projectPath: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery
): boolean {
  const configuredTools = getConfiguredToolsForProfileSync(projectPath);
  if (getToolsNeedingProfileSync(projectPath, desiredWorkflows, delivery, configuredTools).length > 0) {
    return true;
  }

  const desiredSet = new Set(toKnownWorkflows(desiredWorkflows));
  const includeSkills = delivery !== 'commands';
  const includeCommands = delivery !== 'skills';

  for (const toolId of configuredTools) {
    const installed = getInstalledWorkflowsForTool(projectPath, toolId, { includeSkills, includeCommands });
    if (installed.some((workflow) => !desiredSet.has(workflow))) {
      return true;
    }
  }

  return false;
}

export function resolveLegacyUiHubCommandPath(projectPath: string, toolId: string): string | null {
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) {
    return null;
  }

  const cmdPath = adapter.getFilePath(LEGACY_UI_HUB_COMMAND_ID);
  return path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
}

export async function removeLegacyUiHubSkillDir(skillsDir: string): Promise<boolean> {
  const legacyHubDir = path.join(skillsDir, LEGACY_UI_HUB_SKILL_DIR);
  if (!fs.existsSync(legacyHubDir)) {
    return false;
  }

  await fs.promises.rm(legacyHubDir, { recursive: true, force: true });
  return true;
}

export async function removeLegacyUiHubCommandFile(projectPath: string, toolId: string): Promise<boolean> {
  const legacyHubCommand = resolveLegacyUiHubCommandPath(projectPath, toolId);
  if (!legacyHubCommand || !fs.existsSync(legacyHubCommand)) {
    return false;
  }

  await fs.promises.unlink(legacyHubCommand);
  return true;
}

export async function removeLegacyVerifyChangeSkillDir(skillsDir: string): Promise<boolean> {
  const legacyDir = path.join(skillsDir, LEGACY_VERIFY_CHANGE_SKILL_DIR);
  if (!fs.existsSync(legacyDir)) {
    return false;
  }

  await fs.promises.rm(legacyDir, { recursive: true, force: true });
  return true;
}
