/**
 * Compact Verify Summary
 *
 * Provides a lightweight, read-only verification pass for embedding
 * in the archive flow. Checks task completion and requirement count
 * without deep semantic analysis.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { countTasksFromContent } from '../utils/task-progress.js';

export interface CompactVerifyResult {
  taskTotal: number;
  taskComplete: number;
  requirementTotal: number;
  hasCriticalIssues: boolean;
}

const REQUIREMENT_HEADER_PATTERN = /^###\s+Requirement:/m;

async function fileAccessible(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function countRequirementsInSpecsDir(specsDir: string): Promise<number> {
  let total = 0;
  try {
    const capabilities = await fs.readdir(specsDir);
    for (const capability of capabilities) {
      const capDir = path.join(specsDir, capability);
      try {
        const files = await fs.readdir(capDir);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(capDir, file), 'utf-8');
            const matches = content.match(new RegExp(REQUIREMENT_HEADER_PATTERN.source, 'gm'));
            total += matches ? matches.length : 0;
          }
        }
      } catch {
        // capability path is not a directory or not readable
      }
    }
  } catch {
    // specs directory doesn't exist
  }
  return total;
}

/**
 * Produces a compact verification summary for a change directory.
 * Returns null if the change has no plan.md (nothing to verify).
 */
export async function compactVerifySummary(changeDir: string): Promise<CompactVerifyResult | null> {
  const planPath = path.join(changeDir, 'plan.md');

  const hasPlan = await fileAccessible(planPath);
  if (!hasPlan) {
    return null;
  }

  const planContent = await fs.readFile(planPath, 'utf-8');
  const { total: taskTotal, completed: taskComplete } = countTasksFromContent(planContent);

  const specsDir = path.join(changeDir, 'specs');
  const requirementTotal = await countRequirementsInSpecsDir(specsDir);

  const hasCriticalIssues = taskComplete < taskTotal;

  return {
    taskTotal,
    taskComplete,
    requirementTotal,
    hasCriticalIssues,
  };
}
