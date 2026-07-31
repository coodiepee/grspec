import { describe, it, expect } from 'vitest';
import {
  parseStructuredCommits,
  aggregateActivity,
  computeHotFiles,
  type StructuredCommit,
  type ActivitySummary,
} from '../../src/core/activity.js';

describe('parseStructuredCommits', () => {
  it('should extract grspec YAML blocks from commit messages', () => {
    const gitLogOutput = `abc1234|Alice|2025-01-20|feat(add-auth): Authentication Setup

Implements task group 1: Authentication Setup
- Add auth middleware

---
grspec: add-auth
task-group: 1
modules:
  added:
    - path: src/auth/middleware.ts
      domain: auth
      intent: Create auth middleware handler
  modified: []
  deleted: []
---

def5678|Bob|2025-01-19|fix: normal commit without metadata

Just a regular fix.
`;

    const commits = parseStructuredCommits(gitLogOutput);
    expect(commits).toHaveLength(1);
    expect(commits[0].changeName).toBe('add-auth');
    expect(commits[0].taskGroup).toBe(1);
    expect(commits[0].author).toBe('Alice');
    expect(commits[0].modules.added).toHaveLength(1);
    expect(commits[0].modules.added[0].path).toBe('src/auth/middleware.ts');
  });

  it('should handle empty input', () => {
    expect(parseStructuredCommits('')).toEqual([]);
  });

  it('should gracefully skip commits without grspec blocks', () => {
    const gitLogOutput = `abc1234|Alice|2025-01-20|chore: bump deps

Updated packages.
`;
    expect(parseStructuredCommits(gitLogOutput)).toEqual([]);
  });

  it('should parse multiple structured commits', () => {
    const gitLogOutput = `abc1234|Alice|2025-01-20|feat(change-a): Task 1

---
grspec: change-a
task-group: 1
modules:
  added: []
  modified:
    - path: src/a.ts
      domain: core
      intent: Update A
  deleted: []
---

def5678|Alice|2025-01-19|feat(change-a): Task 2

---
grspec: change-a
task-group: 2
modules:
  added:
    - path: src/b.ts
      domain: core
      intent: Add B
  modified: []
  deleted: []
---
`;

    const commits = parseStructuredCommits(gitLogOutput);
    expect(commits).toHaveLength(2);
  });
});

describe('aggregateActivity', () => {
  const commits: StructuredCommit[] = [
    {
      hash: 'abc1234',
      author: 'Alice',
      date: '2025-01-20',
      changeName: 'add-auth',
      taskGroup: 1,
      modules: {
        added: [{ path: 'src/auth/middleware.ts', domain: 'auth', intent: 'Create auth middleware' }],
        modified: [{ path: 'src/api/routes.ts', domain: 'api', intent: 'Register auth routes' }],
        deleted: [],
      },
    },
    {
      hash: 'def5678',
      author: 'Alice',
      date: '2025-01-21',
      changeName: 'add-auth',
      taskGroup: 2,
      modules: {
        added: [],
        modified: [{ path: 'src/config/auth.ts', domain: 'config', intent: 'Add auth config' }],
        deleted: [],
      },
    },
  ];

  it('should aggregate commits by change name', () => {
    const summary = aggregateActivity(commits);
    expect(summary.changes).toHaveLength(1);
    expect(summary.changes[0].name).toBe('add-auth');
    expect(summary.changes[0].author).toBe('Alice');
    expect(summary.changes[0].commits).toBe(2);
  });

  it('should merge module lists across task groups', () => {
    const summary = aggregateActivity(commits);
    const change = summary.changes[0];
    expect(change.modules.added).toContain('src/auth/middleware.ts');
    expect(change.modules.modified).toContain('src/api/routes.ts');
    expect(change.modules.modified).toContain('src/config/auth.ts');
  });

  it('should include intent per file', () => {
    const summary = aggregateActivity(commits);
    const change = summary.changes[0];
    expect(change.intents['src/auth/middleware.ts']).toBe('Create auth middleware');
  });

  it('should track last commit date', () => {
    const summary = aggregateActivity(commits);
    expect(summary.changes[0].lastCommit).toBe('2025-01-21');
  });
});

describe('computeHotFiles', () => {
  it('should compute hot files from aggregated activity', () => {
    const commits: StructuredCommit[] = [
      {
        hash: 'a1',
        author: 'Alice',
        date: '2025-01-20',
        changeName: 'change-a',
        taskGroup: 1,
        modules: {
          added: [],
          modified: [{ path: 'src/shared.ts', domain: 'core', intent: 'intent A' }],
          deleted: [],
        },
      },
      {
        hash: 'b1',
        author: 'Bob',
        date: '2025-01-19',
        changeName: 'change-b',
        taskGroup: 1,
        modules: {
          added: [],
          modified: [{ path: 'src/shared.ts', domain: 'core', intent: 'intent B' }],
          deleted: [],
        },
      },
    ];

    const hotFiles = computeHotFiles(commits);
    expect(hotFiles).toHaveLength(1);
    expect(hotFiles[0].path).toBe('src/shared.ts');
    expect(hotFiles[0].changes).toContain('change-a');
    expect(hotFiles[0].changes).toContain('change-b');
    expect(hotFiles[0].authors).toContain('Alice');
    expect(hotFiles[0].authors).toContain('Bob');
  });

  it('should return empty for non-overlapping files', () => {
    const commits: StructuredCommit[] = [
      {
        hash: 'a1',
        author: 'Alice',
        date: '2025-01-20',
        changeName: 'change-a',
        taskGroup: 1,
        modules: {
          added: [{ path: 'src/a.ts', domain: 'core', intent: 'A' }],
          modified: [],
          deleted: [],
        },
      },
    ];

    const hotFiles = computeHotFiles(commits);
    expect(hotFiles).toEqual([]);
  });
});
