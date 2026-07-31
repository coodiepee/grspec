import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { detectUiContent, detectUiContentInChange } from '../../../src/core/ui/detect.js';

describe('UI content detection', () => {
  describe('detectUiContent', () => {
    it('should detect when ≥3 UI keywords are present', () => {
      const result = detectUiContent('Build a color palette for the dashboard');
      expect(result.detected).toBe(true);
      expect(result.keywords).toContain('color');
      expect(result.keywords).toContain('palette');
      expect(result.keywords).toContain('dashboard');
    });

    it('should return false for non-UI text', () => {
      const result = detectUiContent('refactor the database migration scripts');
      expect(result.detected).toBe(false);
      expect(result.keywords).toHaveLength(0);
    });

    it('should return false with fewer than 3 keywords', () => {
      const result = detectUiContent('this component uses a new style');
      expect(result.detected).toBe(false);
      expect(result.keywords).toContain('component');
      expect(result.keywords).toContain('style');
      expect(result.keywords.length).toBeLessThan(3);
    });

    it('should be case-insensitive', () => {
      const result = detectUiContent('Dark Mode responsive layout with custom Typography');
      expect(result.detected).toBe(true);
      expect(result.keywords).toContain('dark mode');
      expect(result.keywords).toContain('responsive');
      expect(result.keywords).toContain('layout');
      expect(result.keywords).toContain('typography');
    });

    it('should not trigger on generic terms', () => {
      const result = detectUiContent('add a new page with a form input and navigation');
      expect(result.detected).toBe(false);
    });

    it('should detect 4+ keywords', () => {
      const result = detectUiContent('responsive layout with typography and animation');
      expect(result.detected).toBe(true);
      expect(result.keywords).toContain('responsive');
      expect(result.keywords).toContain('layout');
      expect(result.keywords).toContain('typography');
      expect(result.keywords).toContain('animation');
    });

    it('should return keywords even when not detected (below threshold)', () => {
      const result = detectUiContent('ensure wcag compliance for accessibility');
      expect(result.detected).toBe(false);
      expect(result.keywords).toContain('wcag');
      expect(result.keywords).toContain('accessibility');
      expect(result.keywords.length).toBeLessThan(3);
    });

    it('should detect exactly 3 keywords at the threshold boundary', () => {
      const result = detectUiContent('a color palette with responsive design');
      expect(result.detected).toBe(true);
      expect(result.keywords).toContain('color');
      expect(result.keywords).toContain('palette');
      expect(result.keywords).toContain('responsive');
    });
  });

  describe('detectUiContentInChange', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-ui-detect-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should detect UI content in proposal.md with ≥3 keywords', () => {
      fs.writeFileSync(
        path.join(tempDir, 'proposal.md'),
        '## Why\nBuild a modern dashboard with dark mode and glassmorphism style'
      );
      const result = detectUiContentInChange(tempDir);
      expect(result.detected).toBe(true);
      expect(result.keywords).toContain('dashboard');
      expect(result.keywords).toContain('dark mode');
      expect(result.keywords).toContain('glassmorphism');
      expect(result.keywords).toContain('style');
    });

    it('should detect UI content in design.md with ≥3 keywords', () => {
      fs.writeFileSync(
        path.join(tempDir, 'design.md'),
        '## Context\nThe color palette needs responsive typography'
      );
      const result = detectUiContentInChange(tempDir);
      expect(result.detected).toBe(true);
      expect(result.keywords.length).toBeGreaterThanOrEqual(3);
    });

    it('should combine content from both files to reach threshold', () => {
      fs.writeFileSync(path.join(tempDir, 'proposal.md'), 'color tokens');
      fs.writeFileSync(path.join(tempDir, 'design.md'), 'responsive layout');
      const result = detectUiContentInChange(tempDir);
      expect(result.detected).toBe(true);
      expect(result.keywords).toContain('color');
      expect(result.keywords).toContain('responsive');
      expect(result.keywords).toContain('layout');
    });

    it('should return false when neither file exists', () => {
      const result = detectUiContentInChange(tempDir);
      expect(result.detected).toBe(false);
      expect(result.keywords).toHaveLength(0);
    });

    it('should return false when files have no UI keywords', () => {
      fs.writeFileSync(
        path.join(tempDir, 'proposal.md'),
        '## Why\nRefactor the API layer for better performance'
      );
      const result = detectUiContentInChange(tempDir);
      expect(result.detected).toBe(false);
    });

    it('should return false with fewer than 3 keywords across files', () => {
      fs.writeFileSync(
        path.join(tempDir, 'proposal.md'),
        '## Why\nAdd a component with style'
      );
      const result = detectUiContentInChange(tempDir);
      expect(result.detected).toBe(false);
      expect(result.keywords.length).toBeLessThan(3);
    });
  });
});
