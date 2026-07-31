import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compactVerifySummary, type CompactVerifyResult } from '../../src/core/compact-verify.js';
import { promises as fs } from 'fs';
import path from 'path';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn(),
  },
}));

const mockReadFile = vi.mocked(fs.readFile);
const mockReaddir = vi.mocked(fs.readdir);
const mockAccess = vi.mocked(fs.access);

describe('compactVerifySummary', () => {
  const changeDir = '/project/grspec/changes/test-change';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns task completion count from plan.md', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('plan.md')) {
        return [
          '## 1. Group',
          '- [x] 1.1 Done task',
          '- [x] 1.2 Done task',
          '- [ ] 1.3 Pending task',
        ].join('\n');
      }
      return '';
    });
    mockReaddir.mockResolvedValue([] as unknown as ReturnType<typeof fs.readdir> extends Promise<infer T> ? T : never);

    const result = await compactVerifySummary(changeDir);

    expect(result.taskTotal).toBe(3);
    expect(result.taskComplete).toBe(2);
  });

  it('returns requirement count from delta specs', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('plan.md')) {
        return '- [x] 1.1 Done\n- [x] 1.2 Done';
      }
      if (p.endsWith('spec.md')) {
        return [
          '## ADDED Requirements',
          '### Requirement: First',
          '### Requirement: Second',
          '### Requirement: Third',
        ].join('\n');
      }
      return '';
    });
    mockReaddir.mockImplementation(async (dirPath) => {
      const d = dirPath as string;
      if (d.endsWith('specs')) {
        return ['auth'] as unknown as ReturnType<typeof fs.readdir> extends Promise<infer T> ? T : never;
      }
      if (d.endsWith('auth')) {
        return ['spec.md'] as unknown as ReturnType<typeof fs.readdir> extends Promise<infer T> ? T : never;
      }
      return [] as unknown as ReturnType<typeof fs.readdir> extends Promise<infer T> ? T : never;
    });

    const result = await compactVerifySummary(changeDir);

    expect(result.requirementTotal).toBe(3);
  });

  it('returns null when no plan.md exists', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    const result = await compactVerifySummary(changeDir);

    expect(result).toBeNull();
  });

  it('returns zero requirements when no specs directory exists', async () => {
    mockAccess.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('plan.md')) return undefined;
      throw new Error('ENOENT');
    });
    mockReadFile.mockImplementation(async () => '- [x] 1.1 Done');
    mockReaddir.mockRejectedValue(new Error('ENOENT'));

    const result = await compactVerifySummary(changeDir);

    expect(result!.requirementTotal).toBe(0);
    expect(result!.taskComplete).toBe(1);
    expect(result!.taskTotal).toBe(1);
  });

  it('identifies critical issues when tasks are incomplete', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockImplementation(async () => '- [x] 1.1 Done\n- [ ] 1.2 Not done');
    mockReaddir.mockResolvedValue([] as unknown as ReturnType<typeof fs.readdir> extends Promise<infer T> ? T : never);

    const result = await compactVerifySummary(changeDir);

    expect(result!.hasCriticalIssues).toBe(true);
  });

  it('reports no critical issues when all tasks complete', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockImplementation(async () => '- [x] 1.1 Done\n- [x] 1.2 Done');
    mockReaddir.mockResolvedValue([] as unknown as ReturnType<typeof fs.readdir> extends Promise<infer T> ? T : never);

    const result = await compactVerifySummary(changeDir);

    expect(result!.hasCriticalIssues).toBe(false);
  });
});
