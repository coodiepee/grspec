/**
 * Generic Rule Adapter Factory
 *
 * Creates rule adapters for tools that lack a documented rules directory convention.
 * Writes to <skillsDir>/rules/grspec-<id>.md without frontmatter.
 */

import path from 'path';
import type { RuleContent, ToolRuleAdapter } from '../types.js';
import { AI_TOOLS } from '../../config.js';

const TIER_1_TOOL_IDS = new Set([
  'cursor',
  'claude',
  'windsurf',
  'cline',
  'roocode',
  'github-copilot',
  'kilocode',
]);

export function createGenericRuleAdapter(toolId: string, skillsDir: string): ToolRuleAdapter {
  return {
    toolId,

    getRuleFilePath(ruleId: string): string {
      return path.join(skillsDir, 'rules', `grspec-${ruleId}.md`);
    },

    formatRuleFile(content: RuleContent): string {
      return `${content.body}
`;
    },
  };
}

/**
 * Pre-built generic adapters for all Tier 2 tools (those with skillsDir but no custom adapter).
 */
export const genericRuleAdapters: ToolRuleAdapter[] = AI_TOOLS
  .filter(tool => tool.skillsDir && tool.available && !TIER_1_TOOL_IDS.has(tool.value))
  .map(tool => createGenericRuleAdapter(tool.value, tool.skillsDir!));
