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

afterAll(async () => {
  await Promise.all(tempRoots.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('grspec workflow commands e2e', () => {
  it('new change creates a change directory', async () => {
    const projectDir = await prepareFixture('tmp-init');

    const result = await runCLI(['new', 'change', 'test-change'], { cwd: projectDir });
    expect(result.exitCode).toBe(0);

    const changePath = path.join(projectDir, 'grspec/changes/test-change');
    const stat = await fs.stat(changePath);
    expect(stat.isDirectory()).toBe(true);
  });

  it('status returns JSON for a known change', async () => {
    const projectDir = await prepareFixture('tmp-init');

    const result = await runCLI(['status', '--change', 'c1', '--json'], { cwd: projectDir });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');

    const json = JSON.parse(result.stdout);
    expect(json).toHaveProperty('changeName');
    expect(json.changeName).toBe('c1');
  });

  it('instructions returns parseable JSON for an artifact', async () => {
    const projectDir = await prepareFixture('tmp-init');

    const result = await runCLI(['instructions', 'proposal', '--change', 'c1', '--json'], {
      cwd: projectDir,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });

  it('templates returns parseable JSON', async () => {
    const projectDir = await prepareFixture('tmp-init');

    const result = await runCLI(['templates', '--json'], { cwd: projectDir });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });

  it('schemas returns parseable JSON', async () => {
    const result = await runCLI(['schemas', '--json']);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');

    const json = JSON.parse(result.stdout);
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
  });
});
