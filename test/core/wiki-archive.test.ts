import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  detectWikiDeltas,
  mergeWikiDeltas,
  generateWikiIndex,
  appendWikiLog,
  unlockPages,
  generateSourceSummary,
  lockPage,
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
      if (Array.isArray(v)) return `${k}:\n${v.map((i) => `  - ${JSON.stringify(i)}`).join('\n')}`;
      if (typeof v === 'boolean') return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
  return `---\n${lines}\n---\n\n# ${fm.title}\n\nContent here.\n`;
}

describe('wiki archive integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-wiki-archive-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should run full archive flow: detect, merge, index, log, unlock', async () => {
    const projectRoot = tempDir;
    const wikiDir = path.join(projectRoot, 'grspec', 'wiki');
    const changeDir = path.join(projectRoot, 'grspec', 'changes', 'test-change');
    const changeWikiDir = path.join(changeDir, 'wiki');

    // Setup main wiki with two pages (one locked, one not)
    const existingDir = path.join(wikiDir, 'concepts', 'existing-concept');
    fs.mkdirSync(existingDir, { recursive: true });
    fs.writeFileSync(path.join(existingDir, 'page.md'), makePageContent({ title: 'Existing' }));

    const lockedDir = path.join(wikiDir, 'concepts', 'locked-concept');
    fs.mkdirSync(lockedDir, { recursive: true });
    const lockedPage = path.join(lockedDir, 'page.md');
    fs.writeFileSync(lockedPage, makePageContent({ title: 'Locked' }));
    await lockPage(lockedPage, 'test-change');

    fs.writeFileSync(path.join(wikiDir, 'index.md'), '# Index\n- [[existing-concept]]\n- [[locked-concept]]');

    // Setup change wiki with one new page + one modified page
    const newDir = path.join(changeWikiDir, 'entities', 'new-entity');
    fs.mkdirSync(newDir, { recursive: true });
    fs.writeFileSync(path.join(newDir, 'page.md'), makePageContent({ title: 'New Entity', type: 'entity' }));

    const modDir = path.join(changeWikiDir, 'concepts', 'existing-concept');
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(path.join(modDir, 'page.md'), makePageContent({ title: 'Updated Existing' }));

    // Run archive flow
    const deltas = await detectWikiDeltas(changeWikiDir, wikiDir);
    expect(deltas).toHaveLength(2);

    const report = await mergeWikiDeltas(deltas);
    expect(report.added).toHaveLength(1);
    expect(report.modified).toHaveLength(1);

    const indexContent = await generateWikiIndex(wikiDir);
    fs.writeFileSync(path.join(wikiDir, 'index.md'), indexContent);
    expect(indexContent).toContain('[[new-entity]]');
    expect(indexContent).toContain('[[existing-concept]]');

    const allAffected = [...report.added, ...report.modified];
    await appendWikiLog(wikiDir, 'archive', 'Merged test-change', allAffected);
    const log = fs.readFileSync(path.join(wikiDir, 'log.md'), 'utf-8');
    expect(log).toContain('test-change');

    const unlocked = await unlockPages(wikiDir, 'test-change');
    expect(unlocked).toHaveLength(1);
  });

  describe('generateSourceSummary', () => {
    it('should create source summary from change artifacts', async () => {
      const wikiDir = path.join(tempDir, 'grspec', 'wiki');
      fs.mkdirSync(wikiDir, { recursive: true });

      const changeDir = path.join(tempDir, 'grspec', 'changes', 'my-feature');
      fs.mkdirSync(changeDir, { recursive: true });

      fs.writeFileSync(
        path.join(changeDir, 'proposal.md'),
        '# Proposal\n\nThis change adds feature X to enable faster development.\n\n## Details\nMore details.'
      );

      fs.writeFileSync(
        path.join(changeDir, 'ui.md'),
        '## UI Scope\n\nDashboard shell only\n\n## Status\nna\n'
      );

      const specDir = path.join(changeDir, 'specs', 'cli-init');
      fs.mkdirSync(specDir, { recursive: true });
      fs.writeFileSync(path.join(specDir, 'spec.md'), '# Spec');

      const resultPath = await generateSourceSummary('my-feature', changeDir, wikiDir);
      expect(resultPath).not.toBeNull();
      expect(fs.existsSync(resultPath!)).toBe(true);

      const content = fs.readFileSync(resultPath!, 'utf-8');
      expect(content).toContain('type: "source-summary"');
      expect(content).toContain('my-feature');
      expect(content).toContain('[[cli-init]]');
      expect(content).toContain('## UI Summary');
      expect(content).toContain('Status: na');
      expect(content).toContain('ui.md');
    });

    it('should return null when no artifacts exist', async () => {
      const wikiDir = path.join(tempDir, 'wiki');
      fs.mkdirSync(wikiDir, { recursive: true });
      const changeDir = path.join(tempDir, 'empty-change');
      fs.mkdirSync(changeDir, { recursive: true });

      const result = await generateSourceSummary('empty', changeDir, wikiDir);
      expect(result).toBeNull();
    });
  });
});
