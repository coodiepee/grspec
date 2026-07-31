/**
 * Shared Utilities
 *
 * Common code shared between init and update commands.
 */

export {
  SKILL_NAMES,
  type SkillName,
  COMMAND_IDS,
  type CommandId,
  RULE_IDS,
  type RuleId,
  type ToolSkillStatus,
  type ToolVersionStatus,
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  extractGeneratedByVersion,
  getToolVersionStatus,
  getConfiguredTools,
  getAllToolVersionStatus,
} from './tool-detection.js';

export { parseToolsArg } from './parse-tools-arg.js';

export {
  type SkillTemplateEntry,
  type CommandTemplateEntry,
  getSkillTemplates,
  getCommandTemplates,
  getCommandContents,
  generateSkillContent,
} from './skill-generation.js';
