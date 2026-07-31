/**
 * GitHub Copilot Rule Adapter
 *
 * Generates .instructions.md files in .github/instructions/ with applyTo: "**" frontmatter.
 */

import path from 'path';
import type { RuleContent, ToolRuleAdapter } from '../types.js';

export const githubCopilotRuleAdapter: ToolRuleAdapter = {
  toolId: 'github-copilot',

  getRuleFilePath(ruleId: string): string {
    return path.join('.github', 'instructions', `grspec-${ruleId}.instructions.md`);
  },

  formatRuleFile(content: RuleContent): string {
    return `---
applyTo: "**"
description: ${content.description}
---

${content.body}
`;
  },
};
