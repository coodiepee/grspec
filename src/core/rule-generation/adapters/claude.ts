/**
 * Claude Code Rule Adapter
 *
 * Generates .md files in .claude/rules/ without frontmatter.
 * Rules without a `paths` field are loaded unconditionally by Claude Code.
 */

import path from 'path';
import type { RuleContent, ToolRuleAdapter } from '../types.js';

export const claudeRuleAdapter: ToolRuleAdapter = {
  toolId: 'claude',

  getRuleFilePath(ruleId: string): string {
    return path.join('.claude', 'rules', `grspec-${ruleId}.md`);
  },

  formatRuleFile(content: RuleContent): string {
    return `${content.body}
`;
  },
};
