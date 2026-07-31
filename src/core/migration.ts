/**
 * Migration Utilities
 *
 * One-time migration logic for existing projects when profile system is introduced.
 * Called by both init and update commands before profile resolution.
 */

import type { AIToolOption } from './config.js';
import { getGlobalConfigPath, updateGlobalConfig, type Delivery } from './global-config.js';
import { logger } from '../utils/logger.js';
import { CommandAdapterRegistry } from './command-generation/index.js';
import { getSkillDirsForWorkflow, LEGACY_UI_HUB_SKILL_DIR } from './profile-sync-drift.js';
import { ALL_WORKFLOWS } from './profiles.js';
import path from 'path';
import * as fs from 'fs';

interface InstalledWorkflowArtifacts {
  workflows: string[];
  hasSkills: boolean;
  hasCommands: boolean;
}

function scanInstalledWorkflowArtifacts(
  projectPath: string,
  tools: AIToolOption[]
): InstalledWorkflowArtifacts {
  const installed = new Set<string>();
  let hasSkills = false;
  let hasCommands = false;

  for (const tool of tools) {
    if (!tool.skillsDir) continue;
    const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

    for (const workflowId of ALL_WORKFLOWS) {
      for (const skillDirName of getSkillDirsForWorkflow(workflowId)) {
        const skillFile = path.join(skillsDir, skillDirName, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          installed.add(workflowId);
          hasSkills = true;
          break;
        }
      }
    }

    const adapter = CommandAdapterRegistry.get(tool.value);
    if (!adapter) continue;

    for (const workflowId of ALL_WORKFLOWS) {
      const commandPath = adapter.getFilePath(workflowId);
      const fullPath = path.isAbsolute(commandPath)
        ? commandPath
        : path.join(projectPath, commandPath);
      if (fs.existsSync(fullPath)) {
        installed.add(workflowId);
        hasCommands = true;
      }
    }
  }

  return {
    workflows: ALL_WORKFLOWS.filter((workflowId) => installed.has(workflowId)),
    hasSkills,
    hasCommands,
  };
}

/**
 * Scans installed workflow files across all detected tools and returns
 * the union of installed workflow IDs.
 */
export function scanInstalledWorkflows(projectPath: string, tools: AIToolOption[]): string[] {
  return scanInstalledWorkflowArtifacts(projectPath, tools).workflows;
}

function inferDelivery(artifacts: InstalledWorkflowArtifacts): Delivery {
  if (artifacts.hasSkills && artifacts.hasCommands) {
    return 'both';
  }
  if (artifacts.hasCommands) {
    return 'commands';
  }
  return 'skills';
}

/**
 * Performs one-time migration if the global config does not yet have a profile field.
 * Called by both init and update before profile resolution.
 *
 * - If no profile field exists and workflows are installed: sets profile to 'custom'
 *   with the detected workflows, preserving the user's existing setup.
 * - If no profile field exists and no workflows are installed: no-op (defaults apply).
 * - If profile field already exists: no-op.
 */
export function migrateIfNeeded(projectPath: string, tools: AIToolOption[]): void {
  const configPath = getGlobalConfigPath();

  let rawConfig: Record<string, unknown> = {};
  try {
    if (fs.existsSync(configPath)) {
      rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch {
    return; // Can't read config, skip migration
  }

  // If profile is already explicitly set, no migration needed
  if (rawConfig.profile !== undefined) {
    return;
  }

  // Scan for installed workflows
  const artifacts = scanInstalledWorkflowArtifacts(projectPath, tools);
  const installedWorkflows = artifacts.workflows;

  if (installedWorkflows.length === 0) {
    // No workflows installed, new user — defaults will apply
    return;
  }

  // Migrate: set profile to custom with detected workflows
  const inferredDelivery = rawConfig.delivery === undefined ? inferDelivery(artifacts) : undefined;
  updateGlobalConfig((cfg) => {
    cfg.profile = 'custom';
    cfg.workflows = installedWorkflows;
    if (inferredDelivery !== undefined) {
      cfg.delivery = inferredDelivery;
    }
  });

  logger.info(`Migrated: custom profile with ${installedWorkflows.length} workflows`);
  logger.info("New in this version: /grsx:propose. Try 'grspec config profile standard' for the streamlined experience.");
}
