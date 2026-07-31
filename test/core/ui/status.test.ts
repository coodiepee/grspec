import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  detectDesignSystem,
  readUpstreamVersion,
  buildStatusReport,
  type StatusReport,
} from '../../../src/core/ui/status.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, '../../../assets/ui');

describe('status', () => {
  describe('detectDesignSystem', () => {
    it('detects design-system when MASTER.md exists', () => {
      const result = detectDesignSystem(resolve(__dirname, '__fixtures__/with-ds'));
      expect(result.found).toBe(true);
      expect(result.style).toBeTruthy();
    });

    it('returns not found when no design-system directory', () => {
      const result = detectDesignSystem(resolve(__dirname, '__fixtures__/no-ds'));
      expect(result.found).toBe(false);
    });

    it('handles non-existent path gracefully', () => {
      const result = detectDesignSystem('/tmp/nonexistent-path-xyz');
      expect(result.found).toBe(false);
    });
  });

  describe('readUpstreamVersion', () => {
    it('reads version from UPSTREAM.md', () => {
      const version = readUpstreamVersion(resolve(FIXTURES, 'UPSTREAM.md'));
      expect(version).not.toBeNull();
      expect(version!.version).toBe('2.5.0');
      expect(version!.date).toBe('2026-06-05');
    });

    it('returns null for missing file', () => {
      const version = readUpstreamVersion('/tmp/nonexistent.md');
      expect(version).toBeNull();
    });
  });

  describe('buildStatusReport', () => {
    it('builds a complete status report', () => {
      const report = buildStatusReport({
        projectRoot: resolve(__dirname, '__fixtures__/no-ds'),
        upstreamPath: resolve(FIXTURES, 'UPSTREAM.md'),
      });
      expect(report).toHaveProperty('designSystem');
      expect(report).toHaveProperty('upstream');
      expect(report.upstream).not.toBeNull();
    });
  });
});
