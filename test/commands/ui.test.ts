import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerUiCommand } from '../../src/commands/ui.js';
import { AVAILABLE_DOMAINS, AVAILABLE_STACKS } from '../../src/core/ui/config.js';

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

describe('ui command', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  describe('ui search', () => {
    it('searches with default domain', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'search', 'glassmorphism']));
      expect(output).toContain('UI Pro Max Search Results');
      expect(output).toContain('glassmorphism');
    });

    it('searches with explicit domain', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'search', 'fintech', '--domain', 'color']));
      expect(output).toContain('color');
    });

    it('searches with stack option', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'search', 'performance', '--stack', 'react']));
      expect(output).toContain('react');
    });

    it('outputs JSON when --json flag is used', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'search', 'minimalism', '--json']));
      const parsed = JSON.parse(output.trim());
      expect(parsed).toHaveProperty('domain');
      expect(parsed).toHaveProperty('results');
      expect(parsed).toHaveProperty('query', 'minimalism');
    });

    it('respects max results option', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'search', 'design', '--json', '-n', '1']));
      const parsed = JSON.parse(output.trim());
      expect(parsed.results.length).toBeLessThanOrEqual(1);
    });

    it('shows error for invalid domain', async () => {
      const program = createProgram();
      await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'search', 'test', '--domain', 'fake']));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid domain'));
    });
  });

  describe('ui design-system', () => {
    it('generates design system with ASCII format', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'design-system', 'SaaS dashboard']));
      expect(output).toContain('RECOMMENDED DESIGN SYSTEM');
      expect(output).toContain('PATTERN');
      expect(output).toContain('STYLE');
      expect(output).toContain('COLORS');
      expect(output).toContain('TYPOGRAPHY');
    });

    it('generates design system with markdown format', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'design-system', 'SaaS dashboard', '-f', 'markdown']));
      expect(output).toContain('## Design System:');
      expect(output).toContain('### Pattern');
      expect(output).toContain('### Colors');
    });

    it('uses custom project name', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'design-system', 'fintech', '-p', 'FinApp']));
      expect(output).toContain('FinApp');
    });

    it('outputs JSON when --json flag is used', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'design-system', 'ecommerce', '--json']));
      const parsed = JSON.parse(output.trim());
      expect(parsed).toHaveProperty('projectName');
      expect(parsed).toHaveProperty('category');
      expect(parsed).toHaveProperty('colors');
      expect(parsed).toHaveProperty('typography');
    });
  });

  describe('ui domains', () => {
    it('lists all available domains', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'domains']));
      expect(output).toContain('Available search domains');
      for (const domain of ['style', 'color', 'chart', 'ux', 'typography']) {
        expect(output).toContain(domain);
      }
    });

    it('outputs JSON when --json flag is used', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'domains', '--json']));
      const parsed = JSON.parse(output.trim());
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(AVAILABLE_DOMAINS.length);
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0]).toHaveProperty('file');
    });
  });

  describe('ui stacks', () => {
    it('lists all available stacks', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'stacks']));
      expect(output).toContain('Available technology stacks');
      for (const stack of ['react', 'nextjs', 'vue', 'flutter']) {
        expect(output).toContain(stack);
      }
    });

    it('outputs JSON when --json flag is used', async () => {
      const program = createProgram();
      const output = await captureOutput(() => program.parseAsync(['node', 'test', 'ui', 'stacks', '--json']));
      const parsed = JSON.parse(output.trim());
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(AVAILABLE_STACKS.length);
      expect(parsed).toContain('react');
    });
  });
});
