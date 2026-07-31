import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  countTasksFromContent,
  getTaskProgressForChange,
  getIncompleteItemsForChange,
  formatTaskStatus,
} from '../../src/utils/task-progress.js';

describe('task-progress', () => {
  describe('countTasksFromContent', () => {
    it('should count total and completed tasks', () => {
      const content = '- [ ] task 1\n- [x] task 2\n- [ ] task 3';
      const result = countTasksFromContent(content);
      expect(result.total).toBe(3);
      expect(result.completed).toBe(1);
    });

    it('should handle empty content', () => {
      const result = countTasksFromContent('');
      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
    });
  });

  describe('formatTaskStatus', () => {
    it('should return "No tasks" for zero total', () => {
      expect(formatTaskStatus({ total: 0, completed: 0 })).toBe('No tasks');
    });

    it('should return complete indicator when all done', () => {
      expect(formatTaskStatus({ total: 3, completed: 3 })).toBe('✓ Complete');
    });

    it('should return progress when partially done', () => {
      expect(formatTaskStatus({ total: 5, completed: 2 })).toBe('2/5 tasks');
    });
  });

  describe('plan.md only', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-tp-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('ignores tasks.md when plan.md is missing', async () => {
      const changeName = 'legacy-change';
      const changeDir = path.join(tempDir, changeName);
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] task 1\n- [x] task 2');

      const result = await getTaskProgressForChange(tempDir, changeName);

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
    });

    it('reads plan.md only when both files exist', async () => {
      const changeName = 'dual-change';
      const changeDir = path.join(tempDir, changeName);
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] old task');
      fs.writeFileSync(path.join(changeDir, 'plan.md'), '- [x] new task\n- [ ] second');

      const result = await getTaskProgressForChange(tempDir, changeName);

      expect(result.total).toBe(2);
      expect(result.completed).toBe(1);
    });

    it('reads plan.md when only plan.md exists', async () => {
      const changeName = 'modern-change';
      const changeDir = path.join(tempDir, changeName);
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'plan.md'), '- [ ] task 1');

      const result = await getTaskProgressForChange(tempDir, changeName);

      expect(result.total).toBe(1);
      expect(result.completed).toBe(0);
    });

    it('returns empty incomplete items from tasks.md-only changes', async () => {
      const changeName = 'legacy-items';
      const changeDir = path.join(tempDir, changeName);
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '- [ ] incomplete\n- [x] done');

      const items = await getIncompleteItemsForChange(tempDir, changeName);

      expect(items).toHaveLength(0);
    });

    it('returns incomplete items from plan.md', async () => {
      const changeName = 'plan-items';
      const changeDir = path.join(tempDir, changeName);
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'plan.md'), '- [ ] incomplete\n- [x] done');

      const items = await getIncompleteItemsForChange(tempDir, changeName);

      expect(items).toHaveLength(1);
      expect(items[0].file).toBe('plan.md');
      expect(items[0].line).toContain('incomplete');
    });
  });
});
