import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('validate change (non-interactive bulk)', () => {
  const projectRoot = process.cwd();
  const testDir = path.join(projectRoot, 'test-change-validate-tmp');
  const changesDir = path.join(testDir, 'grspec', 'changes');
  const bin = path.join(projectRoot, 'bin', 'grspec.js');

  beforeEach(async () => {
    await fs.mkdir(changesDir, { recursive: true });
    const content = `# Change: Demo\n\n## Why\nBecause reasons that are sufficiently long.\n\n## What Changes\n- **spec-x:** Add something`;
    await fs.mkdir(path.join(changesDir, 'demo'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'demo', 'proposal.md'), content, 'utf-8');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('validates changes when --changes is used without a name', () => {
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };
    try {
      process.chdir(testDir);
      process.env.GRSPEC_INTERACTIVE = '0';
      let err: any;
      let stdout = '';
      try {
        stdout = execSync(`node ${bin} validate --changes`, { encoding: 'utf-8' });
      } catch (e) { err = e; }
      const output = `${stdout}${err?.stdout ?? ''}${err?.stderr ?? ''}`;
      expect(output).toContain('change/demo');
    } finally {
      process.chdir(originalCwd);
      process.env = originalEnv;
    }
  });
});
