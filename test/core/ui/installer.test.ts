import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadPlatformTemplate,
  listPlatforms,
  getSkillOutputPath,
  resolveInstallSkillBundle,
  resolveSkillParentPath,
  DEFAULT_UI_INSTALL_SKILLS,
  type PlatformTemplate,
} from '../../../src/core/ui/installer.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { getUiInitSkillTemplate } from '../../../src/core/templates/skill-templates.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, '../../../assets/ui/templates');

describe('installer', () => {
  describe('listPlatforms', () => {
    it('lists all available platforms', () => {
      const platforms = listPlatforms(TEMPLATES_DIR);
      expect(platforms.length).toBeGreaterThanOrEqual(18);
      expect(platforms).toContain('cursor');
      expect(platforms).toContain('grcode');
      expect(platforms).toContain('windsurf');
      expect(platforms).toContain('claude');
      expect(platforms).toContain('copilot');
    });
  });

  describe('loadPlatformTemplate', () => {
    it('loads grcode template with skills array', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'grcode');
      expect(tpl).not.toBeNull();
      expect(tpl!.platform).toBe('grcode');
      expect(tpl!.folderStructure.root).toBe('.grcode');
      expect(tpl!.skills).toHaveLength(10);
    });

    it('loads cursor template with skills array', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'cursor');
      expect(tpl).not.toBeNull();
      expect(tpl!.platform).toBe('cursor');
      expect(tpl!.displayName).toBe('Cursor');
      expect(tpl!.folderStructure.root).toBe('.cursor');
      expect(tpl!.skills).toContain('grspec-ui-init');
      expect(tpl!.skills).toHaveLength(10);
    });

    it('returns null for unknown platform', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'nonexistent');
      expect(tpl).toBeNull();
    });

    it('loads copilot template with correct folder structure', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'copilot');
      expect(tpl).not.toBeNull();
      expect(tpl!.folderStructure.filename).toBe('PROMPT.md');
      expect(tpl!.folderStructure.skillParentPath).toBe('prompts');
    });
  });

  describe('resolveSkillParentPath', () => {
    it('prefers skillParentPath when set', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'cursor') as PlatformTemplate;
      expect(resolveSkillParentPath(tpl)).toBe('skills');
    });

    it('derives parent from skillPath when skillParentPath is absent', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'cursor') as PlatformTemplate;
      const withoutParent = {
        ...tpl,
        folderStructure: { ...tpl.folderStructure, skillParentPath: undefined },
      };
      expect(resolveSkillParentPath(withoutParent)).toBe('skills');
    });

    it('defaults to skills when neither path field is set', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'cursor') as PlatformTemplate;
      const minimal = {
        ...tpl,
        folderStructure: { root: '.cursor', filename: 'SKILL.md' },
      };
      expect(resolveSkillParentPath(minimal)).toBe('skills');
    });
  });

  describe('resolveInstallSkillBundle', () => {
    it('returns default three-skill bundle', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'cursor') as PlatformTemplate;
      expect(resolveInstallSkillBundle(tpl, false)).toEqual([...DEFAULT_UI_INSTALL_SKILLS]);
    });

    it('returns all skills with installAll flag', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'cursor') as PlatformTemplate;
      expect(resolveInstallSkillBundle(tpl, true)).toHaveLength(10);
    });
  });

  describe('sub-skill content', () => {
    it('generates init skill markdown from template', () => {
      const content = generateSkillContent(getUiInitSkillTemplate(), 'TEST');
      expect(content).toContain('grspec-ui-init');
      expect(content).toContain('grspec ui init');
    });
  });

  describe('getSkillOutputPath', () => {
    it('builds correct output path for cursor sub-skill', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'cursor')!;
      const path = getSkillOutputPath(tpl, '/project', 'grspec-ui-init');
      expect(path).toBe('/project/.cursor/skills/grspec-ui-init/SKILL.md');
    });

    it('builds correct output path for copilot sub-skill', () => {
      const tpl = loadPlatformTemplate(TEMPLATES_DIR, 'copilot')!;
      const path = getSkillOutputPath(tpl, '/project', 'grspec-ui-review');
      expect(path).toBe('/project/.github/prompts/grspec-ui-review/PROMPT.md');
    });
  });
});
