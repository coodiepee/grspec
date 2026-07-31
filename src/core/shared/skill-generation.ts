/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill and command files.
 */

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifySkillTemplate,
  getOnboardSkillTemplate,
  getGrsxProposeSkillTemplate,
  getTddSkillTemplate,
  getValidateSkillTemplate,
  getDebugSkillTemplate,
  getReviewSkillTemplate,
  getParallelDispatchSkillTemplate,
  getSubagentSkillTemplate,
  getWikiSkillTemplate,
  getUiInitSkillTemplate,
  getUiSearchSkillTemplate,
  getUiDesignSystemSkillTemplate,
  getUiRulesSkillTemplate,
  getUiReferenceSkillTemplate,
  getUiReviewSkillTemplate,
  getUiStatusSkillTemplate,
  getUiDetectSkillTemplate,
  getUiInstallSkillTemplate,
  getUiSyncSkillTemplate,
  getGrsxUiInitCommandTemplate,
  getGrsxUiSearchCommandTemplate,
  getGrsxUiDesignSystemCommandTemplate,
  getGrsxUiRulesCommandTemplate,
  getGrsxUiReferenceCommandTemplate,
  getGrsxUiReviewCommandTemplate,
  getGrsxUiStatusCommandTemplate,
  getGrsxUiDetectCommandTemplate,
  getGrsxUiInstallCommandTemplate,
  getGrsxUiSyncCommandTemplate,
  getGrsxExploreCommandTemplate,
  getGrsxNewCommandTemplate,
  getGrsxContinueCommandTemplate,
  getGrsxApplyCommandTemplate,
  getGrsxFfCommandTemplate,
  getGrsxSyncCommandTemplate,
  getGrsxArchiveCommandTemplate,
  getGrsxBulkArchiveCommandTemplate,
  getGrsxVerifyCommandTemplate,
  getGrsxValidateCommandTemplate,
  getGrsxOnboardCommandTemplate,
  getGrsxProposeCommandTemplate,
  getGrsxWikiCommandTemplate,
  getGrsxWikiInitCommandTemplate,
  getGrsxWikiIngestCommandTemplate,
  getGrsxWikiLintCommandTemplate,
  getGrsxWikiQueryCommandTemplate,
  getGrsxWikiSyncCommandTemplate,
  getGrsxWikiStatusCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';

/**
 * Skill template with directory name and workflow ID mapping.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: string;
}

/**
 * Command template with ID mapping.
 * `workflowId` controls profile-based filtering; defaults to `id` when omitted.
 */
export interface CommandTemplateEntry {
  template: ReturnType<typeof getGrsxExploreCommandTemplate>;
  id: string;
  workflowId?: string;
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose workflowId is in this array
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const all: SkillTemplateEntry[] = [
    { template: getExploreSkillTemplate(), dirName: 'grspec-explore', workflowId: 'explore' },
    { template: getNewChangeSkillTemplate(), dirName: 'grspec-new-change', workflowId: 'new' },
    { template: getContinueChangeSkillTemplate(), dirName: 'grspec-continue-change', workflowId: 'continue' },
    { template: getApplyChangeSkillTemplate(), dirName: 'grspec-apply-change', workflowId: 'apply' },
    { template: getFfChangeSkillTemplate(), dirName: 'grspec-ff-change', workflowId: 'ff' },
    { template: getSyncSpecsSkillTemplate(), dirName: 'grspec-sync-specs', workflowId: 'sync' },
    { template: getArchiveChangeSkillTemplate(), dirName: 'grspec-archive-change', workflowId: 'archive' },
    { template: getBulkArchiveChangeSkillTemplate(), dirName: 'grspec-bulk-archive-change', workflowId: 'bulk-archive' },
    { template: getVerifySkillTemplate(), dirName: 'grspec-verify', workflowId: 'verify' },
    { template: getValidateSkillTemplate(), dirName: 'grspec-validate', workflowId: 'validate' },
    { template: getOnboardSkillTemplate(), dirName: 'grspec-onboard', workflowId: 'onboard' },
    { template: getGrsxProposeSkillTemplate(), dirName: 'grspec-propose', workflowId: 'propose' },
    { template: getTddSkillTemplate(), dirName: 'grspec-tdd', workflowId: 'tdd' },
    { template: getDebugSkillTemplate(), dirName: 'grspec-debug', workflowId: 'debug' },
    { template: getReviewSkillTemplate(), dirName: 'grspec-review', workflowId: 'review' },
    { template: getParallelDispatchSkillTemplate(), dirName: 'grspec-parallel', workflowId: 'parallel' },
    { template: getSubagentSkillTemplate(), dirName: 'grspec-subagent', workflowId: 'subagent' },
    { template: getWikiSkillTemplate(), dirName: 'grspec-wiki', workflowId: 'wiki' },
    { template: getUiInitSkillTemplate(), dirName: 'grspec-ui-init', workflowId: 'ui' },
    { template: getUiSearchSkillTemplate(), dirName: 'grspec-ui-search', workflowId: 'ui' },
    { template: getUiDesignSystemSkillTemplate(), dirName: 'grspec-ui-design-system', workflowId: 'ui' },
    { template: getUiRulesSkillTemplate(), dirName: 'grspec-ui-rules', workflowId: 'ui' },
    { template: getUiReferenceSkillTemplate(), dirName: 'grspec-ui-reference', workflowId: 'ui' },
    { template: getUiReviewSkillTemplate(), dirName: 'grspec-ui-review', workflowId: 'ui' },
    { template: getUiStatusSkillTemplate(), dirName: 'grspec-ui-status', workflowId: 'ui' },
    { template: getUiDetectSkillTemplate(), dirName: 'grspec-ui-detect', workflowId: 'ui' },
    { template: getUiInstallSkillTemplate(), dirName: 'grspec-ui-install', workflowId: 'ui' },
    { template: getUiSyncSkillTemplate(), dirName: 'grspec-ui-sync', workflowId: 'ui' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.workflowId));
}

/**
 * Gets command templates with their IDs, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose id is in this array
 */
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  const all: CommandTemplateEntry[] = [
    { template: getGrsxExploreCommandTemplate(), id: 'explore' },
    { template: getGrsxNewCommandTemplate(), id: 'new' },
    { template: getGrsxContinueCommandTemplate(), id: 'continue' },
    { template: getGrsxApplyCommandTemplate(), id: 'apply' },
    { template: getGrsxFfCommandTemplate(), id: 'ff' },
    { template: getGrsxSyncCommandTemplate(), id: 'sync' },
    { template: getGrsxArchiveCommandTemplate(), id: 'archive' },
    { template: getGrsxBulkArchiveCommandTemplate(), id: 'bulk-archive' },
    { template: getGrsxVerifyCommandTemplate(), id: 'verify' },
    { template: getGrsxValidateCommandTemplate(), id: 'validate' },
    { template: getGrsxOnboardCommandTemplate(), id: 'onboard' },
    { template: getGrsxProposeCommandTemplate(), id: 'propose' },
    { template: getGrsxWikiCommandTemplate(), id: 'wiki', workflowId: 'wiki' },
    { template: getGrsxWikiInitCommandTemplate(), id: 'wiki-init', workflowId: 'wiki' },
    { template: getGrsxWikiIngestCommandTemplate(), id: 'wiki-ingest', workflowId: 'wiki' },
    { template: getGrsxWikiLintCommandTemplate(), id: 'wiki-lint', workflowId: 'wiki' },
    { template: getGrsxWikiQueryCommandTemplate(), id: 'wiki-query', workflowId: 'wiki' },
    { template: getGrsxWikiSyncCommandTemplate(), id: 'wiki-sync', workflowId: 'wiki' },
    { template: getGrsxWikiStatusCommandTemplate(), id: 'wiki-status', workflowId: 'wiki' },
    { template: getGrsxUiInitCommandTemplate(), id: 'ui-init', workflowId: 'ui' },
    { template: getGrsxUiSearchCommandTemplate(), id: 'ui-search', workflowId: 'ui' },
    { template: getGrsxUiDesignSystemCommandTemplate(), id: 'ui-design-system', workflowId: 'ui' },
    { template: getGrsxUiRulesCommandTemplate(), id: 'ui-rules', workflowId: 'ui' },
    { template: getGrsxUiReferenceCommandTemplate(), id: 'ui-reference', workflowId: 'ui' },
    { template: getGrsxUiReviewCommandTemplate(), id: 'ui-review', workflowId: 'ui' },
    { template: getGrsxUiStatusCommandTemplate(), id: 'ui-status', workflowId: 'ui' },
    { template: getGrsxUiDetectCommandTemplate(), id: 'ui-detect', workflowId: 'ui' },
    { template: getGrsxUiInstallCommandTemplate(), id: 'ui-install', workflowId: 'ui' },
    { template: getGrsxUiSyncCommandTemplate(), id: 'ui-sync', workflowId: 'ui' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.workflowId ?? entry.id));
}

/**
 * Converts command templates to CommandContent array, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return contents whose id is in this array
 */
export function getCommandContents(workflowFilter?: readonly string[]): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter);
  return commandTemplates.map(({ template, id }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}

/**
 * Generates skill file content with YAML frontmatter.
 *
 * @param template - The skill template
 * @param generatedByVersion - The grspec version to embed in the file
 * @param transformInstructions - Optional callback to transform the instructions content
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;

  return `---
name: ${template.name}
description: ${template.description}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'Requires grspec CLI.'}
metadata:
  author: ${template.metadata?.author || 'grspec'}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${generatedByVersion}"
---

${instructions}
`;
}
