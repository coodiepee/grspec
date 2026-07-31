/**
 * RooCode Rule Adapter
 *
 * Generates .md files in .roo/rules/ without frontmatter.
 * All files in .roo/rules/ are always loaded by RooCode.
 */

import path from 'path';
import type { RuleContent, ToolRuleAdapter } from '../types.js';

export const roocodeRuleAdapter: ToolRuleAdapter = {
  toolId: 'roocode',

  getRuleFilePath(ruleId: string): string {
    return path.join('.roo', 'rules', `grspec-${ruleId}.md`);
  },

  formatRuleFile(content: RuleContent): string {
    return `${content.body}
`;
  },
};
