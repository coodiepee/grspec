import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { loadWorkflowTemplate } from '../../../src/core/templates/loader.js';

describe('loadWorkflowTemplate', () => {
  let tempDir: string;
  let originalDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `grspec-loader-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    originalDir = process.cwd();
  });

  afterEach(async () => {
    process.chdir(originalDir);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load a .md template file and return its content', async () => {
    const mdDir = path.join(tempDir, 'content');
    await fs.mkdir(mdDir, { recursive: true });
    await fs.writeFile(path.join(mdDir, 'test-workflow.md'), 'Hello {{name}}');

    const content = loadWorkflowTemplate('test-workflow', mdDir);
    expect(content).toBe('Hello {{name}}');
  });

  it('should throw for a missing template file', () => {
    expect(() => loadWorkflowTemplate('nonexistent', tempDir)).toThrow(
      /template.*not found/i
    );
  });

  it('should trim trailing whitespace from loaded content', async () => {
    const mdDir = path.join(tempDir, 'content');
    await fs.mkdir(mdDir, { recursive: true });
    await fs.writeFile(path.join(mdDir, 'trimmed.md'), 'Content here\n\n\n');

    const content = loadWorkflowTemplate('trimmed', mdDir);
    expect(content).toBe('Content here');
  });
});
