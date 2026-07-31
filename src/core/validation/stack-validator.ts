import type { TouchesEntry } from '../artifact-graph/types.js';
import type { ValidationIssue, ValidationReport } from './types.js';

export interface ChangeStackEntry {
  id: string;
  dependsOn?: string[];
  provides?: string[];
  requires?: string[];
  parent?: string;
  touches?: TouchesEntry[];
}

export interface CycleResult {
  path: string[];
}

export interface MissingDependency {
  changeId: string;
  missingDep: string;
}

export interface OverlapResult {
  path: string;
  changes: string[];
  intents: Record<string, string>;
}

export interface UnmatchedRequire {
  changeId: string;
  marker: string;
}

export interface ExcessiveTouchesWarning {
  changeId: string;
  count: number;
}

const MAX_TOUCHES = 8;

export function detectCycles(entries: ChangeStackEntry[]): CycleResult[] {
  const idSet = new Set(entries.map((e) => e.id));
  const adj = new Map<string, string[]>();
  for (const entry of entries) {
    const deps = (entry.dependsOn ?? []).filter((d) => idSet.has(d));
    adj.set(entry.id, deps);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: CycleResult[] = [];
  const path: string[] = [];

  function dfs(node: string): void {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push({ path: [...path.slice(cycleStart), node] });
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    for (const dep of adj.get(node) ?? []) {
      dfs(dep);
    }

    path.pop();
    inStack.delete(node);
  }

  const sortedIds = [...idSet].sort();
  for (const id of sortedIds) {
    if (!visited.has(id)) {
      dfs(id);
    }
  }

  return cycles;
}

export function detectMissingDependencies(
  entries: ChangeStackEntry[],
  archivedIds: string[] = []
): MissingDependency[] {
  const knownIds = new Set([
    ...entries.map((e) => e.id),
    ...archivedIds,
  ]);
  const missing: MissingDependency[] = [];

  for (const entry of entries) {
    for (const dep of entry.dependsOn ?? []) {
      if (!knownIds.has(dep)) {
        missing.push({ changeId: entry.id, missingDep: dep });
      }
    }
  }

  return missing;
}

export function detectOverlaps(entries: ChangeStackEntry[]): OverlapResult[] {
  const pathMap = new Map<string, { changes: string[]; intents: Record<string, string> }>();

  for (const entry of entries) {
    for (const touch of entry.touches ?? []) {
      const existing = pathMap.get(touch.path);
      if (existing) {
        existing.changes.push(entry.id);
        existing.intents[entry.id] = touch.intent;
      } else {
        pathMap.set(touch.path, {
          changes: [entry.id],
          intents: { [entry.id]: touch.intent },
        });
      }
    }
  }

  const overlaps: OverlapResult[] = [];
  for (const [filePath, data] of pathMap) {
    if (data.changes.length > 1) {
      overlaps.push({ path: filePath, changes: data.changes, intents: data.intents });
    }
  }

  return overlaps;
}

export function detectUnmatchedRequires(
  entries: ChangeStackEntry[],
  archivedProvides: string[] = []
): UnmatchedRequire[] {
  const allProvides = new Set<string>([
    ...entries.flatMap((e) => e.provides ?? []),
    ...archivedProvides,
  ]);

  const unmatched: UnmatchedRequire[] = [];
  for (const entry of entries) {
    for (const marker of entry.requires ?? []) {
      if (!allProvides.has(marker)) {
        unmatched.push({ changeId: entry.id, marker });
      }
    }
  }

  return unmatched;
}

export function detectExcessiveTouches(entries: ChangeStackEntry[]): ExcessiveTouchesWarning[] {
  const warnings: ExcessiveTouchesWarning[] = [];
  for (const entry of entries) {
    const count = entry.touches?.length ?? 0;
    if (count > MAX_TOUCHES) {
      warnings.push({ changeId: entry.id, count });
    }
  }
  return warnings;
}

export function computeTopologicalOrder(entries: ChangeStackEntry[]): string[] {
  const idSet = new Set(entries.map((e) => e.id));
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const entry of entries) {
    adj.set(entry.id, []);
    inDegree.set(entry.id, 0);
  }

  for (const entry of entries) {
    for (const dep of entry.dependsOn ?? []) {
      if (idSet.has(dep)) {
        adj.get(dep)!.push(entry.id);
        inDegree.set(entry.id, (inDegree.get(entry.id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }
  queue.sort();

  const result: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    const neighbors = (adj.get(node) ?? []).sort();
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
        queue.sort();
      }
    }
  }

  if (result.length !== entries.length) {
    throw new Error('Dependency cycle detected: cannot compute topological order');
  }

  return result;
}

export function getNextUnblocked(
  entries: ChangeStackEntry[],
  completedIds: string[] = []
): string[] {
  const completedSet = new Set(completedIds);
  const activeIds = new Set(entries.map((e) => e.id));

  const unblocked: string[] = [];
  for (const entry of entries) {
    const deps = entry.dependsOn ?? [];
    const allSatisfied = deps.every(
      (dep) => completedSet.has(dep) || !activeIds.has(dep)
    );
    if (allSatisfied) {
      unblocked.push(entry.id);
    }
  }

  return unblocked.sort();
}

export function validateStack(
  entries: ChangeStackEntry[],
  archivedIds: string[] = [],
  archivedProvides: string[] = []
): ValidationReport {
  const issues: ValidationIssue[] = [];

  const cycles = detectCycles(entries);
  for (const cycle of cycles) {
    issues.push({
      level: 'ERROR',
      path: cycle.path.join(' → '),
      message: `Dependency cycle detected: ${cycle.path.join(' → ')}`,
    });
  }

  const missing = detectMissingDependencies(entries, archivedIds);
  for (const m of missing) {
    issues.push({
      level: 'ERROR',
      path: m.changeId,
      message: `Change "${m.changeId}" depends on "${m.missingDep}" which does not exist`,
    });
  }

  const overlaps = detectOverlaps(entries);
  for (const overlap of overlaps) {
    const intentsDesc = Object.entries(overlap.intents)
      .map(([change, intent]) => `${change}: "${intent}"`)
      .join(', ');
    issues.push({
      level: 'WARNING',
      path: overlap.path,
      message: `File "${overlap.path}" is touched by multiple changes: ${overlap.changes.join(', ')}. Intents: ${intentsDesc}`,
    });
  }

  const unmatched = detectUnmatchedRequires(entries, archivedProvides);
  for (const u of unmatched) {
    issues.push({
      level: 'WARNING',
      path: u.changeId,
      message: `Change "${u.changeId}" requires capability "${u.marker}" but no active or archived change provides it`,
    });
  }

  const excessive = detectExcessiveTouches(entries);
  for (const e of excessive) {
    issues.push({
      level: 'WARNING',
      path: e.changeId,
      message: `Change "${e.changeId}" declares ${e.count} touches (max recommended: ${MAX_TOUCHES}). Consider splitting.`,
    });
  }

  const errors = issues.filter((i) => i.level === 'ERROR').length;
  const warnings = issues.filter((i) => i.level === 'WARNING').length;
  const info = issues.filter((i) => i.level === 'INFO').length;

  return {
    valid: errors === 0,
    issues,
    summary: { errors, warnings, info },
  };
}
