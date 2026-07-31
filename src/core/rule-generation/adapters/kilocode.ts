/**
 * Kilo Code Rule Adapter
 *
 * Generates .md files in .kilocode/rules/ with alwaysApply frontmatter.
 */

import path from 'path';
import type { RuleContent, ToolRuleAdapter } from '../types.js';

export const kilocodeRuleAdapter: ToolRuleAdapter = {
  toolId: 'kilocode',

  getRuleFilePath(ruleId: string): string {
    return path.join('.kilocode', 'rules', `grspec-${ruleId}.md`);
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
