import { describe, it, expect } from 'vitest';
import { generateClaudeMd, generateGeminiMd } from '../../../src/core/agents-md/pointer-files.js';

describe('agents-md/pointer-files', () => {
  describe('generateClaudeMd', () => {
    it('includes project name as heading', () => {
      const content = generateClaudeMd('my-project');
      expect(content).toContain('# my-project');
    });

    it('references AGENTS.md with @ import syntax', () => {
      const content = generateClaudeMd('test');
      expect(content).toContain('@AGENTS.md');
    });

    it('includes Claude-specific section', () => {
      const content = generateClaudeMd('test');
      expect(content).toContain('## Claude-specific');
      expect(content).toContain('/compact');
      expect(content).toContain('TodoWrite');
    });

    it('stays under 20 lines', () => {
      const content = generateClaudeMd('test');
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThanOrEqual(20);
    });
  });

  describe('generateGeminiMd', () => {
    it('includes project name as heading', () => {
      const content = generateGeminiMd('my-project');
      expect(content).toContain('# my-project');
    });

    it('references AGENTS.md', () => {
      const content = generateGeminiMd('test');
      expect(content).toContain('AGENTS.md');
    });

    it('includes Gemini-specific section', () => {
      const content = generateGeminiMd('test');
      expect(content).toContain('## Gemini-specific');
      expect(content).toContain('activate_skill');
    });

    it('stays under 20 lines', () => {
      const content = generateGeminiMd('test');
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThanOrEqual(20);
    });
  });
});
