import { describe, it, expect } from 'vitest';
import {
  computeTopologicalOrder,
  getNextUnblocked,
  type ChangeStackEntry,
} from '../../../src/core/validation/stack-validator.js';

function makeEntry(
  id: string,
  opts: Partial<Omit<ChangeStackEntry, 'id'>> = {}
): ChangeStackEntry {
  return { id, ...opts };
}

describe('computeTopologicalOrder', () => {
  it('should return all entries in lexicographic order when no dependencies', () => {
    const entries = [makeEntry('c'), makeEntry('a'), makeEntry('b')];
    const order = computeTopologicalOrder(entries);
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('should respect dependency ordering', () => {
    const entries = [
      makeEntry('b', { dependsOn: ['a'] }),
      makeEntry('a'),
      makeEntry('c', { dependsOn: ['b'] }),
    ];
    const order = computeTopologicalOrder(entries);
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'));
  });

  it('should break ties lexicographically at same depth', () => {
    const entries = [
      makeEntry('x', { dependsOn: ['base'] }),
      makeEntry('a', { dependsOn: ['base'] }),
      makeEntry('base'),
      makeEntry('m', { dependsOn: ['base'] }),
    ];
    const order = computeTopologicalOrder(entries);
    expect(order[0]).toBe('base');
    const rest = order.slice(1);
    expect(rest).toEqual(['a', 'm', 'x']);
  });

  it('should be deterministic across multiple runs', () => {
    const entries = [
      makeEntry('z', { dependsOn: ['a'] }),
      makeEntry('a'),
      makeEntry('m', { dependsOn: ['a'] }),
    ];
    const result1 = computeTopologicalOrder(entries);
    const result2 = computeTopologicalOrder(entries);
    expect(result1).toEqual(result2);
  });

  it('should return empty array for empty input', () => {
    expect(computeTopologicalOrder([])).toEqual([]);
  });

  it('should throw on cycle', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['b'] }),
      makeEntry('b', { dependsOn: ['a'] }),
    ];
    expect(() => computeTopologicalOrder(entries)).toThrow(/cycle/i);
  });

  it('should ignore dependencies on IDs not in the input set', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['external'] }),
      makeEntry('b'),
    ];
    const order = computeTopologicalOrder(entries);
    expect(order).toContain('a');
    expect(order).toContain('b');
  });
});

describe('getNextUnblocked', () => {
  it('should return all entries when none have dependencies', () => {
    const entries = [makeEntry('a'), makeEntry('b'), makeEntry('c')];
    const next = getNextUnblocked(entries);
    expect(next.sort()).toEqual(['a', 'b', 'c']);
  });

  it('should only return entries whose dependencies are all resolved', () => {
    const entries = [
      makeEntry('a'),
      makeEntry('b', { dependsOn: ['a'] }),
      makeEntry('c', { dependsOn: ['b'] }),
    ];
    const completedIds: string[] = [];
    const next = getNextUnblocked(entries, completedIds);
    expect(next).toEqual(['a']);
  });

  it('should unblock next entries when dependencies are completed', () => {
    const entries = [
      makeEntry('a'),
      makeEntry('b', { dependsOn: ['a'] }),
      makeEntry('c', { dependsOn: ['b'] }),
    ];
    const completedIds = ['a'];
    const remaining = entries.filter((e) => !completedIds.includes(e.id));
    const next = getNextUnblocked(remaining, completedIds);
    expect(next).toEqual(['b']);
  });

  it('should return entries in deterministic lexicographic order', () => {
    const entries = [
      makeEntry('z'),
      makeEntry('a'),
      makeEntry('m'),
    ];
    const next = getNextUnblocked(entries);
    expect(next).toEqual(['a', 'm', 'z']);
  });

  it('should handle external dependencies as satisfied', () => {
    const entries = [
      makeEntry('a', { dependsOn: ['external'] }),
    ];
    const next = getNextUnblocked(entries, ['external']);
    expect(next).toEqual(['a']);
  });
});
