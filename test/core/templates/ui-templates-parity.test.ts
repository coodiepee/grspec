import { describe, expect, it } from 'vitest';

import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { loadWorkflowTemplate } from '../../../src/core/templates/loader.js';
import {
  getGrsxUiDesignSystemCommandTemplate,
  getGrsxUiDetectCommandTemplate,
  getGrsxUiInitCommandTemplate,
  getGrsxUiInstallCommandTemplate,
  getGrsxUiReferenceCommandTemplate,
  getGrsxUiReviewCommandTemplate,
  getGrsxUiRulesCommandTemplate,
  getGrsxUiSearchCommandTemplate,
  getGrsxUiStatusCommandTemplate,
  getGrsxUiSyncCommandTemplate,
  getUiDesignSystemSkillTemplate,
  getUiDetectSkillTemplate,
  getUiInitSkillTemplate,
  getUiInstallSkillTemplate,
  getUiReferenceSkillTemplate,
  getUiReviewSkillTemplate,
  getUiRulesSkillTemplate,
  getUiSearchSkillTemplate,
  getUiStatusSkillTemplate,
  getUiSyncSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

describe('UI subcommand template parity', () => {
  const subcommandPairs: Array<{
    label: string;
    contentTemplateName: string;
    skillFactory: () => ReturnType<typeof getUiSearchSkillTemplate>;
    commandFactory: () => ReturnType<typeof getGrsxUiSearchCommandTemplate>;
    phrase: string;
  }> = [
    {
      label: 'init',
      contentTemplateName: 'ui-init',
      skillFactory: getUiInitSkillTemplate,
      commandFactory: getGrsxUiInitCommandTemplate,
      phrase: 'grspec ui init',
    },
    {
      label: 'search',
      contentTemplateName: 'ui-search',
      skillFactory: getUiSearchSkillTemplate,
      commandFactory: getGrsxUiSearchCommandTemplate,
      phrase: 'grspec ui search',
    },
    {
      label: 'design-system',
      contentTemplateName: 'ui-design-system',
      skillFactory: getUiDesignSystemSkillTemplate,
      commandFactory: getGrsxUiDesignSystemCommandTemplate,
      phrase: 'grspec ui design-system',
    },
    {
      label: 'rules',
      contentTemplateName: 'ui-rules',
      skillFactory: getUiRulesSkillTemplate,
      commandFactory: getGrsxUiRulesCommandTemplate,
      phrase: 'grspec ui rules',
    },
    {
      label: 'reference',
      contentTemplateName: 'ui-reference',
      skillFactory: getUiReferenceSkillTemplate,
      commandFactory: getGrsxUiReferenceCommandTemplate,
      phrase: 'grspec ui reference',
    },
    {
      label: 'review',
      contentTemplateName: 'ui-review',
      skillFactory: getUiReviewSkillTemplate,
      commandFactory: getGrsxUiReviewCommandTemplate,
      phrase: 'grspec ui review',
    },
    {
      label: 'status',
      contentTemplateName: 'ui-status',
      skillFactory: getUiStatusSkillTemplate,
      commandFactory: getGrsxUiStatusCommandTemplate,
      phrase: 'grspec ui status',
    },
    {
      label: 'detect',
      contentTemplateName: 'ui-detect',
      skillFactory: getUiDetectSkillTemplate,
      commandFactory: getGrsxUiDetectCommandTemplate,
      phrase: 'grspec ui detect',
    },
    {
      label: 'install',
      contentTemplateName: 'ui-install',
      skillFactory: getUiInstallSkillTemplate,
      commandFactory: getGrsxUiInstallCommandTemplate,
      phrase: 'grspec ui install',
    },
    {
      label: 'sync',
      contentTemplateName: 'ui-sync',
      skillFactory: getUiSyncSkillTemplate,
      commandFactory: getGrsxUiSyncCommandTemplate,
      phrase: 'grspec ui sync',
    },
  ];

  for (const pair of subcommandPairs) {
    it(`aligns ${pair.label} skill instructions with slash command body`, () => {
      const contentTemplate = loadWorkflowTemplate(pair.contentTemplateName);
      const skillInstructions = pair.skillFactory().instructions;
      const commandContent = pair.commandFactory().content;

      expect(skillInstructions).toBe(contentTemplate);
      expect(commandContent).toBe(contentTemplate);
      expect(contentTemplate).toContain(pair.phrase);
    });

    it(`generates ${pair.label} skill file from same content template`, () => {
      const contentTemplate = loadWorkflowTemplate(pair.contentTemplateName);
      const generated = generateSkillContent(pair.skillFactory(), 'PARITY-BASELINE');
      expect(generated).toContain(contentTemplate);
    });
  }
});
