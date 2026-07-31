/**
 * Windsurf Command Adapter
 *
 * Formats commands for Windsurf following its frontmatter specification.
 * Windsurf uses a similar format to Claude but may have different conventions.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue, formatTagsArray } from './yaml-utils.js';

/**
 * Windsurf adapter for command generation.
 * File path: .windsurf/workflows/grsx-<id>.md
 * Frontmatter: name, description, category, tags
 */
export const windsurfAdapter: ToolCommandAdapter = {
  toolId: 'windsurf',

  getFilePath(commandId: string): string {
    return path.join('.windsurf', 'workflows', `grsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
category: ${escapeYamlValue(content.category)}
tags: ${formatTagsArray(content.tags)}
---

${content.body}
`;
  },
};
