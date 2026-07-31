import { describe, it, expect } from 'vitest';
import {
  detectCycles,
  detectMissingDependencies,
  detectOverlaps,
  detectUnmatchedRequires,
  detectExcessiveTouches,
  validateStack,
  type ChangeStackEntry,
} from '../../../src/core/validation/stack-validator.js';

function makeEntry(
  id: string,
  opts: Partial<Omit<ChangeStackEntry, 'id'>> = {}
): ChangeStackEntry {
  return { id, ...opts };
}

describe('detectCycles', () => {
  it('should return empty array when no dependencies exist', () => {
    const entries = [makeEntry('a'), makeEntry('b'), makeEntry('c')];
    expect(detectCycles(entries)).toEqual([]);
  });

  it('should return empty array for valid linear dependency chain', () => {
    const entries = [
      makeEntry('a'),
      makeEntry('b', { dependsOn: ['a'] }),
      makeEntry('c', { dependsOn: ['b'] }),
    ];
    expect(detectCycles(entries)).toEqual([]);
  });

  it('should detect a simple two-node cycle', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['b'] }),
      makeEntry('b', { dependsOn: ['a'] }),
    ];
    const cycles = detectCycles(entries);
    expect(cycles.length).toBeGreaterThan(0);
    const cyclePaths = cycles.map((c) => c.path);
    expect(cyclePaths.some((p) => p.includes('a') && p.includes('b'))).toBe(true);
  });

  it('should detect a three-node cycle', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['c'] }),
      makeEntry('b', { dependsOn: ['a'] }),
      makeEntry('c', { dependsOn: ['b'] }),
    ];
    const cycles = detectCycles(entries);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('should detect self-referencing dependency', () => {
    const entries = [makeEntry('a', { dependsOn: ['a'] })];
    const cycles = detectCycles(entries);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0].path).toContain('a');
  });

  it('should detect cycles even with non-cyclic nodes present', () => {
    const entries = [
      makeEntry('a'),
      makeEntry('b', { dependsOn: ['a'] }),
      makeEntry('c', { dependsOn: ['d'] }),
      makeEntry('d', { dependsOn: ['c'] }),
    ];
    const cycles = detectCycles(entries);
    expect(cycles.length).toBeGreaterThan(0);
    const cyclePaths = cycles.flatMap((c) => c.path);
    expect(cyclePaths).toContain('c');
    expect(cyclePaths).toContain('d');
  });

  it('should return deterministic cycle output for the same input', () => {
    const entries = [
      makeEntry('x', { dependsOn: ['y'] }),
      makeEntry('y', { dependsOn: ['z'] }),
      makeEntry('z', { dependsOn: ['x'] }),
    ];
    const result1 = detectCycles(entries);
    const result2 = detectCycles(entries);
    expect(result1).toEqual(result2);
  });
});

describe('detectMissingDependencies', () => {
  it('should return empty array when all dependencies are satisfied', () => {
    const entries = [
      makeEntry('a'),
      makeEntry('b', { dependsOn: ['a'] }),
    ];
    expect(detectMissingDependencies(entries)).toEqual([]);
  });

  it('should detect missing dependency target', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['nonexistent'] }),
    ];
    const missing = detectMissingDependencies(entries);
    expect(missing).toHaveLength(1);
    expect(missing[0].changeId).toBe('a');
    expect(missing[0].missingDep).toBe('nonexistent');
  });

  it('should detect multiple missing dependencies', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['x', 'y'] }),
      makeEntry('b', { dependsOn: ['z'] }),
    ];
    const missing = detectMissingDependencies(entries);
    expect(missing).toHaveLength(3);
  });

  it('should not report dependencies on archived changes as missing', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['archived-change'] }),
    ];
    const archivedIds = ['archived-change'];
    const missing = detectMissingDependencies(entries, archivedIds);
    expect(missing).toEqual([]);
  });
});

describe('detectOverlaps', () => {
  it('should return empty array when no touches overlap', () => {
    const entries = [
      makeEntry('a', { touches: [{ path: 'src/a.ts', intent: 'Add A', mode: 'create' }] }),
      makeEntry('b', { touches: [{ path: 'src/b.ts', intent: 'Add B', mode: 'create' }] }),
    ];
    expect(detectOverlaps(entries)).toEqual([]);
  });

  it('should detect overlapping file paths across changes', () => {
    const entries = [
      makeEntry('a', { touches: [{ path: 'src/shared.ts', intent: 'Add auth', mode: 'modify' }] }),
      makeEntry('b', { touches: [{ path: 'src/shared.ts', intent: 'Add logging', mode: 'modify' }] }),
    ];
    const overlaps = detectOverlaps(entries);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].path).toBe('src/shared.ts');
    expect(overlaps[0].changes).toContain('a');
    expect(overlaps[0].changes).toContain('b');
  });

  it('should detect overlaps across three changes', () => {
    const entries = [
      makeEntry('a', { touches: [{ path: 'src/index.ts', intent: 'Add A', mode: 'modify' }] }),
      makeEntry('b', { touches: [{ path: 'src/index.ts', intent: 'Add B', mode: 'modify' }] }),
      makeEntry('c', { touches: [{ path: 'src/index.ts', intent: 'Add C', mode: 'modify' }] }),
    ];
    const overlaps = detectOverlaps(entries);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].changes).toHaveLength(3);
  });

  it('should handle changes without touches', () => {
    const entries = [
      makeEntry('a'),
      makeEntry('b', { touches: [{ path: 'src/x.ts', intent: 'Add X', mode: 'modify' }] }),
    ];
    expect(detectOverlaps(entries)).toEqual([]);
  });
});

describe('detectUnmatchedRequires', () => {
  it('should return empty array when requires are provided', () => {
    const entries = [
      makeEntry('a', { provides: ['auth'] }),
      makeEntry('b', { requires: ['auth'] }),
    ];
    expect(detectUnmatchedRequires(entries)).toEqual([]);
  });

  it('should warn when requires marker has no provider in active changes', () => {
    const entries = [
      makeEntry('a', { requires: ['database'] }),
    ];
    const warnings = detectUnmatchedRequires(entries);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].changeId).toBe('a');
    expect(warnings[0].marker).toBe('database');
  });

  it('should not warn when requires is satisfied by archived history', () => {
    const entries = [
      makeEntry('a', { requires: ['database'] }),
    ];
    const archivedProvides = ['database'];
    const warnings = detectUnmatchedRequires(entries, archivedProvides);
    expect(warnings).toEqual([]);
  });

  it('should detect multiple unmatched requires across changes', () => {
    const entries = [
      makeEntry('a', { requires: ['x', 'y'] }),
      makeEntry('b', { requires: ['z'] }),
      makeEntry('c', { provides: ['x'] }),
    ];
    const warnings = detectUnmatchedRequires(entries);
    expect(warnings).toHaveLength(2);
    expect(warnings.map((w) => w.marker).sort()).toEqual(['y', 'z']);
  });
});

describe('detectExcessiveTouches', () => {
  it('should return empty array when touches count is within limit', () => {
    const entries = [
      makeEntry('a', {
        touches: Array.from({ length: 8 }, (_, i) => ({
          path: `src/file${i}.ts`,
          intent: 'Something',
          mode: 'modify' as const,
        })),
      }),
    ];
    expect(detectExcessiveTouches(entries)).toEqual([]);
  });

  it('should warn when touches exceed 8 entries', () => {
    const entries = [
      makeEntry('a', {
        touches: Array.from({ length: 9 }, (_, i) => ({
          path: `src/file${i}.ts`,
          intent: 'Something',
          mode: 'modify' as const,
        })),
      }),
    ];
    const warnings = detectExcessiveTouches(entries);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].changeId).toBe('a');
    expect(warnings[0].count).toBe(9);
  });
});

describe('validateStack (integration)', () => {
  it('should return valid report for clean stack', () => {
    const entries = [
      makeEntry('a', { provides: ['auth'] }),
      makeEntry('b', { dependsOn: ['a'], requires: ['auth'] }),
    ];
    const report = validateStack(entries);
    expect(report.valid).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('should return invalid report for cycle', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['b'] }),
      makeEntry('b', { dependsOn: ['a'] }),
    ];
    const report = validateStack(entries);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.level === 'ERROR')).toBe(true);
  });

  it('should include warnings for overlaps without failing', () => {
    const entries = [
      makeEntry('a', { touches: [{ path: 'src/shared.ts', intent: 'Add A', mode: 'modify' }] }),
      makeEntry('b', { touches: [{ path: 'src/shared.ts', intent: 'Add B', mode: 'modify' }] }),
    ];
    const report = validateStack(entries);
    expect(report.valid).toBe(true);
    expect(report.issues.some((i) => i.level === 'WARNING')).toBe(true);
  });

  it('should fail for missing dependencies', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['nonexistent'] }),
    ];
    const report = validateStack(entries);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.level === 'ERROR' && i.message.includes('nonexistent'))).toBe(true);
  });
});
