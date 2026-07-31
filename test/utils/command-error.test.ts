import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleCommandError } from '../../src/utils/command-error.js';

describe('handleCommandError', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: number | undefined;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
    process.exitCode = originalExitCode;
  });

  describe('with Error instances', () => {
    it('should set process.exitCode to 1', () => {
      handleCommandError(new Error('something broke'), { command: 'init' });
      expect(process.exitCode).toBe(1);
    });

    it('should output the error message to stderr', () => {
      handleCommandError(new Error('something broke'), { command: 'init' });
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('something broke');
    });

    it('should include the command name in context', () => {
      handleCommandError(new Error('failed'), { command: 'archive' });
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('archive');
    });
  });

  describe('with non-Error values', () => {
    it('should handle string errors', () => {
      handleCommandError('string error', { command: 'list' });
      expect(process.exitCode).toBe(1);
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('string error');
    });

    it('should handle number errors', () => {
      handleCommandError(42, { command: 'view' });
      expect(process.exitCode).toBe(1);
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('42');
    });

    it('should handle null/undefined errors', () => {
      handleCommandError(null, { command: 'show' });
      expect(process.exitCode).toBe(1);
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('Unknown error');
    });
  });

  describe('JSON mode', () => {
    it('should output a JSON error object to stderr', () => {
      handleCommandError(new Error('bad input'), { command: 'validate', json: true });
      expect(process.exitCode).toBe(1);
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ error: 'bad input' });
    });

    it('should not include spinner decoration in JSON mode', () => {
      handleCommandError(new Error('bad input'), { command: 'list', json: true });
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).not.toContain('✖');
      expect(output).not.toContain('×');
    });

    it('should handle non-Error values in JSON mode', () => {
      handleCommandError('raw string', { command: 'list', json: true });
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      const parsed = JSON.parse(output);
      expect(parsed).toEqual({ error: 'raw string' });
    });
  });

  describe('optional context fields', () => {
    it('should include changeName when provided', () => {
      handleCommandError(new Error('fail'), { command: 'archive', changeName: 'add-dark-mode' });
      const output = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('add-dark-mode');
    });

    it('should work with minimal context (command only)', () => {
      handleCommandError(new Error('fail'), { command: 'init' });
      expect(process.exitCode).toBe(1);
    });
  });
});
