/**
 * Lingma Command Adapter
 *
 * Formats commands for Lingma following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

/**
 * Lingma adapter for command generation.
 * File path: .lingma/commands/grsx/<id>.md
 * Frontmatter: name, description, category, tags
 */
export const lingmaAdapter: ToolCommandAdapter = {
  toolId: 'lingma',

  getFilePath(commandId: string): string {
    return path.join('.lingma', 'commands', 'grsx', `${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    const tagsStr = content.tags.join(', ');
    return `---
name: ${content.name}
description: ${content.description}
category: ${content.category}
tags: [${tagsStr}]
---

${content.body}
`;
  },
};
