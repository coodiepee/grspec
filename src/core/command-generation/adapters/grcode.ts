/**
 * GRCode Command Adapter
 *
 * Formats commands for GRCode following its frontmatter specification.
 * Commands are stored in .grcode/commands/ directory.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue, formatTagsArray } from './yaml-utils.js';

/**
 * GRCode adapter for command generation.
 * File path: .grcode/commands/grsx-<id>.md
 * Frontmatter: name, id, category, description, tags
 */
export const grcodeAdapter: ToolCommandAdapter = {
  toolId: 'grcode',

  getFilePath(commandId: string): string {
    return path.join('.grcode', 'commands', `grsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: /grsx-${content.id}
id: grsx-${content.id}
category: ${escapeYamlValue(content.category)}
description: ${escapeYamlValue(content.description)}
tags: ${formatTagsArray(content.tags)}
---

${content.body}
`;
  },
};
