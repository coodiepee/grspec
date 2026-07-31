import { describe, it, expect } from 'vitest';
import { formatAsciiBox, formatMarkdown } from '../../../src/core/ui/formatters.js';
import { generateDesignSystem } from '../../../src/core/ui/design-system.js';

describe('formatters', () => {
  const ds = generateDesignSystem('SaaS dashboard', 'TestProject');

  describe('formatAsciiBox', () => {
    it('returns a non-empty string', () => {
      const result = formatAsciiBox(ds);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('contains project name', () => {
      const result = formatAsciiBox(ds);
      expect(result).toContain('TestProject');
    });

    it('contains section headers', () => {
      const result = formatAsciiBox(ds);
      expect(result).toContain('PATTERN');
      expect(result).toContain('STYLE');
      expect(result).toContain('COLORS');
      expect(result).toContain('TYPOGRAPHY');
    });

    it('contains box drawing characters', () => {
      const result = formatAsciiBox(ds);
      expect(result).toContain('╔');
      expect(result).toContain('╗');
      expect(result).toContain('╚');
      expect(result).toContain('╝');
      expect(result).toContain('┌');
      expect(result).toContain('┘');
    });

    it('contains pre-delivery checklist', () => {
      const result = formatAsciiBox(ds);
      expect(result).toContain('PRE-DELIVERY CHECKLIST');
      expect(result).toContain('No emojis as icons');
    });
  });

  describe('formatMarkdown', () => {
    it('returns valid markdown', () => {
      const result = formatMarkdown(ds);
      expect(result).toBeTruthy();
      expect(result).toContain('## Design System: TestProject');
    });

    it('contains all sections', () => {
      const result = formatMarkdown(ds);
      expect(result).toContain('### Pattern');
      expect(result).toContain('### Style');
      expect(result).toContain('### Colors');
      expect(result).toContain('### Typography');
    });

    it('contains color table', () => {
      const result = formatMarkdown(ds);
      expect(result).toContain('| Role | Hex | CSS Variable |');
      expect(result).toContain('--color-primary');
    });

    it('contains pre-delivery checklist', () => {
      const result = formatMarkdown(ds);
      expect(result).toContain('### Pre-Delivery Checklist');
      expect(result).toContain('[ ] No emojis as icons');
    });
  });
});
