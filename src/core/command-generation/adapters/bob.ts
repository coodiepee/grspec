/**
 * Bob Shell Command Adapter
 *
 * Formats commands for Bob Shell following its markdown specification.
 * Commands are stored in .bob/commands/ directory.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { transformToHyphenCommands } from '../../../utils/command-references.js';
import { escapeYamlValue } from './yaml-utils.js';

/**
 * Bob Shell adapter for command generation.
 * File path: .bob/commands/grsx-<id>.md
 * Frontmatter: description, argument-hint
 */
export const bobAdapter: ToolCommandAdapter = {
  toolId: 'bob',

  getFilePath(commandId: string): string {
    return path.join('.bob', 'commands', `grsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    // Transform command references from colon to hyphen format for Bob
    const transformedBody = transformToHyphenCommands(content.body);

    return `---
description: ${escapeYamlValue(content.description)}
argument-hint: command arguments
---

${transformedBody}
`;
  },
};
