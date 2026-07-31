import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { archiveCompletionFeedback, type ArchiveFeedback, type SpecRequirementCount } from '../../src/core/archive-feedback.js';
import { promises as fs } from 'fs';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

const mockReadFile = vi.mocked(fs.readFile);
const mockReaddir = vi.mocked(fs.readdir);
const mockStat = vi.mocked(fs.stat);

describe('archiveCompletionFeedback', () => {
  const changeDir = '/project/grspec/changes/test-change';
  const changesDir = '/project/grspec/changes';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('extracts change age from proposal frontmatter', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    const createdDate = '2026-06-10';
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('proposal.md')) {
        return `---\ncreated: ${createdDate}\n---\n## Why\nSome reason`;
      }
      if (p.endsWith('plan.md')) {
        return '- [x] 1.1 Task';
      }
      return '';
    });
    mockReaddir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await archiveCompletionFeedback(changeDir, changesDir, {
      specsAdded: 1,
      specsModified: 0,
      specsRemoved: 0,
    });

    expect(result.changeAgeDays).toBe(5);
  });

  it('returns task progress from plan.md', async () => {
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('proposal.md')) {
        return '---\ncreated: 2026-06-15\n---\n## Why';
      }
      if (p.endsWith('plan.md')) {
        return '- [x] 1.1 Done\n- [x] 1.2 Done\n- [x] 1.3 Done';
      }
      return '';
    });
    mockReaddir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await archiveCompletionFeedback(changeDir, changesDir, {
      specsAdded: 2,
      specsModified: 1,
      specsRemoved: 0,
    });

    expect(result.taskTotal).toBe(3);
    expect(result.taskComplete).toBe(3);
    expect(result.specsAdded).toBe(2);
    expect(result.specsModified).toBe(1);
  });

  it('lists remaining active changes', async () => {
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('proposal.md')) {
        return '---\ncreated: 2026-06-15\n---\n## Why';
      }
      if (p.endsWith('plan.md')) {
        return '- [x] 1.1 Done';
      }
      return '';
    });

    mockReaddir.mockImplementation(async (dirPath) => {
      const d = dirPath as string;
      if (d === changesDir) {
        return [
          { name: 'other-change', isDirectory: () => true },
          { name: 'archive', isDirectory: () => true },
          { name: 'IMPLEMENTATION_ORDER.md', isDirectory: () => false },
        ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
      }
      return [] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
    });

    const result = await archiveCompletionFeedback(changeDir, changesDir, {
      specsAdded: 0,
      specsModified: 0,
      specsRemoved: 0,
    });

    expect(result.remainingChanges).toEqual(['other-change']);
  });

  it('returns empty remainingChanges when no other changes exist', async () => {
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('proposal.md')) {
        return '---\ncreated: 2026-06-15\n---\n## Why';
      }
      if (p.endsWith('plan.md')) {
        return '- [x] 1.1 Done';
      }
      return '';
    });
    mockReaddir.mockImplementation(async (dirPath) => {
      const d = dirPath as string;
      if (d === changesDir) {
        return [
          { name: 'archive', isDirectory: () => true },
        ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
      }
      return [] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
    });

    const result = await archiveCompletionFeedback(changeDir, changesDir, {
      specsAdded: 0,
      specsModified: 0,
      specsRemoved: 0,
    });

    expect(result.remainingChanges).toEqual([]);
  });

  it('handles missing proposal gracefully with null age', async () => {
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('proposal.md')) throw new Error('ENOENT');
      if (p.endsWith('plan.md')) return '- [x] 1.1 Done';
      return '';
    });
    mockReaddir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await archiveCompletionFeedback(changeDir, changesDir, {
      specsAdded: 0,
      specsModified: 0,
      specsRemoved: 0,
    });

    expect(result.changeAgeDays).toBeNull();
  });

  it('returns per-spec requirement counts when mainSpecsDir and capabilities provided', async () => {
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('proposal.md')) return '---\ncreated: 2026-06-15\n---\n## Why';
      if (p.endsWith('plan.md')) return '- [x] 1.1 Done';
      if (p.includes('auth') && p.endsWith('spec.md')) {
        return '## Requirements\n### Requirement: Login\n### Requirement: Logout\n### Requirement: Session';
      }
      return '';
    });
    mockReaddir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await archiveCompletionFeedback(
      changeDir,
      changesDir,
      { specsAdded: 1, specsModified: 0, specsRemoved: 0 },
      '/project/grspec/specs',
      ['auth']
    );

    expect(result.affectedSpecCounts).toEqual([
      { capability: 'auth', requirementCount: 3 },
    ]);
  });

  it('returns empty affectedSpecCounts when no mainSpecsDir provided', async () => {
    mockReadFile.mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.endsWith('proposal.md')) return '---\ncreated: 2026-06-15\n---\n## Why';
      if (p.endsWith('plan.md')) return '- [x] 1.1 Done';
      return '';
    });
    mockReaddir.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

    const result = await archiveCompletionFeedback(changeDir, changesDir, {
      specsAdded: 0,
      specsModified: 0,
      specsRemoved: 0,
    });

    expect(result.affectedSpecCounts).toEqual([]);
  });
});
