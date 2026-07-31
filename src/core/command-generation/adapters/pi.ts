/**
 * Pi Command Adapter
 *
 * Formats commands for Pi (pi.dev) following its prompt template specification.
 * Pi prompt templates live in .pi/prompts/*.md with description frontmatter.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { transformToHyphenCommands } from '../../../utils/command-references.js';
import { escapeYamlValue } from './yaml-utils.js';

const PI_INPUT_HEADING = /^\*\*Input\*\*:[^\n]*$/m;

function injectPiArgs(body: string): string {
  if (body.includes('$@') || body.includes('$ARGUMENTS')) {
    return body;
  }

  return body.replace(
    PI_INPUT_HEADING,
    (heading) => `${heading}\n**Provided arguments**: $@`
  );
}

/**
 * Pi adapter for prompt template generation.
 * File path: .pi/prompts/grsx-<id>.md
 * Frontmatter: description
 *
 * Pi uses the filename (minus .md) as the slash command name, so
 * grsx-propose.md → /grsx-propose. Command references in the body
 * are transformed from /grsx: to /grsx- for consistency.
 */
export const piAdapter: ToolCommandAdapter = {
  toolId: 'pi',

  getFilePath(commandId: string): string {
    return path.join('.pi', 'prompts', `grsx-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    // Transform /grsx: references to /grsx- and inject $@ for template args
    const transformedBody = transformToHyphenCommands(content.body);

    return `---
description: ${escapeYamlValue(content.description)}
---

${injectPiArgs(transformedBody)}
`;
  },
};
