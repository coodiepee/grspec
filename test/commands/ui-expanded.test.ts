import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, '../../dist/cli/index.js');
const PROJECT_ROOT = resolve(__dirname, '../..');
const UI_DETECT_FIXTURE = resolve(PROJECT_ROOT, 'grspec/changes/ui-detect-test-fixture');

function run(args: string): string {
  return execSync(`node ${CLI} ${args}`, {
    cwd: resolve(__dirname, '../..'),
    encoding: 'utf-8',
    timeout: 10000,
  });
}

describe('grspec ui expanded subcommands', () => {
  describe('ui rules', () => {
    it('lists rules with default settings', () => {
      const output = run('ui rules --json');
      const rules = JSON.parse(output);
      expect(rules.length).toBeGreaterThan(100);
      expect(rules[0]).toHaveProperty('Category');
      expect(rules[0]).toHaveProperty('RuleID');
    });

    it('filters by category', () => {
      const output = run('ui rules Accessibility --json');
      const rules = JSON.parse(output);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r: { Category: string }) => r.Category === 'Accessibility')).toBe(true);
    });

    it('filters by platform', () => {
      const output = run('ui rules --platform web --json');
      const rules = JSON.parse(output);
      expect(rules.every((r: { Platform: string }) => r.Platform === 'web' || r.Platform === 'both')).toBe(true);
    });

    it('searches by keyword', () => {
      const output = run('ui rules --search "contrast" --json');
      const rules = JSON.parse(output);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('outputs checklist format', () => {
      const output = run('ui rules Accessibility --checklist');
      expect(output).toContain('- [ ]');
      expect(output).toContain('color-contrast');
    });
  });

  describe('ui reference', () => {
    it('lists all styles', () => {
      const output = run('ui reference --list --json');
      const styles = JSON.parse(output);
      expect(styles.length).toBeGreaterThan(50);
    });

    it('shows a specific style', () => {
      const output = run('ui reference Bauhaus --json');
      const spec = JSON.parse(output);
      expect(spec.name).toContain('Bauhaus');
      expect(spec.content).toBeTruthy();
    });

    it('searches styles', () => {
      const output = run('ui reference --search "geometric bold" --json');
      const results = JSON.parse(output);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('ui status', () => {
    it('outputs status as JSON', () => {
      const output = run('ui status --json');
      const status = JSON.parse(output);
      expect(status).toHaveProperty('designSystem');
      expect(status).toHaveProperty('upstream');
    });
  });

  describe('ui install', () => {
    it('lists platforms', () => {
      const output = run('ui install --list --json');
      const platforms = JSON.parse(output);
      expect(platforms.length).toBeGreaterThanOrEqual(18);
      expect(platforms).toContain('cursor');
    });
  });

  describe('ui sync', () => {
    it('checks for updates', () => {
      const output = run('ui sync --check --json');
      const status = JSON.parse(output);
      expect(status).toHaveProperty('hasUpdates');
      expect(status).toHaveProperty('localVersion');
    });
  });

  describe('ui detect', () => {
    beforeAll(() => {
      mkdirSync(UI_DETECT_FIXTURE, { recursive: true });
      writeFileSync(
        resolve(UI_DETECT_FIXTURE, 'proposal.md'),
        '# UI Test\nBuild a responsive dashboard with chart components, interactive widgets, and modern layout design.\n'
      );
      writeFileSync(
        resolve(UI_DETECT_FIXTURE, '.grspec.yaml'),
        'schema: spec-driven\n'
      );
    });

    afterAll(() => {
      if (existsSync(UI_DETECT_FIXTURE)) {
        rmSync(UI_DETECT_FIXTURE, { recursive: true, force: true });
      }
    });

    it('detects UI content in a change with UI keywords (JSON)', () => {
      const output = run('ui detect --change "ui-detect-test-fixture" --json');
      const result = JSON.parse(output);
      expect(result).toHaveProperty('detected');
      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('score');
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(Array.isArray(result.source)).toBe(true);
      expect(typeof result.score).toBe('number');
    });

    it('outputs human-readable format without --json', () => {
      const output = run('ui detect --change "ui-detect-test-fixture"');
      expect(output).toContain('UI detected:');
      expect(output).toContain('Scanned:');
    });

    it('exits with error for nonexistent change', () => {
      let threw = false;
      try {
        run('ui detect --change "nonexistent-change-xyz" --json');
      } catch (err: unknown) {
        threw = true;
        const output = (err as { stdout?: string }).stdout ?? '';
        if (output) {
          const result = JSON.parse(output);
          expect(result).toHaveProperty('error');
        }
      }
      expect(threw).toBe(true);
    });
  });
});
