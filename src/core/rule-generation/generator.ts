/**
 * Rule Generator
 *
 * Combines tool-agnostic rule content with tool-specific adapters
 * to produce formatted rule files.
 */

import type { RuleContent, ToolRuleAdapter, GeneratedRule } from './types.js';

/**
 * Generate a single rule file from content and adapter.
 */
export function generateRule(content: RuleContent, adapter: ToolRuleAdapter): GeneratedRule {
  return {
    path: adapter.getRuleFilePath(content.id),
    fileContent: adapter.formatRuleFile(content),
  };
}

/**
 * Generate multiple rule files from an array of content entries.
 */
export function generateRules(contents: RuleContent[], adapter: ToolRuleAdapter): GeneratedRule[] {
  return contents.map(content => generateRule(content, adapter));
}
