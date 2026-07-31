import { describe, expect, it } from 'vitest';

import { loadWorkflowTemplate } from '../../../src/core/templates/loader.js';
import {
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFfChangeSkillTemplate,
  getGrsxApplyCommandTemplate,
  getGrsxArchiveCommandTemplate,
  getGrsxBulkArchiveCommandTemplate,
  getGrsxContinueCommandTemplate,
  getGrsxExploreCommandTemplate,
  getGrsxFfCommandTemplate,
  getGrsxNewCommandTemplate,
  getGrsxOnboardCommandTemplate,
  getGrsxProposeCommandTemplate,
  getGrsxProposeSkillTemplate,
  getGrsxSyncCommandTemplate,
  getGrsxVerifyCommandTemplate,
  getGrsxValidateCommandTemplate,
  getGrsxWikiCommandTemplate,
  getGrsxWikiIngestCommandTemplate,
  getGrsxWikiInitCommandTemplate,
  getGrsxWikiLintCommandTemplate,
  getGrsxWikiQueryCommandTemplate,
  getGrsxWikiStatusCommandTemplate,
  getGrsxWikiSyncCommandTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getSyncSpecsSkillTemplate,
  getVerifySkillTemplate,
  getValidateSkillTemplate,
  getWikiSkillTemplate,
  type CommandTemplate,
  type SkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

describe('workflow template single-source parity', () => {
  const skillCommandPairs: Array<{
    label: string;
    contentTemplateName: string;
    skillFactory: () => SkillTemplate;
    commandFactory: () => CommandTemplate;
  }> = [
    {
      label: 'apply',
      contentTemplateName: 'apply-change',
      skillFactory: getApplyChangeSkillTemplate,
      commandFactory: getGrsxApplyCommandTemplate,
    },
    {
      label: 'archive',
      contentTemplateName: 'archive-change',
      skillFactory: getArchiveChangeSkillTemplate,
      commandFactory: getGrsxArchiveCommandTemplate,
    },
    {
      label: 'bulk-archive',
      contentTemplateName: 'bulk-archive-change',
      skillFactory: getBulkArchiveChangeSkillTemplate,
      commandFactory: getGrsxBulkArchiveCommandTemplate,
    },
    {
      label: 'continue',
      contentTemplateName: 'continue-change',
      skillFactory: getContinueChangeSkillTemplate,
      commandFactory: getGrsxContinueCommandTemplate,
    },
    {
      label: 'explore',
      contentTemplateName: 'explore',
      skillFactory: getExploreSkillTemplate,
      commandFactory: getGrsxExploreCommandTemplate,
    },
    {
      label: 'ff',
      contentTemplateName: 'ff-change',
      skillFactory: getFfChangeSkillTemplate,
      commandFactory: getGrsxFfCommandTemplate,
    },
    {
      label: 'new',
      contentTemplateName: 'new-change',
      skillFactory: getNewChangeSkillTemplate,
      commandFactory: getGrsxNewCommandTemplate,
    },
    {
      label: 'propose',
      contentTemplateName: 'propose',
      skillFactory: getGrsxProposeSkillTemplate,
      commandFactory: getGrsxProposeCommandTemplate,
    },
    {
      label: 'sync',
      contentTemplateName: 'sync-specs',
      skillFactory: getSyncSpecsSkillTemplate,
      commandFactory: getGrsxSyncCommandTemplate,
    },
    {
      label: 'verify',
      contentTemplateName: 'verify',
      skillFactory: getVerifySkillTemplate,
      commandFactory: getGrsxVerifyCommandTemplate,
    },
    {
      label: 'validate',
      contentTemplateName: 'validate',
      skillFactory: getValidateSkillTemplate,
      commandFactory: getGrsxValidateCommandTemplate,
    },
    {
      label: 'onboard',
      contentTemplateName: 'onboard',
      skillFactory: getOnboardSkillTemplate,
      commandFactory: getGrsxOnboardCommandTemplate,
    },
    {
      label: 'wiki-hub',
      contentTemplateName: 'wiki',
      skillFactory: getWikiSkillTemplate,
      commandFactory: getGrsxWikiCommandTemplate,
    },
  ];

  for (const pair of skillCommandPairs) {
    it(`aligns ${pair.label} skill instructions with slash command body`, () => {
      const contentTemplate = loadWorkflowTemplate(pair.contentTemplateName);
      const skillInstructions = pair.skillFactory().instructions;
      const commandContent = pair.commandFactory().content;

      expect(skillInstructions).toBe(contentTemplate);
      expect(commandContent).toBe(contentTemplate);
    });
  }

  const wikiCommandOnly: Array<{
    label: string;
    contentTemplateName: string;
    commandFactory: () => CommandTemplate;
  }> = [
    {
      label: 'wiki-init',
      contentTemplateName: 'wiki-init',
      commandFactory: getGrsxWikiInitCommandTemplate,
    },
    {
      label: 'wiki-ingest',
      contentTemplateName: 'wiki-ingest',
      commandFactory: getGrsxWikiIngestCommandTemplate,
    },
    {
      label: 'wiki-lint',
      contentTemplateName: 'wiki-lint',
      commandFactory: getGrsxWikiLintCommandTemplate,
    },
    {
      label: 'wiki-query',
      contentTemplateName: 'wiki-query',
      commandFactory: getGrsxWikiQueryCommandTemplate,
    },
    {
      label: 'wiki-sync',
      contentTemplateName: 'wiki-sync',
      commandFactory: getGrsxWikiSyncCommandTemplate,
    },
    {
      label: 'wiki-status',
      contentTemplateName: 'wiki-status',
      commandFactory: getGrsxWikiStatusCommandTemplate,
    },
  ];

  for (const entry of wikiCommandOnly) {
    it(`loads ${entry.label} command body from content Markdown`, () => {
      const contentTemplate = loadWorkflowTemplate(entry.contentTemplateName);
      expect(entry.commandFactory().content).toBe(contentTemplate);
    });
  }
});
