import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { registerUiCommand } from '../../src/commands/ui.js';

function createProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerUiCommand(program);
  return program;
}

function captureOutput(fn: () => Promise<void> | void): Promise<string> {
  let output = '';
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    output += args.map(String).join(' ') + '\n';
  });
  return Promise.resolve(fn()).then(() => {
    spy.mockRestore();
    return output;
  });
}

describe('ui init', () => {
  let tempDir: string;
  let originalCwd: string;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = join(import.meta.dirname, '..', 'fixtures', 'tmp-ui-init-cmd');
    mkdirSync(tempDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(tempDir);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    errorSpy.mockRestore();
  });

  it('requires --type option', async () => {
    const program = createProgram();
    await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'init']));
    expect(process.exitCode).toBe(1);
    process.exitCode = undefined;
  });

  it('generates design system with --type', async () => {
    const program = createProgram();
    await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'saas']));

    expect(existsSync(join(tempDir, 'grspec', 'ui', 'MASTER.md'))).toBe(true);
  });

  it('auto-detects project name from package.json', async () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'my-test-project',
      dependencies: {},
    }));

    const program = createProgram();
    const output = await captureOutput(() =>
      program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'saas', '--json']),
    );

    const parsed = JSON.parse(output.trim());
    expect(parsed.detected.projectName).toBe('my-test-project');
  });

  it('outputs JSON with --json flag', async () => {
    const program = createProgram();
    const output = await captureOutput(() =>
      program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'devtool', '--json']),
    );

    const parsed = JSON.parse(output.trim());
    expect(parsed).toHaveProperty('designSystem');
    expect(parsed).toHaveProperty('detected');
    expect(parsed).toHaveProperty('query');
    expect(parsed.query).toContain('devtool');
  });

  it('refuses to overwrite existing design system', async () => {
    const uiDir = join(tempDir, 'grspec', 'ui');
    mkdirSync(uiDir, { recursive: true });
    writeFileSync(join(uiDir, 'MASTER.md'), '# Design System Master File\n\n**Style:** Glassmorphism\n');

    const program = createProgram();
    await captureOutput(() =>
      program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'saas']),
    );

    expect(process.exitCode).toBe(1);
    process.exitCode = undefined;
  });

  it('overwrites with --force', async () => {
    const uiDir = join(tempDir, 'grspec', 'ui');
    mkdirSync(uiDir, { recursive: true });
    writeFileSync(join(uiDir, 'MASTER.md'), '# Design System Master File\n\n**Style:** Old\n');

    const program = createProgram();
    await captureOutput(() =>
      program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'saas', '--force']),
    );

    expect(process.exitCode).toBeUndefined();
  });

  it('generates rules checklist with --with-rules', async () => {
    const program = createProgram();
    await captureOutput(() =>
      program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'saas', '--with-rules']),
    );

    const rulesPath = join(tempDir, 'grspec', 'ui', 'RULES-CHECKLIST.md');
    expect(existsSync(rulesPath)).toBe(true);

    const content = readFileSync(rulesPath, 'utf-8');
    expect(content).toContain('- [ ]');
  });

  it('includes style in query when provided', async () => {
    const program = createProgram();
    const output = await captureOutput(() =>
      program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'saas', '--style', 'minimal dark', '--json']),
    );

    const parsed = JSON.parse(output.trim());
    expect(parsed.query).toContain('minimal dark');
  });

  it('uses custom project name with -p', async () => {
    const program = createProgram();
    const output = await captureOutput(() =>
      program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'saas', '-p', 'CustomName', '--json']),
    );

    const parsed = JSON.parse(output.trim());
    expect(parsed.designSystem.projectName).toBe('CustomName');
  });

  it('detects stack from package.json', async () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'react-app',
      dependencies: { react: '^18.0.0', next: '^14.0.0' },
    }));

    const program = createProgram();
    const output = await captureOutput(() =>
      program.parseAsync(['node', 'test', 'ui', 'init', '--type', 'saas', '--json']),
    );

    const parsed = JSON.parse(output.trim());
    expect(parsed.detected.primaryStack).toBe('nextjs');
    expect(parsed.query).toContain('nextjs');
  });
});
