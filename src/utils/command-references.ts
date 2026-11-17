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

/**
 * Slash command id → generated skill name.
 *
 * Tools that surface skills as slash commands (DeepSeek Harness) invoke them by
 * skill name, so workflow cross-references must point at `/grspec-*` rather
 * than the `/grsx:*` command syntax those tools never install.
 */
const COMMAND_ID_TO_SKILL_NAME: Record<string, string> = {
  explore: 'grspec-explore',
  new: 'grspec-new-change',
  continue: 'grspec-continue-change',
  apply: 'grspec-apply-change',
  ff: 'grspec-ff-change',
  sync: 'grspec-sync-specs',
  archive: 'grspec-archive-change',
  'bulk-archive': 'grspec-bulk-archive-change',
  verify: 'grspec-verify',
  validate: 'grspec-validate',
  onboard: 'grspec-onboard',
  propose: 'grspec-propose',
  wiki: 'grspec-wiki',
  'wiki-init': 'grspec-wiki-init',
  'wiki-ingest': 'grspec-wiki-ingest',
  'wiki-lint': 'grspec-wiki-lint',
  'wiki-query': 'grspec-wiki-query',
  'wiki-sync': 'grspec-wiki-sync',
  'wiki-status': 'grspec-wiki-status',
  'ui-init': 'grspec-ui-init',
  'ui-search': 'grspec-ui-search',
  'ui-design-system': 'grspec-ui-design-system',
  'ui-rules': 'grspec-ui-rules',
  'ui-reference': 'grspec-ui-reference',
  'ui-review': 'grspec-ui-review',
  'ui-status': 'grspec-ui-status',
  'ui-detect': 'grspec-ui-detect',
  'ui-install': 'grspec-ui-install',
  'ui-sync': 'grspec-ui-sync',
};

/**
 * Transforms colon-based command references into skill-name invocations.
 * Converts `/grsx:<id>` to the generated skill's slash command, e.g.
 * `/grsx:apply` → `/grspec-apply-change`.
 *
 * Unknown ids are left untouched so a partially generated tool never emits a
 * reference to a skill that does not exist.
 */
export function transformToGrspecSkillCommands(text: string): string {
  return text.replace(/\/grsx:([a-z0-9-]+)/g, (reference, commandId: string) => {
    const skillName = COMMAND_ID_TO_SKILL_NAME[commandId];
    return skillName ? `/${skillName}` : reference;
  });
}

/**
 * Selects the skill instruction transform for a tool.
 * Tools whose slash commands differ from `/grsx:*` rewrite cross-references
 * when skills are generated; tools with native `grsx` commands need none.
 */
export function resolveSkillInstructionTransformer(
  toolId: string
): ((text: string) => string) | undefined {
  if (toolId === 'deepseek') return transformToGrspecSkillCommands;
  if (toolId === 'opencode' || toolId === 'pi') return transformToHyphenCommands;
  return undefined;
}
