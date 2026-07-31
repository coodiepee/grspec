/**
 * Cline Rule Adapter
 *
 * Generates .md files in .clinerules/ with alwaysApply frontmatter.
 */

import path from 'path';
import type { RuleContent, ToolRuleAdapter } from '../types.js';

export const clineRuleAdapter: ToolRuleAdapter = {
  toolId: 'cline',

  getRuleFilePath(ruleId: string): string {
    return path.join('.clinerules', `grspec-${ruleId}.md`);
  },

  formatRuleFile(content: RuleContent): string {
    return `---
alwaysApply: true
description: ${content.description}
---

${content.body}
`;
  },
};
