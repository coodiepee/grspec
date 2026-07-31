/**
 * Windsurf Rule Adapter
 *
 * Generates .md files in .windsurf/rules/ with trigger: always_on frontmatter.
 */

import path from 'path';
import type { RuleContent, ToolRuleAdapter } from '../types.js';

export const windsurfRuleAdapter: ToolRuleAdapter = {
  toolId: 'windsurf',

  getRuleFilePath(ruleId: string): string {
    return path.join('.windsurf', 'rules', `grspec-${ruleId}.md`);
  },

  formatRuleFile(content: RuleContent): string {
    return `---
trigger: always_on
description: ${content.description}
---

${content.body}
`;
  },
};
