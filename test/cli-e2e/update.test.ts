import { afterAll, describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { runCLI, cliProjectRoot } from '../helpers/run-cli.js';

const tempRoots: string[] = [];

async function prepareFixture(fixtureName: string): Promise<string> {
  const base = await fs.mkdtemp(path.join(tmpdir(), 'grspec-cli-e2e-'));
  tempRoots.push(base);
  const projectDir = path.join(base, 'project');
  await fs.mkdir(projectDir, { recursive: true });
  const fixtureDir = path.join(cliProjectRoot, 'test', 'fixtures', fixtureName);
  await fs.cp(fixtureDir, projectDir, { recursive: true });
  return projectDir;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

afterAll(async () => {
  await Promise.all(tempRoots.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('grspec update e2e', () => {
  it('updates an initialized project with --tools option', async () => {
    const projectDir = await prepareFixture('tmp-init');

    // First init with claude
    const initResult = await runCLI(['init', '--tools', 'claude'], { cwd: projectDir });
    expect(initResult.exitCode).toBe(0);

    // Then update (should succeed without error)
    const result = await runCLI(['update'], { cwd: projectDir, timeoutMs: 20000 });
    expect(result.timedOut).toBe(false);
    expect(result.exitCode).toBe(0);

    // Skills should still exist after update
    const skillPath = path.join(projectDir, '.claude/skills/grspec-explore/SKILL.md');
    expect(await fileExists(skillPath)).toBe(true);
  }, 30000);

  it('shows help for update command', async () => {
    const result = await runCLI(['update', '--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('update');
  });
});
