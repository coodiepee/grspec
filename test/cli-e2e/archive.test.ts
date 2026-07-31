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

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

afterAll(async () => {
  await Promise.all(tempRoots.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('grspec archive e2e', () => {
  it('archives a change by name', async () => {
    const projectDir = await prepareFixture('tmp-init');

    const result = await runCLI(['archive', 'c1', '--yes', '--no-validate'], {
      cwd: projectDir,
      timeoutMs: 15000,
    });
    expect(result.exitCode).toBe(0);

    // Change directory should no longer exist at original location
    const changePath = path.join(projectDir, 'grspec/changes/c1');
    expect(await dirExists(changePath)).toBe(false);

    // Should exist in archive
    const archiveDir = path.join(projectDir, 'grspec/changes/archive');
    expect(await dirExists(archiveDir)).toBe(true);

    const archiveEntries = await fs.readdir(archiveDir);
    const archivedChange = archiveEntries.find((entry) => entry.endsWith('-c1'));
    expect(archivedChange).toBeDefined();
  });

  it('fails with error for non-existent change', async () => {
    const projectDir = await prepareFixture('tmp-init');

    const result = await runCLI(['archive', 'nonexistent'], { cwd: projectDir });
    expect(result.exitCode).not.toBe(0);
  });

  it('shows help for archive command', async () => {
    const result = await runCLI(['archive', '--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('archive');
  });
});
