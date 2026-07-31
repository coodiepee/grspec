import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { resolveSchema } from '../../../src/core/artifact-graph/resolver.js';
import { ArtifactGraph } from '../../../src/core/artifact-graph/graph.js';
import { detectCompleted } from '../../../src/core/artifact-graph/state.js';
import type { BlockedArtifacts } from '../../../src/core/artifact-graph/types.js';

/**
 * Normalize BlockedArtifacts for comparison by sorting dependency arrays.
 * The order of unmet dependencies is not guaranteed, so we sort for stable assertions.
 */
function normalizeBlocked(blocked: BlockedArtifacts): BlockedArtifacts {
  const normalized: BlockedArtifacts = {};
  for (const [key, deps] of Object.entries(blocked)) {
    normalized[key] = [...deps].sort();
  }
  return normalized;
}

describe('artifact-graph workflow integration', () => {
  let tempDir: string;

  beforeEach(() => {
    // Use a unique temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-workflow-test-'));
  });

  afterEach(() => {
    // Clean up temp directory after each test
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('spec-driven workflow v2', () => {
    it('should progress through complete workflow', () => {
      const schema = resolveSchema('spec-driven');
      const graph = ArtifactGraph.fromSchema(schema);

      expect(graph.getName()).toBe('spec-driven');
      expect(graph.getAllArtifacts()).toHaveLength(5);

      let completed = detectCompleted(graph, tempDir);
      expect(completed.size).toBe(0);
      expect(graph.getNextArtifacts(completed)).toEqual(['proposal']);
      expect(graph.isComplete(completed)).toBe(false);
      expect(normalizeBlocked(graph.getBlocked(completed))).toEqual({
        specs: ['proposal'],
        design: ['proposal'],
        ui: ['design'],
        plan: ['design', 'specs', 'ui'],
      });

      fs.writeFileSync(path.join(tempDir, 'proposal.md'), '# Proposal\n\nInitial proposal content.');
      completed = detectCompleted(graph, tempDir);
      expect(completed).toEqual(new Set(['proposal']));
      expect(graph.getNextArtifacts(completed).sort()).toEqual(['design', 'specs']);
      expect(normalizeBlocked(graph.getBlocked(completed))).toEqual({
        ui: ['design'],
        plan: ['design', 'specs', 'ui'],
      });

      fs.writeFileSync(path.join(tempDir, 'design.md'), '# Design\n\nTechnical design content.');
      completed = detectCompleted(graph, tempDir);
      expect(completed).toEqual(new Set(['proposal', 'design']));
      expect(graph.getNextArtifacts(completed).sort()).toEqual(['specs', 'ui']);
      expect(normalizeBlocked(graph.getBlocked(completed))).toEqual({
        plan: ['specs', 'ui'],
      });

      const specsDir = path.join(tempDir, 'specs');
      fs.mkdirSync(specsDir, { recursive: true });
      fs.writeFileSync(path.join(specsDir, 'feature-auth.md'), '# Auth Spec\n\nAuthentication specification.');
      completed = detectCompleted(graph, tempDir);
      expect(completed).toEqual(new Set(['proposal', 'design', 'specs']));
      expect(graph.getNextArtifacts(completed)).toEqual(['ui']);
      expect(graph.getBlocked(completed)).toEqual({
        plan: ['ui'],
      });

      fs.writeFileSync(path.join(tempDir, 'ui.md'), '# UI\n\n## Status\ndone\n');
      completed = detectCompleted(graph, tempDir);
      expect(completed).toEqual(new Set(['proposal', 'design', 'specs', 'ui']));
      expect(graph.getNextArtifacts(completed)).toEqual(['plan']);
      expect(graph.getBlocked(completed)).toEqual({});

      fs.writeFileSync(path.join(tempDir, 'plan.md'), '# Plan\n\n- [ ] Implement feature');
      completed = detectCompleted(graph, tempDir);
      expect(completed).toEqual(new Set(['proposal', 'design', 'specs', 'ui', 'plan']));
      expect(graph.getNextArtifacts(completed)).toEqual([]);
      expect(graph.isComplete(completed)).toBe(true);
      expect(graph.getBlocked(completed)).toEqual({});
    });

    it('should handle out-of-order file creation', () => {
      const schema = resolveSchema('spec-driven');
      const graph = ArtifactGraph.fromSchema(schema);

      fs.writeFileSync(path.join(tempDir, 'design.md'), '# Design');

      let completed = detectCompleted(graph, tempDir);
      expect(completed).toEqual(new Set(['design']));
      expect(graph.getNextArtifacts(completed).sort()).toEqual(['proposal', 'ui']);

      fs.writeFileSync(path.join(tempDir, 'proposal.md'), '# Proposal');
      completed = detectCompleted(graph, tempDir);
      expect(completed).toEqual(new Set(['proposal', 'design']));
      expect(graph.getNextArtifacts(completed).sort()).toEqual(['specs', 'ui']);
    });

    it('should handle multiple spec files in glob pattern', () => {
      const schema = resolveSchema('spec-driven');
      const graph = ArtifactGraph.fromSchema(schema);

      // Complete prerequisites
      fs.writeFileSync(path.join(tempDir, 'proposal.md'), '# Proposal');

      // Create specs directory with multiple files
      const specsDir = path.join(tempDir, 'specs');
      fs.mkdirSync(specsDir, { recursive: true });
      fs.writeFileSync(path.join(specsDir, 'auth.md'), '# Auth');
      fs.writeFileSync(path.join(specsDir, 'api.md'), '# API');
      fs.writeFileSync(path.join(specsDir, 'database.md'), '# Database');

      const completed = detectCompleted(graph, tempDir);
      expect(completed.has('specs')).toBe(true);
    });
  });

  describe('build order consistency', () => {
    it('should return consistent build order across multiple calls', () => {
      const schema = resolveSchema('spec-driven');
      const graph = ArtifactGraph.fromSchema(schema);

      const order1 = graph.getBuildOrder();
      const order2 = graph.getBuildOrder();
      const order3 = graph.getBuildOrder();

      expect(order1).toEqual(order2);
      expect(order2).toEqual(order3);
    });
  });

  describe('empty and edge cases', () => {
    it('should handle empty change directory gracefully', () => {
      const schema = resolveSchema('spec-driven');
      const graph = ArtifactGraph.fromSchema(schema);

      // Directory exists but is empty
      const completed = detectCompleted(graph, tempDir);
      expect(completed.size).toBe(0);
      expect(graph.getNextArtifacts(completed)).toEqual(['proposal']);
    });

    it('should handle non-existent change directory', () => {
      const schema = resolveSchema('spec-driven');
      const graph = ArtifactGraph.fromSchema(schema);

      const nonExistentDir = path.join(tempDir, 'does-not-exist');
      const completed = detectCompleted(graph, nonExistentDir);
      expect(completed.size).toBe(0);
    });

    it('should not count non-matching files in glob directories', () => {
      const schema = resolveSchema('spec-driven');
      const graph = ArtifactGraph.fromSchema(schema);

      // Create specs directory with wrong file types
      const specsDir = path.join(tempDir, 'specs');
      fs.mkdirSync(specsDir, { recursive: true });
      fs.writeFileSync(path.join(specsDir, 'notes.txt'), 'not a markdown file');
      fs.writeFileSync(path.join(specsDir, 'data.json'), '{}');

      const completed = detectCompleted(graph, tempDir);
      expect(completed.has('specs')).toBe(false);
    });
  });
});
