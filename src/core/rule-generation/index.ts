/**
 * Rule Generation Module
 *
 * Generic rule generation system with tool-specific adapters.
 * Parallels the command-generation module.
 */

export type {
  RuleContent,
  ToolRuleAdapter,
  GeneratedRule,
} from './types.js';

export { RuleAdapterRegistry } from './registry.js';

export { generateRule, generateRules } from './generator.js';

export { getRuleTemplates, type RuleTemplateEntry } from './rule-templates.js';

export {
  cursorRuleAdapter,
  claudeRuleAdapter,
  windsurfRuleAdapter,
  clineRuleAdapter,
  roocodeRuleAdapter,
  githubCopilotRuleAdapter,
  kilocodeRuleAdapter,
  createGenericRuleAdapter,
} from './adapters/index.js';
