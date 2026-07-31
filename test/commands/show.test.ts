import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('top-level show command', () => {
  const projectRoot = process.cwd();
  const testDir = path.join(projectRoot, 'test-show-command-tmp');
  const changesDir = path.join(testDir, 'grspec', 'changes');
  const specsDir = path.join(testDir, 'grspec', 'specs');
  const grspecBin = path.join(projectRoot, 'bin', 'grspec.js');

  const cliEnv = {
    ...process.env,
    GRSPEC_INTERACTIVE: '0',
    GRSPEC_TELEMETRY: '0',
  };

  beforeEach(async () => {
    await fs.mkdir(changesDir, { recursive: true });
    await fs.mkdir(specsDir, { recursive: true });

    const changeContent = `# Change: Demo\n\n## Why\nBecause reasons.\n\n## What Changes\n- **auth:** Add requirement\n`;
    await fs.mkdir(path.join(changesDir, 'demo'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'demo', 'proposal.md'), changeContent, 'utf-8');

    const specContent = `## Purpose\nAuth spec.\n\n## Requirements\n\n### Requirement: User Authentication\nText\n`;
    await fs.mkdir(path.join(specsDir, 'auth'), { recursive: true });
    await fs.writeFile(path.join(specsDir, 'auth', 'spec.md'), specContent, 'utf-8');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('prints hint and non-zero exit when no args and non-interactive', () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(testDir);
      let err: any;
      try {
        execSync(`node ${grspecBin} show`, { encoding: 'utf-8', env: cliEnv });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.status).not.toBe(0);
      const stderr = err.stderr.toString();
      expect(stderr).toContain('Nothing to show.');
      expect(stderr).toContain('grspec show <item>');
      expect(stderr).toContain('grspec show --type change');
      expect(stderr).toContain('grspec show --type spec');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('auto-detects change id and supports --json', () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(testDir);
      const output = execSync(`node ${grspecBin} show demo --json`, { encoding: 'utf-8', env: cliEnv });
      const json = JSON.parse(output);
      expect(json.id).toBe('demo');
      expect(Array.isArray(json.deltas)).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('auto-detects spec id and supports spec-only flags', () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(testDir);
      const output = execSync(`node ${grspecBin} show auth --json --requirements`, { encoding: 'utf-8', env: cliEnv });
      const json = JSON.parse(output);
      expect(json.id).toBe('auth');
      expect(Array.isArray(json.requirements)).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('handles ambiguity and suggests --type', async () => {
    await fs.mkdir(path.join(changesDir, 'foo'), { recursive: true });
    await fs.writeFile(path.join(changesDir, 'foo', 'proposal.md'), '# Change: Foo\n\n## Why\n\n## What Changes\n', 'utf-8');
    await fs.mkdir(path.join(specsDir, 'foo'), { recursive: true });
    await fs.writeFile(path.join(specsDir, 'foo', 'spec.md'), '## Purpose\n\n## Requirements\n\n### Requirement: R\nX', 'utf-8');

    const originalCwd = process.cwd();
    try {
      process.chdir(testDir);
      let err: any;
      try {
        execSync(`node ${grspecBin} show foo`, { encoding: 'utf-8', env: cliEnv });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.status).not.toBe(0);
      const stderr = err.stderr.toString();
      expect(stderr).toContain('Ambiguous item');
      expect(stderr).toContain('--type change|spec');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('prints nearest matches when not found', () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(testDir);
      let err: any;
      try {
        execSync(`node ${grspecBin} show unknown-item`, { encoding: 'utf-8', env: cliEnv });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.status).not.toBe(0);
      const stderr = err.stderr.toString();
      expect(stderr).toContain("Unknown item 'unknown-item'");
    } finally {
      process.chdir(originalCwd);
    }
  });
});
