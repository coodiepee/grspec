/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */

/**
 * Transforms colon-based command references to hyphen-based format.
 * Converts `/grsx:` patterns to `/grsx-` for tools that use hyphen syntax.
 *
 * @param text - The text containing command references
 * @returns Text with command references transformed to hyphen format
 *
 * @example
 * transformToHyphenCommands('/grsx:new') // returns '/grsx-new'
 * transformToHyphenCommands('Use /grsx:apply to implement') // returns 'Use /grsx-apply to implement'
 */
export function transformToHyphenCommands(text: string): string {
  return text.replace(/\/grsx:/g, '/grsx-');
}
