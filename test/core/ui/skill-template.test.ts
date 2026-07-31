import { describe, it, expect } from 'vitest';
import { getSkillTemplates, getCommandTemplates } from '../../../src/core/shared/skill-generation.js';

const UI_SUBCOMMAND_SKILL_DIRS = [
  'grspec-ui-init',
  'grspec-ui-search',
  'grspec-ui-design-system',
  'grspec-ui-rules',
  'grspec-ui-reference',
  'grspec-ui-review',
  'grspec-ui-status',
  'grspec-ui-detect',
  'grspec-ui-install',
  'grspec-ui-sync',
] as const;

const UI_SUBCOMMAND_COMMAND_IDS = [
  'ui-init',
  'ui-search',
  'ui-design-system',
  'ui-rules',
  'ui-reference',
  'ui-review',
  'ui-status',
  'ui-detect',
  'ui-install',
  'ui-sync',
] as const;

describe('UI skill template', () => {
  describe('integration with skill-generation', () => {
    it('registers all UI subcommand skills without hub', () => {
      const templates = getSkillTemplates(['ui']);
      expect(templates).toHaveLength(10);
      expect(templates.map((entry) => entry.dirName).sort()).toEqual(
        [...UI_SUBCOMMAND_SKILL_DIRS].sort()
      );
      expect(templates.map((entry) => entry.dirName)).not.toContain('grspec-ui');
    });

    it('registers all UI subcommand commands without hub', () => {
      const filtered = getCommandTemplates(['ui']);
      expect(filtered).toHaveLength(10);
      expect(filtered.map((entry) => entry.id).sort()).toEqual(
        [...UI_SUBCOMMAND_COMMAND_IDS].sort()
      );
      expect(filtered.map((entry) => entry.id)).not.toContain('ui');
    });
  });
});
