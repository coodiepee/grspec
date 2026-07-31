/**
 * Cursor Rule Adapter
 *
 * Generates .mdc files in .cursor/rules/ with alwaysApply frontmatter.
 */

import path from 'path';
import type { RuleContent, ToolRuleAdapter } from '../types.js';

export const cursorRuleAdapter: ToolRuleAdapter = {
  toolId: 'cursor',

  getRuleFilePath(ruleId: string): string {
    return path.join('.cursor', 'rules', `grspec-${ruleId}.mdc`);
  },

  formatRuleFile(content: RuleContent): string {
    return `---
description: ${content.description}
alwaysApply: true
---

${content.body}
`;
  },
};
