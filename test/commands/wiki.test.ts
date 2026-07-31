import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { readProjectConfig } from '../../src/core/project-config.js';

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

describe('wiki CLI and config integration', () => {
  let tempDir: string;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-test-wiki-cli-'));
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    consoleWarnSpy.mockRestore();
  });

  describe('wiki config parsing', () => {
    it('should parse wiki config with all fields', () => {
      const configDir = path.join(tempDir, 'grspec');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'grspec.yaml'),
        `schema: spec-driven
wiki:
  enabled: true
  categories:
    - concepts
    - entities
    - sources
    - comparisons
  auto-ingest:
    on-propose: true
    on-archive: true
  lint:
    on-archive: true
    structural-only: false
`
      );

      const config = readProjectConfig(tempDir);
      expect(config?.wiki).toBeDefined();
      expect(config!.wiki!.enabled).toBe(true);
      expect(config!.wiki!.categories).toEqual(['concepts', 'entities', 'sources', 'comparisons']);
      expect(config!.wiki!['auto-ingest']?.['on-propose']).toBe(true);
      expect(config!.wiki!.lint?.['on-archive']).toBe(true);
    });

    it('should parse config without wiki section', () => {
      const configDir = path.join(tempDir, 'grspec');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(path.join(configDir, 'grspec.yaml'), 'schema: spec-driven\n');

      const config = readProjectConfig(tempDir);
      expect(config?.wiki).toBeUndefined();
    });

    it('should parse partial wiki config', () => {
      const configDir = path.join(tempDir, 'grspec');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'grspec.yaml'),
        `schema: spec-driven
wiki:
  enabled: true
`
      );

      const config = readProjectConfig(tempDir);
      expect(config?.wiki?.enabled).toBe(true);
      expect(config?.wiki?.categories).toBeUndefined();
    });

    it('should warn and ignore invalid wiki config', () => {
      const configDir = path.join(tempDir, 'grspec');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'grspec.yaml'),
        `schema: spec-driven
wiki: "not an object"
`
      );

      const config = readProjectConfig(tempDir);
      expect(config?.wiki).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});
