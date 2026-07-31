import { promises as fs } from 'fs';
import path from 'path';

export const TASK_PATTERN = /^[-*]\s+\[[\sx]\]/i;
export const COMPLETED_TASK_PATTERN = /^[-*]\s+\[x\]/i;

export interface TaskProgress {
  total: number;
  completed: number;
}

export interface IncompleteItem {
  file: string;
  line: string;
}

export function countTasksFromContent(content: string): TaskProgress {
  const lines = content.split('\n');
  let total = 0;
  let completed = 0;
  for (const line of lines) {
    if (line.match(TASK_PATTERN)) {
      total++;
      if (line.match(COMPLETED_TASK_PATTERN)) {
        completed++;
      }
    }
  }
  return { total, completed };
}

export function extractIncompleteItems(content: string): string[] {
  return content.split('\n').filter(
    (line) => TASK_PATTERN.test(line) && !COMPLETED_TASK_PATTERN.test(line)
  );
}

/**
 * Read task progress from plan.md only.
 * tasks.md is ignored (migration window closed).
 */
export async function getTaskProgressForChange(changesDir: string, changeName: string): Promise<TaskProgress> {
  const planPath = path.join(changesDir, changeName, 'plan.md');

  try {
    const content = await fs.readFile(planPath, 'utf-8');
    return countTasksFromContent(content);
  } catch {
    return { total: 0, completed: 0 };
  }
}

/**
 * Collect incomplete checkbox items from plan.md only.
 */
export async function getIncompleteItemsForChange(
  changesDir: string,
  changeName: string
): Promise<IncompleteItem[]> {
  const planPath = path.join(changesDir, changeName, 'plan.md');

  try {
    const content = await fs.readFile(planPath, 'utf-8');
    return extractIncompleteItems(content).map((line) => ({
      file: 'plan.md',
      line: line.trim(),
    }));
  } catch {
    return [];
  }
}

export function formatTaskStatus(progress: TaskProgress): string {
  if (progress.total === 0) return 'No tasks';
  if (progress.completed === progress.total) return '✓ Complete';
  return `${progress.completed}/${progress.total} tasks`;
}
