/**
 * Wiki Lint Module
 *
 * Structural health checks for the LLM Wiki. These checks run without
 * LLM invocation — they validate format, links, coverage, and structure.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  scanWikiDirectory,
  parseWikiPage,
  validateWikiPage,
  extractWikilinks,
  wikiTopicName,
  DEFAULT_CATEGORIES,
  type WikiPage,
} from './wiki.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LintIssue {
  level: 'error' | 'warning';
  check: string;
  page: string;
  message: string;
}

export interface WikiLintResult {
  structural: LintIssue[];
  semantic: LintIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all structural lint checks on a wiki directory.
 */
export async function runStructuralLint(
  wikiDir: string,
  projectRoot: string
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  const scan = await scanWikiDirectory(wikiDir);
  const allPagePaths = [
    ...scan.concepts,
    ...scan.entities,
    ...scan.sources,
    ...scan.comparisons,
  ];

  const pages: WikiPage[] = [];
  for (const pagePath of allPagePaths) {
    try {
      pages.push(await parseWikiPage(pagePath));
    } catch {
      // Will be caught by frontmatter validation
    }
  }

  const pageTopicNames = new Set<string>();
  for (const pagePath of allPagePaths) {
    pageTopicNames.add(wikiTopicName(pagePath));
  }

  issues.push(...await checkFrontmatter(allPagePaths, wikiDir));
  issues.push(...checkWikilinkIntegrity(pages, pageTopicNames, wikiDir));
  issues.push(...await checkOrphanPages(pages, pageTopicNames, wikiDir));
  issues.push(...await checkSourcePaths(pages, projectRoot, wikiDir));
  issues.push(...await checkIndexCompleteness(wikiDir, pageTopicNames));
  issues.push(...await checkSpecCoverage(wikiDir, projectRoot));
  issues.push(...checkLockedPages(pages, wikiDir));

  return issues;
}

/**
 * Build a WikiLintResult from issues arrays.
 */
export function buildLintResult(
  structural: LintIssue[],
  semantic: LintIssue[] = []
): WikiLintResult {
  const all = [...structural, ...semantic];
  return {
    structural,
    semantic,
    summary: {
      total: all.length,
      errors: all.filter((i) => i.level === 'error').length,
      warnings: all.filter((i) => i.level === 'warning').length,
    },
  };
}

// ---------------------------------------------------------------------------
// Individual Checks
// ---------------------------------------------------------------------------

function relPath(pagePath: string, wikiDir: string): string {
  return path.relative(wikiDir, pagePath);
}

/**
 * Check all pages for valid frontmatter.
 */
async function checkFrontmatter(pagePaths: string[], wikiDir: string): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  for (const pagePath of pagePaths) {
    try {
      const raw = await fs.readFile(pagePath, 'utf-8');
      const errors = validateWikiPage(pagePath, raw);
      for (const err of errors) {
        issues.push({
          level: 'error',
          check: 'frontmatter',
          page: relPath(pagePath, wikiDir),
          message: `${err.field}: ${err.message}`,
        });
      }
    } catch {
      issues.push({
        level: 'error',
        check: 'frontmatter',
        page: relPath(pagePath, wikiDir),
        message: 'Cannot read file',
      });
    }
  }

  return issues;
}

/**
 * Check that all [[wikilinks]] resolve to existing pages.
 */
function checkWikilinkIntegrity(
  pages: WikiPage[],
  pageTopicNames: Set<string>,
  wikiDir: string
): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const page of pages) {
    const links = extractWikilinks(page.raw);
    for (const link of links) {
      if (!pageTopicNames.has(link)) {
        issues.push({
          level: 'warning',
          check: 'wikilink-integrity',
          page: relPath(page.path, wikiDir),
          message: `Dead link: [[${link}]] — no page found with this topic name`,
        });
      }
    }
  }

  return issues;
}

/**
 * Find pages with no incoming wikilinks (orphans).
 * Structural files (index.md, log.md, overview.md) are excluded.
 */
async function checkOrphanPages(
  pages: WikiPage[],
  pageTopicNames: Set<string>,
  wikiDir: string
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  const incomingLinks = new Set<string>();
  for (const page of pages) {
    const links = extractWikilinks(page.raw);
    for (const link of links) {
      incomingLinks.add(link);
    }
  }

  // Also check index.md for links
  try {
    const indexPath = path.join(wikiDir, 'index.md');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    const indexLinks = extractWikilinks(indexContent);
    for (const link of indexLinks) {
      incomingLinks.add(link);
    }
  } catch {
    // index.md doesn't exist
  }

  for (const topicName of pageTopicNames) {
    if (!incomingLinks.has(topicName)) {
      issues.push({
        level: 'warning',
        check: 'orphan-page',
        page: topicName,
        message: `No incoming [[wikilinks]] from other pages or index`,
      });
    }
  }

  return issues;
}

/**
 * Verify that source paths in frontmatter exist in the repo.
 */
async function checkSourcePaths(
  pages: WikiPage[],
  projectRoot: string,
  wikiDir: string
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  for (const page of pages) {
    if (!page.frontmatter.sources) continue;

    for (const source of page.frontmatter.sources) {
      const fullPath = path.join(projectRoot, source);
      try {
        await fs.access(fullPath);
      } catch {
        issues.push({
          level: 'warning',
          check: 'source-path',
          page: relPath(page.path, wikiDir),
          message: `Source path not found: ${source}`,
        });
      }
    }
  }

  return issues;
}

/**
 * Verify every wiki page appears in index.md.
 */
async function checkIndexCompleteness(
  wikiDir: string,
  pageTopicNames: Set<string>
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  const indexPath = path.join(wikiDir, 'index.md');
  let indexContent: string;
  try {
    indexContent = await fs.readFile(indexPath, 'utf-8');
  } catch {
    if (pageTopicNames.size > 0) {
      issues.push({
        level: 'error',
        check: 'index-completeness',
        page: 'index.md',
        message: 'index.md is missing but wiki has pages',
      });
    }
    return issues;
  }

  const indexLinks = new Set(extractWikilinks(indexContent));
  for (const topicName of pageTopicNames) {
    if (!indexLinks.has(topicName)) {
      issues.push({
        level: 'warning',
        check: 'index-completeness',
        page: topicName,
        message: `Page not listed in index.md`,
      });
    }
  }

  return issues;
}

/**
 * Check that every spec capability has a corresponding wiki entity page.
 */
async function checkSpecCoverage(
  wikiDir: string,
  projectRoot: string
): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
  const specsDir = path.join(projectRoot, 'grspec', 'specs');

  try {
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const entityPage = path.join(wikiDir, 'entities', entry.name, 'page.md');
      try {
        await fs.access(entityPage);
      } catch {
        issues.push({
          level: 'warning',
          check: 'spec-coverage',
          page: `entities/${entry.name}`,
          message: `Spec capability '${entry.name}' has no corresponding wiki entity page`,
        });
      }
    }
  } catch {
    // No specs directory
  }

  return issues;
}

/**
 * Report pages that are currently locked.
 */
function checkLockedPages(pages: WikiPage[], wikiDir: string): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const page of pages) {
    if (page.frontmatter.blocked_by) {
      const since = page.frontmatter.blocked_since || 'unknown';
      issues.push({
        level: 'warning',
        check: 'locked-page',
        page: relPath(page.path, wikiDir),
        message: `Locked by change '${page.frontmatter.blocked_by}' since ${since}`,
      });
    }
  }

  return issues;
}
