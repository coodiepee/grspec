import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  parseWikiPageContent,
  validateWikiPage,
  extractWikilinks,
  isWikiInitialized,
  scanWikiDirectory,
  detectWikiDeltas,
  mergeWikiDeltas,
  generateWikiIndex,
  appendWikiLog,
  lockPage,
  unlockPages,
  isPageLocked,
} from '../../src/core/wiki.js';

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
      if (Array.isArray(v)) {
        return `${k}:\n${v.map((i) => `  - ${JSON.stringify(i)}`).join('\n')}`;
      }
      if (typeof v === 'boolean') return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
  return `---\n${lines}\n---\n\n# Test Page\n\nSome content about the test page.\n`;
}

describe('wiki', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-test-wiki-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // Page Parsing
  // -------------------------------------------------------------------------
  describe('parseWikiPageContent', () => {
    it('should parse valid page with all required fields', () => {
      const content = makePageContent();
      const page = parseWikiPageContent('/test/page.md', content);
      expect(page.frontmatter.title).toBe('Test Page');
      expect(page.frontmatter.type).toBe('concept');
      expect(page.frontmatter.confidence).toBe('high');
      expect(page.body).toContain('Some content');
    });

    it('should parse page with optional fields', () => {
      const content = makePageContent({
        sources: ['src/core/wiki.ts'],
        related: ['[[other-page]]'],
        blocked_by: 'some-change',
        blocked_since: '2026-05-20',
      });
      const page = parseWikiPageContent('/test/page.md', content);
      expect(page.frontmatter.sources).toEqual(['src/core/wiki.ts']);
      expect(page.frontmatter.related).toEqual(['[[other-page]]']);
      expect(page.frontmatter.blocked_by).toBe('some-change');
    });

    it('should parse page with deleted marker', () => {
      const content = makePageContent({ deleted: true, deleted_reason: 'Module removed' });
      const page = parseWikiPageContent('/test/page.md', content);
      expect(page.frontmatter.deleted).toBe(true);
      expect(page.frontmatter.deleted_reason).toBe('Module removed');
    });

    it('should throw on missing frontmatter', () => {
      expect(() => parseWikiPageContent('/test/page.md', '# No Frontmatter')).toThrow(
        'no valid YAML frontmatter'
      );
    });

    it('should throw on missing required fields', () => {
      const content = '---\ntitle: "Hello"\n---\nBody';
      expect(() => parseWikiPageContent('/test/page.md', content)).toThrow('invalid frontmatter');
    });
  });

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  describe('validateWikiPage', () => {
    it('should return no errors for valid page', () => {
      const errors = validateWikiPage('/test/page.md', makePageContent());
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const content = '---\ntitle: "Hello"\n---\nBody';
      const errors = validateWikiPage('/test/page.md', content);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === 'type' || e.message.includes('Required'))).toBe(true);
    });

    it('should return error for missing frontmatter', () => {
      const errors = validateWikiPage('/test/page.md', '# No Frontmatter');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('No valid YAML frontmatter');
    });
  });

  // -------------------------------------------------------------------------
  // Wikilinks
  // -------------------------------------------------------------------------
  describe('extractWikilinks', () => {
    it('should extract wikilinks from content', () => {
      const content = 'See [[delta-specs]] and [[cli-archive]] for more.';
      const links = extractWikilinks(content);
      expect(links).toEqual(['delta-specs', 'cli-archive']);
    });

    it('should return empty array for no links', () => {
      expect(extractWikilinks('No links here')).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Directory Scanning
  // -------------------------------------------------------------------------
  describe('isWikiInitialized', () => {
    it('should return true when index.md exists', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      fs.mkdirSync(wikiDir, { recursive: true });
      fs.writeFileSync(path.join(wikiDir, 'index.md'), '# Index');
      expect(await isWikiInitialized(tempDir)).toBe(true);
    });

    it('should return false when wiki dir is missing', async () => {
      expect(await isWikiInitialized(tempDir)).toBe(false);
    });
  });

  describe('scanWikiDirectory', () => {
    it('should return empty results for empty wiki', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      fs.mkdirSync(wikiDir, { recursive: true });
      const result = await scanWikiDirectory(wikiDir);
      expect(result.concepts).toEqual([]);
      expect(result.entities).toEqual([]);
    });

    it('should find pages in categories', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      const conceptDir = path.join(wikiDir, 'concepts', 'test-concept');
      fs.mkdirSync(conceptDir, { recursive: true });
      fs.writeFileSync(path.join(conceptDir, 'page.md'), makePageContent());

      const entityDir = path.join(wikiDir, 'entities', 'cli-init');
      fs.mkdirSync(entityDir, { recursive: true });
      fs.writeFileSync(path.join(entityDir, 'page.md'), makePageContent({ type: 'entity' }));

      const result = await scanWikiDirectory(wikiDir);
      expect(result.concepts).toHaveLength(1);
      expect(result.entities).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Delta Detection
  // -------------------------------------------------------------------------
  describe('detectWikiDeltas', () => {
    it('should detect ADDED pages', async () => {
      const changeWiki = path.join(tempDir, 'change-wiki');
      const mainWiki = path.join(tempDir, 'main-wiki');
      fs.mkdirSync(mainWiki, { recursive: true });

      const newPageDir = path.join(changeWiki, 'concepts', 'new-concept');
      fs.mkdirSync(newPageDir, { recursive: true });
      fs.writeFileSync(path.join(newPageDir, 'page.md'), makePageContent());

      const deltas = await detectWikiDeltas(changeWiki, mainWiki);
      expect(deltas).toHaveLength(1);
      expect(deltas[0].type).toBe('added');
    });

    it('should detect MODIFIED pages', async () => {
      const changeWiki = path.join(tempDir, 'change-wiki');
      const mainWiki = path.join(tempDir, 'main-wiki');

      const existingDir = path.join(mainWiki, 'concepts', 'existing');
      fs.mkdirSync(existingDir, { recursive: true });
      fs.writeFileSync(path.join(existingDir, 'page.md'), makePageContent());

      const deltaDir = path.join(changeWiki, 'concepts', 'existing');
      fs.mkdirSync(deltaDir, { recursive: true });
      fs.writeFileSync(path.join(deltaDir, 'page.md'), makePageContent({ title: 'Updated' }));

      const deltas = await detectWikiDeltas(changeWiki, mainWiki);
      expect(deltas).toHaveLength(1);
      expect(deltas[0].type).toBe('modified');
    });

    it('should detect REMOVED pages', async () => {
      const changeWiki = path.join(tempDir, 'change-wiki');
      const mainWiki = path.join(tempDir, 'main-wiki');

      const existingDir = path.join(mainWiki, 'entities', 'old-module');
      fs.mkdirSync(existingDir, { recursive: true });
      fs.writeFileSync(path.join(existingDir, 'page.md'), makePageContent());

      const deltaDir = path.join(changeWiki, 'entities', 'old-module');
      fs.mkdirSync(deltaDir, { recursive: true });
      fs.writeFileSync(
        path.join(deltaDir, 'page.md'),
        makePageContent({ deleted: true, deleted_reason: 'Removed' })
      );

      const deltas = await detectWikiDeltas(changeWiki, mainWiki);
      expect(deltas).toHaveLength(1);
      expect(deltas[0].type).toBe('removed');
    });

    it('should return empty for non-existent change wiki dir', async () => {
      const deltas = await detectWikiDeltas(
        path.join(tempDir, 'nope'),
        path.join(tempDir, 'main')
      );
      expect(deltas).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Delta Merge
  // -------------------------------------------------------------------------
  describe('mergeWikiDeltas', () => {
    it('should create file for ADDED delta', async () => {
      const mainWiki = path.join(tempDir, 'main-wiki');
      fs.mkdirSync(mainWiki, { recursive: true });

      const sourceDir = path.join(tempDir, 'source', 'concepts', 'new');
      fs.mkdirSync(sourceDir, { recursive: true });
      const sourcePath = path.join(sourceDir, 'page.md');
      fs.writeFileSync(sourcePath, makePageContent());

      const targetPath = path.join(mainWiki, 'concepts', 'new', 'page.md');

      const report = await mergeWikiDeltas(
        [{ type: 'added', sourcePath, targetPath, relativePath: 'concepts/new/page.md' }]
      );

      expect(report.added).toEqual(['concepts/new/page.md']);
      expect(fs.existsSync(targetPath)).toBe(true);
    });

    it('should overwrite file for MODIFIED delta', async () => {
      const mainWiki = path.join(tempDir, 'main-wiki');
      const existingDir = path.join(mainWiki, 'concepts', 'existing');
      fs.mkdirSync(existingDir, { recursive: true });
      const targetPath = path.join(existingDir, 'page.md');
      fs.writeFileSync(targetPath, makePageContent({ title: 'Old' }));

      const sourceDir = path.join(tempDir, 'source');
      fs.mkdirSync(sourceDir, { recursive: true });
      const sourcePath = path.join(sourceDir, 'page.md');
      fs.writeFileSync(sourcePath, makePageContent({ title: 'New' }));

      const report = await mergeWikiDeltas(
        [{ type: 'modified', sourcePath, targetPath, relativePath: 'concepts/existing/page.md' }]
      );

      expect(report.modified).toEqual(['concepts/existing/page.md']);
      const content = fs.readFileSync(targetPath, 'utf-8');
      expect(content).toContain('New');
    });

    it('should delete file for REMOVED delta', async () => {
      const mainWiki = path.join(tempDir, 'main-wiki');
      const existingDir = path.join(mainWiki, 'entities', 'old');
      fs.mkdirSync(existingDir, { recursive: true });
      const targetPath = path.join(existingDir, 'page.md');
      fs.writeFileSync(targetPath, makePageContent());

      const report = await mergeWikiDeltas(
        [{ type: 'removed', sourcePath: '', targetPath, relativePath: 'entities/old/page.md' }]
      );

      expect(report.removed).toEqual(['entities/old/page.md']);
      expect(fs.existsSync(targetPath)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Index Generation
  // -------------------------------------------------------------------------
  describe('generateWikiIndex', () => {
    it('should generate index with page entries', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      const conceptDir = path.join(wikiDir, 'concepts', 'test-concept');
      fs.mkdirSync(conceptDir, { recursive: true });
      fs.writeFileSync(path.join(conceptDir, 'page.md'), makePageContent());

      const index = await generateWikiIndex(wikiDir);
      expect(index).toContain('# Wiki Index');
      expect(index).toContain('Total pages: 1');
      expect(index).toContain('## Concepts');
      expect(index).toContain('[[test-concept]]');
    });

    it('should handle empty wiki', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      fs.mkdirSync(wikiDir, { recursive: true });

      const index = await generateWikiIndex(wikiDir);
      expect(index).toContain('Total pages: 0');
    });
  });

  // -------------------------------------------------------------------------
  // Log Management
  // -------------------------------------------------------------------------
  describe('appendWikiLog', () => {
    it('should create log.md if missing', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      fs.mkdirSync(wikiDir, { recursive: true });

      await appendWikiLog(wikiDir, 'init', 'Full wiki build', ['Created 5 pages']);

      const content = fs.readFileSync(path.join(wikiDir, 'log.md'), 'utf-8');
      expect(content).toContain('# Wiki Log');
      expect(content).toContain('init | Full wiki build');
      expect(content).toContain('Created 5 pages');
    });

    it('should append to existing log.md', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      fs.mkdirSync(wikiDir, { recursive: true });
      fs.writeFileSync(path.join(wikiDir, 'log.md'), '# Wiki Log\n\n## [2026-05-19] init | First\n');

      await appendWikiLog(wikiDir, 'ingest', 'Second entry', ['page-a']);

      const content = fs.readFileSync(path.join(wikiDir, 'log.md'), 'utf-8');
      expect(content).toContain('First');
      expect(content).toContain('ingest | Second entry');
    });
  });

  // -------------------------------------------------------------------------
  // Page Locking
  // -------------------------------------------------------------------------
  describe('page locking', () => {
    it('should lock and detect locked page', async () => {
      const pageDir = path.join(tempDir, 'wiki', 'concepts', 'test');
      fs.mkdirSync(pageDir, { recursive: true });
      const pagePath = path.join(pageDir, 'page.md');
      fs.writeFileSync(pagePath, makePageContent());

      await lockPage(pagePath, 'my-change');

      const lockInfo = await isPageLocked(pagePath);
      expect(lockInfo).not.toBeNull();
      expect(lockInfo!.blockedBy).toBe('my-change');
    });

    it('should return null for unlocked page', async () => {
      const pageDir = path.join(tempDir, 'wiki', 'concepts', 'test');
      fs.mkdirSync(pageDir, { recursive: true });
      const pagePath = path.join(pageDir, 'page.md');
      fs.writeFileSync(pagePath, makePageContent());

      const lockInfo = await isPageLocked(pagePath);
      expect(lockInfo).toBeNull();
    });

    it('should unlock pages by change name', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      const pageDir = path.join(wikiDir, 'concepts', 'test');
      fs.mkdirSync(pageDir, { recursive: true });
      const pagePath = path.join(pageDir, 'page.md');
      fs.writeFileSync(pagePath, makePageContent());

      await lockPage(pagePath, 'my-change');
      expect((await isPageLocked(pagePath))?.blockedBy).toBe('my-change');

      const unlocked = await unlockPages(wikiDir, 'my-change');
      expect(unlocked).toHaveLength(1);
      expect(await isPageLocked(pagePath)).toBeNull();
    });
  });
});
