import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import {
  splitChange,
  SplitError,
  type SplitOptions,
  type SplitResult,
} from '../../../src/core/split.js';

describe('splitChange', () => {
  let testDir: string;
  let changesPath: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `grspec-split-test-${randomUUID()}`);
    changesPath = path.join(testDir, 'grspec', 'changes');
    await fs.mkdir(changesPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function createSourceChange(name: string): Promise<string> {
    const changeDir = path.join(changesPath, name);
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      '## Why\nLarge change needs splitting\n\n## What Changes\nEverything\n'
    );
    await fs.writeFile(
      path.join(changeDir, '.grspec.yaml'),
      'schema: spec-driven\ncreated: "2025-01-10"\n'
    );
    return changeDir;
  }

  it('should scaffold child change directories with metadata', async () => {
    const sourceDir = await createSourceChange('big-change');

    const result = await splitChange(changesPath, 'big-change', {
      children: ['big-change-part-1', 'big-change-part-2'],
    });

    expect(result.children).toHaveLength(2);

    for (const childName of ['big-change-part-1', 'big-change-part-2']) {
      const childDir = path.join(changesPath, childName);
      const metaContent = await fs.readFile(path.join(childDir, '.grspec.yaml'), 'utf-8');
      expect(metaContent).toContain('parent: big-change');
      expect(metaContent).toContain('schema: spec-driven');

      const proposal = await fs.readFile(path.join(childDir, 'proposal.md'), 'utf-8');
      expect(proposal).toContain('## Why');
    }
  });

  it('should include dependsOn linking children sequentially', async () => {
    await createSourceChange('big-change');

    const result = await splitChange(changesPath, 'big-change', {
      children: ['part-1', 'part-2', 'part-3'],
    });

    expect(result.children).toHaveLength(3);

    const meta1 = await fs.readFile(path.join(changesPath, 'part-1', '.grspec.yaml'), 'utf-8');
    expect(meta1).not.toContain('dependsOn');

    const meta2 = await fs.readFile(path.join(changesPath, 'part-2', '.grspec.yaml'), 'utf-8');
    expect(meta2).toContain('part-1');

    const meta3 = await fs.readFile(path.join(changesPath, 'part-3', '.grspec.yaml'), 'utf-8');
    expect(meta3).toContain('part-2');
  });

  it('should generate stub proposal and tasks for each child', async () => {
    await createSourceChange('big-change');

    await splitChange(changesPath, 'big-change', {
      children: ['child-a'],
    });

    const childDir = path.join(changesPath, 'child-a');
    const proposal = await fs.readFile(path.join(childDir, 'proposal.md'), 'utf-8');
    expect(proposal).toContain('## Why');
    expect(proposal).toContain('## What Changes');

    const plan = await fs.readFile(path.join(childDir, 'plan.md'), 'utf-8');
    expect(plan).toContain('- [ ]');
  });

  it('should fail with deterministic error when children already exist', async () => {
    await createSourceChange('big-change');

    await splitChange(changesPath, 'big-change', {
      children: ['existing-child'],
    });

    await expect(
      splitChange(changesPath, 'big-change', {
        children: ['existing-child'],
      })
    ).rejects.toThrow(SplitError);
  });

  it('should succeed with --overwrite when children already exist', async () => {
    await createSourceChange('big-change');

    await splitChange(changesPath, 'big-change', {
      children: ['existing-child'],
    });

    const result = await splitChange(changesPath, 'big-change', {
      children: ['existing-child'],
      overwrite: true,
    });

    expect(result.children).toHaveLength(1);
  });

  it('should throw when source change does not exist', async () => {
    await expect(
      splitChange(changesPath, 'nonexistent', {
        children: ['child-1'],
      })
    ).rejects.toThrow(/not found/);
  });

  it('should convert source into parent planning container', async () => {
    await createSourceChange('big-change');
    await fs.writeFile(
      path.join(changesPath, 'big-change', 'tasks.md'),
      '## Implementation\n- [ ] Do something\n'
    );

    await splitChange(changesPath, 'big-change', {
      children: ['slice-1', 'slice-2'],
    });

    const sourceMeta = await fs.readFile(
      path.join(changesPath, 'big-change', '.grspec.yaml'),
      'utf-8'
    );
    expect(sourceMeta).toContain('split: true');
  });
});
