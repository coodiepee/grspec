import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runStructuralLint, buildLintResult } from '../../src/core/wiki-lint.js';

function makePageContent(overrides: Record<string, unknown> = {}): string {
  const fm: Record<string, unknown> = {
    title: 'Test Page',
    type: 'concept',
    created: '2026-05-20',
    updated: '2026-05-20',
    confidence: 'high',
    ...overrides,
  };
  const lines = Object.entries(fm)
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}:\n${v.map((i) => `  - ${JSON.stringify(i)}`).join('\n')}`;
      if (typeof v === 'boolean') return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
  return `---\n${lines}\n---\n\n# ${fm.title}\n\nContent here.\n`;
}

function setupWiki(tempDir: string) {
  const projectRoot = tempDir;
  const wikiDir = path.join(projectRoot, 'grspec', 'wiki');
  const specsDir = path.join(projectRoot, 'grspec', 'specs');
  fs.mkdirSync(wikiDir, { recursive: true });
  fs.mkdirSync(specsDir, { recursive: true });
  return { projectRoot, wikiDir, specsDir };
}

function addPage(
  wikiDir: string,
  category: string,
  topic: string,
  overrides: Record<string, unknown> = {}
) {
  const dir = path.join(wikiDir, category, topic);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.md'), makePageContent({ title: topic, ...overrides }));
}

describe('wiki-lint', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-test-wiki-lint-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('frontmatter validation', () => {
    it('should report pages with missing fields', async () => {
      const { wikiDir, projectRoot } = setupWiki(tempDir);
      const dir = path.join(wikiDir, 'concepts', 'bad');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'page.md'), '---\ntitle: "Hello"\n---\nBody');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const fmIssues = issues.filter((i) => i.check === 'frontmatter');
      expect(fmIssues.length).toBeGreaterThan(0);
    });

    it('should report no issues for valid pages', async () => {
      const { wikiDir, projectRoot } = setupWiki(tempDir);
      addPage(wikiDir, 'concepts', 'valid-concept');
      fs.writeFileSync(path.join(wikiDir, 'index.md'), '- [[valid-concept]]');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const fmIssues = issues.filter((i) => i.check === 'frontmatter');
      expect(fmIssues).toHaveLength(0);
    });
  });

  describe('wikilink integrity', () => {
    it('should report dead wikilinks', async () => {
      const { wikiDir, projectRoot } = setupWiki(tempDir);
      const content = makePageContent({ related: ['[[nonexistent]]'] });
      const dir = path.join(wikiDir, 'concepts', 'test');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'page.md'),
        content + '\nSee [[nonexistent]] for more.\n'
      );
      fs.writeFileSync(path.join(wikiDir, 'index.md'), '- [[test]]');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const linkIssues = issues.filter((i) => i.check === 'wikilink-integrity');
      expect(linkIssues.some((i) => i.message.includes('nonexistent'))).toBe(true);
    });
  });

  describe('orphan page detection', () => {
    it('should detect pages not linked from anywhere', async () => {
      const { wikiDir, projectRoot } = setupWiki(tempDir);
      addPage(wikiDir, 'concepts', 'orphan');
      fs.writeFileSync(path.join(wikiDir, 'index.md'), '# Index\nNo links here.');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const orphanIssues = issues.filter((i) => i.check === 'orphan-page');
      expect(orphanIssues.some((i) => i.page === 'orphan')).toBe(true);
    });

    it('should not flag pages linked from index', async () => {
      const { wikiDir, projectRoot } = setupWiki(tempDir);
      addPage(wikiDir, 'concepts', 'linked');
      fs.writeFileSync(path.join(wikiDir, 'index.md'), '- [[linked]] — A concept');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const orphanIssues = issues.filter((i) => i.check === 'orphan-page');
      expect(orphanIssues.some((i) => i.page === 'linked')).toBe(false);
    });
  });

  describe('source path existence', () => {
    it('should report missing source paths', async () => {
      const { wikiDir, projectRoot } = setupWiki(tempDir);
      addPage(wikiDir, 'concepts', 'test', { sources: ['src/nonexistent.ts'] });
      fs.writeFileSync(path.join(wikiDir, 'index.md'), '- [[test]]');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const sourceIssues = issues.filter((i) => i.check === 'source-path');
      expect(sourceIssues.length).toBeGreaterThan(0);
    });
  });

  describe('index completeness', () => {
    it('should report pages missing from index', async () => {
      const { wikiDir, projectRoot } = setupWiki(tempDir);
      addPage(wikiDir, 'concepts', 'missing-from-index');
      fs.writeFileSync(path.join(wikiDir, 'index.md'), '# Index\nEmpty.');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const indexIssues = issues.filter((i) => i.check === 'index-completeness');
      expect(indexIssues.some((i) => i.page === 'missing-from-index')).toBe(true);
    });
  });

  describe('spec coverage', () => {
    it('should report spec capabilities without wiki entity', async () => {
      const { wikiDir, projectRoot, specsDir } = setupWiki(tempDir);
      const specDir = path.join(specsDir, 'cli-init');
      fs.mkdirSync(specDir, { recursive: true });
      fs.writeFileSync(path.join(specDir, 'spec.md'), '# CLI Init Spec');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const coverageIssues = issues.filter((i) => i.check === 'spec-coverage');
      expect(coverageIssues.some((i) => i.message.includes('cli-init'))).toBe(true);
    });
  });

  describe('locked page reporting', () => {
    it('should report locked pages', async () => {
      const { wikiDir, projectRoot } = setupWiki(tempDir);
      addPage(wikiDir, 'concepts', 'locked', {
        blocked_by: 'some-change',
        blocked_since: '2026-05-20',
      });
      fs.writeFileSync(path.join(wikiDir, 'index.md'), '- [[locked]]');

      const issues = await runStructuralLint(wikiDir, projectRoot);
      const lockIssues = issues.filter((i) => i.check === 'locked-page');
      expect(lockIssues).toHaveLength(1);
      expect(lockIssues[0].message).toContain('some-change');
    });
  });

  describe('buildLintResult', () => {
    it('should build result with correct summary', () => {
      const structural = [
        { level: 'error' as const, check: 'frontmatter', page: 'a', message: 'bad' },
        { level: 'warning' as const, check: 'orphan', page: 'b', message: 'orphan' },
      ];
      const result = buildLintResult(structural);
      expect(result.summary.total).toBe(2);
      expect(result.summary.errors).toBe(1);
      expect(result.summary.warnings).toBe(1);
    });
  });
});
