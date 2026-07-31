import { getToolsWithSkillsDir } from './tool-detection.js';

/**
 * Parses `grspec init --tools` / `grspec update --tools` values.
 * Reserved: `all` (every tool with skillsDir), `none` (empty list).
 */
export function parseToolsArg(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error(
      'The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs.'
    );
  }

  const availableTools = getToolsWithSkillsDir();
  const availableSet = new Set(availableTools);
  const lowerRaw = trimmed.toLowerCase();

  if (lowerRaw === 'all') {
    return availableTools;
  }

  if (lowerRaw === 'none') {
    return [];
  }

  const tokens = trimmed
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new Error(
      'The --tools option requires at least one tool ID when not using "all" or "none".'
    );
  }

  const normalizedTokens = tokens.map((token) => token.toLowerCase());

  if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
    throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
  }

  const invalidTokens = tokens.filter(
    (_token, index) => !availableSet.has(normalizedTokens[index])
  );

  if (invalidTokens.length > 0) {
    throw new Error(
      `Invalid tool(s): ${invalidTokens.join(', ')}. Available values: all, none, ${availableTools.join(', ')}`
    );
  }

  return normalizedTokens.filter((token, index) => normalizedTokens.indexOf(token) === index);
}
