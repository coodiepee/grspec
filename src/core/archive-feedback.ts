/**
 * Archive Completion Feedback
 *
 * Generates a lifecycle summary after a change is archived, providing
 * the user with a sense of completion and situational awareness.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { countTasksFromContent } from '../utils/task-progress.js';

export interface SpecMergeResult {
  specsAdded: number;
  specsModified: number;
  specsRemoved: number;
}

export interface SpecRequirementCount {
  capability: string;
  requirementCount: number;
}

export interface ArchiveFeedback {
  taskTotal: number;
  taskComplete: number;
  specsAdded: number;
  specsModified: number;
  specsRemoved: number;
  changeAgeDays: number | null;
  remainingChanges: string[];
  affectedSpecCounts: SpecRequirementCount[];
}

function parseCreatedDateFromFrontmatter(content: string): string | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const createdMatch = frontmatterMatch[1].match(/^created:\s*(.+)$/m);
  if (!createdMatch) return null;

  return createdMatch[1].trim();
}

function daysBetween(dateStr: string, now: Date): number | null {
  const created = new Date(dateStr);
  if (isNaN(created.getTime())) return null;

  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function getChangeAgeDays(changeDir: string): Promise<number | null> {
  const proposalPath = path.join(changeDir, 'proposal.md');
  try {
    const content = await fs.readFile(proposalPath, 'utf-8');
    const dateStr = parseCreatedDateFromFrontmatter(content);
    if (!dateStr) return null;
    return daysBetween(dateStr, new Date());
  } catch {
    return null;
  }
}

async function getTaskCounts(changeDir: string): Promise<{ total: number; complete: number }> {
  const planPath = path.join(changeDir, 'plan.md');
  try {
    const content = await fs.readFile(planPath, 'utf-8');
    const { total, completed } = countTasksFromContent(content);
    return { total, complete: completed };
  } catch {
    return { total: 0, complete: 0 };
  }
}

async function listRemainingChanges(changesDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    return entries
      .filter((entry) => {
        if (typeof entry.isDirectory === 'function') {
          return entry.isDirectory() && entry.name !== 'archive';
        }
        return false;
      })
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

const REQUIREMENT_HEADER_PATTERN = /^###\s+Requirement:/gm;

async function countRequirementsInSpec(specPath: string): Promise<number> {
  try {
    const content = await fs.readFile(specPath, 'utf-8');
    const matches = content.match(REQUIREMENT_HEADER_PATTERN);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

async function getAffectedSpecCounts(
  mainSpecsDir: string,
  affectedCapabilities: string[]
): Promise<SpecRequirementCount[]> {
  const counts: SpecRequirementCount[] = [];
  for (const capability of affectedCapabilities) {
    const specPath = path.join(mainSpecsDir, capability, 'spec.md');
    const requirementCount = await countRequirementsInSpec(specPath);
    counts.push({ capability, requirementCount });
  }
  return counts;
}

export async function archiveCompletionFeedback(
  changeDir: string,
  changesDir: string,
  mergeResult: SpecMergeResult,
  mainSpecsDir?: string,
  affectedCapabilities?: string[]
): Promise<ArchiveFeedback> {
  const [changeAgeDays, taskCounts, remainingChanges] = await Promise.all([
    getChangeAgeDays(changeDir),
    getTaskCounts(changeDir),
    listRemainingChanges(changesDir),
  ]);

  let affectedSpecCounts: SpecRequirementCount[] = [];
  if (mainSpecsDir && affectedCapabilities && affectedCapabilities.length > 0) {
    affectedSpecCounts = await getAffectedSpecCounts(mainSpecsDir, affectedCapabilities);
  }

  return {
    taskTotal: taskCounts.total,
    taskComplete: taskCounts.complete,
    specsAdded: mergeResult.specsAdded,
    specsModified: mergeResult.specsModified,
    specsRemoved: mergeResult.specsRemoved,
    changeAgeDays,
    remainingChanges,
    affectedSpecCounts,
  };
}
