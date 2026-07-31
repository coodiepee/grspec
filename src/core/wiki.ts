/**
 * Wiki Management Module
 *
 * Core logic for LLM Wiki: page parsing, delta detection, merge,
 * index/log management, and page locking.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { parseUiArtifactStatus } from './ui/ui-artifact.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const WikiPageTypeSchema = z.enum([
  'concept',
  'entity',
  'source-summary',
  'comparison',
]);

export type WikiPageType = z.infer<typeof WikiPageTypeSchema>;

export const WikiConfidenceSchema = z.enum(['high', 'medium', 'low']);

export type WikiConfidence = z.infer<typeof WikiConfidenceSchema>;

export const WikiFrontmatterSchema = z.object({
  title: z.string().min(1),
  type: WikiPageTypeSchema,
  created: z.union([z.string(), z.date()]).transform((v) => String(v)),
  updated: z.union([z.string(), z.date()]).transform((v) => String(v)),
  confidence: WikiConfidenceSchema,
  // Optional fields
  sources: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  blocked_by: z.string().optional(),
  blocked_since: z.union([z.string(), z.date()]).transform((v) => String(v)).optional(),
  deleted: z.boolean().optional(),
  deleted_reason: z.string().optional(),
});

export type WikiFrontmatter = z.infer<typeof WikiFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WikiPage {
  path: string;
  frontmatter: WikiFrontmatter;
  body: string;
  raw: string;
}

export interface WikiPageValidationError {
  field: string;
  message: string;
}

export interface WikiDelta {
  type: 'added' | 'modified' | 'removed';
  sourcePath: string;
  targetPath: string;
  relativePath: string;
}

export interface WikiMergeReport {
  added: string[];
  modified: string[];
  removed: string[];
}

export interface WikiLockInfo {
  blockedBy: string;
  blockedSince: string;
}

export interface WikiScanResult {
  concepts: string[];
  entities: string[];
  sources: string[];
  comparisons: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;
const DEFAULT_CATEGORIES = ['concepts', 'entities', 'sources', 'comparisons'];

const CATEGORY_TO_TYPE: Record<string, WikiPageType> = {
  concepts: 'concept',
  entities: 'entity',
  sources: 'source-summary',
  comparisons: 'comparison',
};

// ---------------------------------------------------------------------------
// Page Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a wiki page file into structured data.
 */
export async function parseWikiPage(filePath: string): Promise<WikiPage> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return parseWikiPageContent(filePath, raw);
}

/**
 * Parse wiki page content (for testing without file I/O).
 */
export function parseWikiPageContent(filePath: string, raw: string): WikiPage {
  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    throw new Error(`Wiki page ${filePath} has no valid YAML frontmatter`);
  }

  const [, yamlStr, body] = match;
  let frontmatter: WikiFrontmatter;
  try {
    const parsed = parseYaml(yamlStr);
    frontmatter = WikiFrontmatterSchema.parse(parsed);
  } catch (err) {
    const message = err instanceof z.ZodError
      ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      : String(err);
    throw new Error(`Wiki page ${filePath} has invalid frontmatter: ${message}`);
  }

  return { path: filePath, frontmatter, body: body.trim(), raw };
}

/**
 * Validate a wiki page's frontmatter, returning errors instead of throwing.
 */
export function validateWikiPage(filePath: string, raw: string): WikiPageValidationError[] {
  const errors: WikiPageValidationError[] = [];

  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    errors.push({ field: 'frontmatter', message: 'No valid YAML frontmatter found' });
    return errors;
  }

  const [, yamlStr] = match;
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlStr);
  } catch {
    errors.push({ field: 'frontmatter', message: 'Invalid YAML syntax in frontmatter' });
    return errors;
  }

  const result = WikiFrontmatterSchema.safeParse(parsed);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        field: issue.path.join('.') || 'frontmatter',
        message: issue.message,
      });
    }
  }

  return errors;
}

/**
 * Extract all [[wikilinks]] from page content.
 */
export function extractWikilinks(content: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(WIKILINK_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

// ---------------------------------------------------------------------------
// Directory Scanning
// ---------------------------------------------------------------------------

/**
 * Check if wiki is initialized (index.md exists).
 */
export async function isWikiInitialized(grspecDir: string): Promise<boolean> {
  try {
    await fs.access(path.join(grspecDir, 'wiki', 'index.md'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Scan wiki directory recursively, returning page paths grouped by category.
 */
export async function scanWikiDirectory(wikiDir: string): Promise<WikiScanResult> {
  const result: WikiScanResult = {
    concepts: [],
    entities: [],
    sources: [],
    comparisons: [],
  };

  for (const category of DEFAULT_CATEGORIES) {
    const categoryDir = path.join(wikiDir, category);
    try {
      const pages = await collectPagePaths(categoryDir);
      result[category as keyof WikiScanResult] = pages;
    } catch {
      // Category directory doesn't exist, leave empty
    }
  }

  return result;
}

async function collectPagePaths(dir: string): Promise<string[]> {
  const pages: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pagePath = path.join(dir, entry.name, 'page.md');
      try {
        await fs.access(pagePath);
        pages.push(pagePath);
      } catch {
        // No page.md in this subdirectory
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      pages.push(path.join(dir, entry.name));
    }
  }

  return pages;
}

// ---------------------------------------------------------------------------
// Delta Detection
// ---------------------------------------------------------------------------

/**
 * Detect wiki deltas by comparing change wiki dir against main wiki dir.
 */
export async function detectWikiDeltas(
  changeWikiDir: string,
  mainWikiDir: string
): Promise<WikiDelta[]> {
  const deltas: WikiDelta[] = [];

  try {
    await fs.access(changeWikiDir);
  } catch {
    return deltas;
  }

  for (const category of DEFAULT_CATEGORIES) {
    const changeCategoryDir = path.join(changeWikiDir, category);
    try {
      const entries = await fs.readdir(changeCategoryDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const sourceFile = path.join(changeCategoryDir, entry.name, 'page.md');
        const targetFile = path.join(mainWikiDir, category, entry.name, 'page.md');
        const relativePath = path.join(category, entry.name, 'page.md');

        try {
          await fs.access(sourceFile);
        } catch {
          continue;
        }

        const content = await fs.readFile(sourceFile, 'utf-8');
        const fmMatch = content.match(FRONTMATTER_REGEX);

        if (fmMatch) {
          try {
            const parsed = parseYaml(fmMatch[1]);
            if (parsed && parsed.deleted === true) {
              deltas.push({ type: 'removed', sourcePath: sourceFile, targetPath: targetFile, relativePath });
              continue;
            }
          } catch {
            // Parse error — treat as content file
          }
        }

        let targetExists = false;
        try {
          await fs.access(targetFile);
          targetExists = true;
        } catch {
          // Target doesn't exist
        }

        deltas.push({
          type: targetExists ? 'modified' : 'added',
          sourcePath: sourceFile,
          targetPath: targetFile,
          relativePath,
        });
      }
    } catch {
      // Category directory doesn't exist in change
    }
  }

  return deltas;
}

// ---------------------------------------------------------------------------
// Delta Merge
// ---------------------------------------------------------------------------

/**
 * Merge wiki deltas from a change to the main wiki.
 */
export async function mergeWikiDeltas(
  deltas: WikiDelta[]
): Promise<WikiMergeReport> {
  const report: WikiMergeReport = { added: [], modified: [], removed: [] };

  for (const delta of deltas) {
    switch (delta.type) {
      case 'added':
      case 'modified': {
        const targetDir = path.dirname(delta.targetPath);
        await fs.mkdir(targetDir, { recursive: true });
        await fs.copyFile(delta.sourcePath, delta.targetPath);
        report[delta.type === 'added' ? 'added' : 'modified'].push(delta.relativePath);
        break;
      }
      case 'removed': {
        try {
          await fs.unlink(delta.targetPath);
          // Remove parent directory if empty
          const parentDir = path.dirname(delta.targetPath);
          const remaining = await fs.readdir(parentDir);
          if (remaining.length === 0) {
            await fs.rmdir(parentDir);
          }
        } catch {
          // File already gone
        }
        report.removed.push(delta.relativePath);
        break;
      }
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Index Management
// ---------------------------------------------------------------------------

/**
 * Generate wiki/index.md content from current wiki state.
 */
export async function generateWikiIndex(wikiDir: string): Promise<string> {
  const scan = await scanWikiDirectory(wikiDir);
  const lines: string[] = ['# Wiki Index', ''];

  const now = new Date().toISOString().slice(0, 10);
  let totalPages = 0;

  const sections: { heading: string; pages: string[] }[] = [
    { heading: 'Concepts', pages: scan.concepts },
    { heading: 'Entities', pages: scan.entities },
    { heading: 'Sources', pages: scan.sources },
    { heading: 'Comparisons', pages: scan.comparisons },
  ];

  for (const section of sections) {
    totalPages += section.pages.length;
  }

  lines.push(`Last updated: ${now}`);
  lines.push(`Total pages: ${totalPages}`);
  lines.push('');

  for (const section of sections) {
    if (section.pages.length === 0) continue;

    lines.push(`## ${section.heading}`);
    lines.push('');

    for (const pagePath of section.pages.sort()) {
      try {
        const page = await parseWikiPage(pagePath);
        const topicName = wikiTopicName(pagePath);
        const firstLine = page.body.split('\n').find((l) => l.trim() && !l.startsWith('#'));
        const summary = firstLine
          ? firstLine.trim().slice(0, 120) + (firstLine.trim().length > 120 ? '...' : '')
          : '';
        lines.push(`- [[${topicName}]] — ${summary || page.frontmatter.title}`);
      } catch {
        const topicName = wikiTopicName(pagePath);
        lines.push(`- [[${topicName}]] — (parse error)`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Log Management
// ---------------------------------------------------------------------------

/**
 * Append an entry to wiki/log.md.
 */
export async function appendWikiLog(
  wikiDir: string,
  operation: string,
  description: string,
  affectedPages: string[]
): Promise<void> {
  const logPath = path.join(wikiDir, 'log.md');
  const now = new Date().toISOString().slice(0, 10);

  let existing = '';
  try {
    existing = await fs.readFile(logPath, 'utf-8');
  } catch {
    existing = '# Wiki Log\n';
  }

  const entry = [
    '',
    `## [${now}] ${operation} | ${description}`,
    ...affectedPages.map((p) => `- ${p}`),
    '',
  ].join('\n');

  await fs.writeFile(logPath, existing.trimEnd() + '\n' + entry);
}

// ---------------------------------------------------------------------------
// Page Locking
// ---------------------------------------------------------------------------

/**
 * Lock a wiki page by adding blocked_by to frontmatter.
 */
export async function lockPage(pagePath: string, changeName: string): Promise<void> {
  const raw = await fs.readFile(pagePath, 'utf-8');
  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    throw new Error(`Cannot lock ${pagePath}: no valid frontmatter`);
  }

  const [, yamlStr, body] = match;
  const fm = parseYaml(yamlStr) || {};
  fm.blocked_by = changeName;
  fm.blocked_since = new Date().toISOString().slice(0, 10);

  const newYaml = stringifyYaml(fm).trimEnd();
  await fs.writeFile(pagePath, `---\n${newYaml}\n---\n${body}`);
}

/**
 * Unlock all pages locked by a given change.
 */
export async function unlockPages(wikiDir: string, changeName: string): Promise<string[]> {
  const unlocked: string[] = [];
  const scan = await scanWikiDirectory(wikiDir);
  const allPages = [
    ...scan.concepts,
    ...scan.entities,
    ...scan.sources,
    ...scan.comparisons,
  ];

  for (const pagePath of allPages) {
    const lockInfo = await isPageLocked(pagePath);
    if (lockInfo && lockInfo.blockedBy === changeName) {
      const raw = await fs.readFile(pagePath, 'utf-8');
      const match = raw.match(FRONTMATTER_REGEX);
      if (!match) continue;

      const [, yamlStr, body] = match;
      const fm = parseYaml(yamlStr) || {};
      delete fm.blocked_by;
      delete fm.blocked_since;

      const newYaml = stringifyYaml(fm).trimEnd();
      await fs.writeFile(pagePath, `---\n${newYaml}\n---\n${body}`);
      unlocked.push(pagePath);
    }
  }

  return unlocked;
}

/**
 * Check if a page is locked. Returns lock info or null.
 */
export async function isPageLocked(pagePath: string): Promise<WikiLockInfo | null> {
  try {
    const raw = await fs.readFile(pagePath, 'utf-8');
    const match = raw.match(FRONTMATTER_REGEX);
    if (!match) return null;

    const fm = parseYaml(match[1]);
    if (fm && fm.blocked_by) {
      return {
        blockedBy: String(fm.blocked_by),
        blockedSince: fm.blocked_since ? String(fm.blocked_since) : 'unknown',
      };
    }
  } catch {
    // File doesn't exist or can't be read
  }
  return null;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Source Summary Generation
// ---------------------------------------------------------------------------

/**
 * Generate a source summary wiki page from a change's artifacts.
 * Creates wiki/sources/YYYY-MM-DD-<changeName>.md with type 'source-summary'.
 */
export async function generateSourceSummary(
  changeName: string,
  changeDir: string,
  wikiDir: string
): Promise<string | null> {
  const sections: string[] = [];
  const sources: string[] = [];

  // Read proposal
  try {
    const proposal = await fs.readFile(path.join(changeDir, 'proposal.md'), 'utf-8');
    const firstParagraph = proposal.split('\n\n').find((p) => p.trim() && !p.startsWith('#'));
    if (firstParagraph) {
      sections.push(`## Proposal Summary\n\n${firstParagraph.trim()}`);
    }
    sources.push(`grspec/changes/${changeName}/proposal.md`);
  } catch {
    // No proposal
  }

  // Read design
  try {
    const design = await fs.readFile(path.join(changeDir, 'design.md'), 'utf-8');
    const firstParagraph = design.split('\n\n').find((p) => p.trim() && !p.startsWith('#'));
    if (firstParagraph) {
      sections.push(`## Design Summary\n\n${firstParagraph.trim()}`);
    }
    sources.push(`grspec/changes/${changeName}/design.md`);
  } catch {
    // No design
  }

  // Read ui artifact (v2)
  try {
    const uiMdPath = path.join(changeDir, 'ui.md');
    const uiArtifact = await fs.readFile(uiMdPath, 'utf-8');
    const uiStatus = parseUiArtifactStatus(uiMdPath);
    const scopeMatch = uiArtifact.match(/^##\s+UI Scope\s*\n+([^\n#]+)/im);
    const scopeLine = scopeMatch?.[1]?.trim();
    const uiSummary = scopeLine
      ? `Status: ${uiStatus} — ${scopeLine}`
      : `Status: ${uiStatus}`;
    sections.push(`## UI Summary\n\n${uiSummary}`);
    sources.push(`grspec/changes/${changeName}/ui.md`);
  } catch {
    // No ui.md
  }

  // Read spec names
  try {
    const specsDir = path.join(changeDir, 'specs');
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    const specNames = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    if (specNames.length > 0) {
      sections.push(`## Affected Specs\n\n${specNames.map((n) => `- [[${n}]]`).join('\n')}`);
      for (const n of specNames) {
        sources.push(`grspec/changes/${changeName}/specs/${n}/spec.md`);
      }
    }
  } catch {
    // No specs
  }

  if (sections.length === 0) return null;

  const now = new Date().toISOString().slice(0, 10);
  const slug = `${now}-${changeName}`;
  const sourcesYaml = sources.map((s) => `  - "${s}"`).join('\n');

  const content = `---
title: "Change: ${changeName}"
type: "source-summary"
created: "${now}"
updated: "${now}"
confidence: "high"
sources:
${sourcesYaml}
---

# Change: ${changeName}

${sections.join('\n\n')}
`;

  const targetDir = path.join(wikiDir, 'sources', slug);
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, 'page.md');
  await fs.writeFile(targetPath, content);

  return targetPath;
}

/**
 * Derive a wiki topic name from a page path.
 * Handles both layouts: `category/topic/page.md` and `category/topic.md`.
 */
export function wikiTopicName(pagePath: string): string {
  const base = path.basename(pagePath, '.md');
  if (base === 'page') {
    return path.basename(path.dirname(pagePath));
  }
  return base;
}

export { DEFAULT_CATEGORIES, CATEGORY_TO_TYPE };
