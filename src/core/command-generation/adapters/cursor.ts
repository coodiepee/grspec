/**
 * Cursor Command Adapter
 *
 * Formats commands for Cursor following its frontmatter specification.
 * Cursor uses a different frontmatter format and file naming convention.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from './yaml-utils.js';

/**
 * Cursor adapter for command generation.
 * File path: .cursor/commands/grsx-<id>.md
 * Frontmatter: name (as /grsx-<id>), id, category, description
 */
export const cursorAdapter: ToolCommandAdapter = {
  toolId: 'cursor',

  getFilePath(commandId: string): string {
    return path.join('.cursor', 'commands', `grsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: /grsx-${content.id}
id: grsx-${content.id}
category: ${escapeYamlValue(content.category)}
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
