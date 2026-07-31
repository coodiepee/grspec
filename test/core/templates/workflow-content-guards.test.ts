import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const CONTENT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../src/core/templates/content'
);

function readContent(name: string): string {
  return readFileSync(path.join(CONTENT_DIR, `${name}.md`), 'utf-8');
}

describe('workflow template content guards', () => {
  const gateTemplates = ['apply-change', 'archive-change', 'verify', 'continue-change'] as const;

  for (const templateName of gateTemplates) {
    it(`rejects legacy dual-read teaching in ${templateName}`, () => {
      const body = readContent(templateName);
      expect(body).not.toMatch(/v1:\s*`?ui\.detected/i);
      expect(body).not.toMatch(/legacy\s+`?ui-detected/i);
      expect(body).not.toMatch(/ui-detected:\s*true/i);
    });
  }

  it('rejects Task/subagent dispatch in archive-change', () => {
    const body = readContent('archive-change');
    expect(body).not.toMatch(/Task tool/i);
    expect(body).not.toMatch(/subagent_type/);
  });

  it('uses AskUserQuestion for archive confirmation gates', () => {
    const body = readContent('archive-change');
    expect(body).toMatch(/AskUserQuestion/);
    expect(body).not.toMatch(/Prompt user for confirmation to continue/);
    expect(body).not.toMatch(/Prompt user to confirm proceed/);
  });

  it('keeps apply strategy routing table', () => {
    const body = readContent('apply-change');
    expect(body).toContain('[codegen]');
    expect(body).toContain('[TDD]');
    expect(body).toContain('[AI+review]');
    expect(body).toContain('[manual]');
    expect(body).toContain('effectiveUiActive');
    expect(body).toContain('uiArtifactStatus');
    expect(body).toContain('uiFoundationReady');
  });
});
