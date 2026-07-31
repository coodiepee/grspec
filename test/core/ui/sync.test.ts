import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import {
  resolveUpstreamPath,
  checkForUpdates,
  generateUpstreamMd,
} from '../../../src/core/ui/sync.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('sync', () => {
  describe('resolveUpstreamPath', () => {
    it('resolves default sibling path', () => {
      const result = resolveUpstreamPath('/home/user/code/grspec-main');
      expect(result).toContain('ui-ux-pro-max-skill');
    });

    it('uses custom path when provided', () => {
      const result = resolveUpstreamPath('/home/user/code/grspec-main', '/custom/path');
      expect(result).toBe('/custom/path');
    });
  });

  describe('checkForUpdates', () => {
    it('detects when upstream is newer', () => {
      const tmp = mkdtempSync(resolve(tmpdir(), 'sync-test-'));
      const upstreamDir = resolve(tmp, 'upstream');
      mkdirSync(resolve(upstreamDir, 'src/ui-ux-pro-max/templates/base'), { recursive: true });
      mkdirSync(resolve(upstreamDir, 'cli'), { recursive: true });
      writeFileSync(
        resolve(upstreamDir, 'src/ui-ux-pro-max/templates/base/quick-reference.md'),
        'newer content v3.0',
      );
      writeFileSync(resolve(upstreamDir, 'cli/package.json'), '{"version": "3.0.0"}');

      const localUpstream = resolve(tmp, 'UPSTREAM.md');
      writeFileSync(
        localUpstream,
        '# Upstream Source\n\n## Source\n\n- **Version**: 2.5.0\n\n## Last Sync\n\n- **Date**: 2026-01-01\n',
      );

      const result = checkForUpdates(localUpstream, upstreamDir);
      expect(result.hasUpdates).toBe(true);
      expect(result.upstreamVersion).toBe('3.0.0');
      expect(result.localVersion).toBe('2.5.0');
    });

    it('reports no updates when versions match', () => {
      const tmp = mkdtempSync(resolve(tmpdir(), 'sync-test-'));
      const upstreamDir = resolve(tmp, 'upstream');
      mkdirSync(upstreamDir, { recursive: true });
      mkdirSync(resolve(upstreamDir, 'cli'), { recursive: true });
      writeFileSync(resolve(upstreamDir, 'cli/package.json'), '{"version": "2.5.0"}');

      const localUpstream = resolve(tmp, 'UPSTREAM.md');
      writeFileSync(
        localUpstream,
        '# Upstream Source\n\n## Source\n\n- **Version**: 2.5.0\n\n## Last Sync\n\n- **Date**: 2026-06-05\n',
      );

      const result = checkForUpdates(localUpstream, upstreamDir);
      expect(result.hasUpdates).toBe(false);
    });
  });

  describe('generateUpstreamMd', () => {
    it('generates valid upstream markdown', () => {
      const md = generateUpstreamMd({
        version: '3.0.0',
        commit: 'abc123',
        date: '2026-06-05',
        assets: ['data/rules.csv', 'data/design.csv'],
      });
      expect(md).toContain('3.0.0');
      expect(md).toContain('abc123');
      expect(md).toContain('2026-06-05');
      expect(md).toContain('rules.csv');
    });
  });
});
