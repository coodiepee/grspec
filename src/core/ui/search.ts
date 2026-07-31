/**
 * UI Search
 *
 * Domain-aware search over CSV-backed UI/UX knowledge bases.
 * Supports auto-detection of the best domain from a query and
 * stack-specific guideline searches.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { BM25 } from './bm25.js';
import { loadCsv, getDataDir, type CsvRow } from './csv-loader.js';
import {
  CSV_CONFIG,
  STACK_CONFIG,
  STACK_COLS,
  DOMAIN_KEYWORDS,
  MAX_RESULTS,
} from './config.js';

export interface SearchResult {
  domain: string;
  query: string;
  file: string;
  count: number;
  results: CsvRow[];
  stack?: string;
  error?: string;
}

function searchCsv(
  filepath: string,
  searchCols: string[],
  outputCols: string[],
  query: string,
  maxResults: number,
): CsvRow[] {
  if (!existsSync(filepath)) return [];

  const data = loadCsv(filepath);
  const documents = data.map((row) =>
    searchCols.map((col) => row[col] ?? '').join(' '),
  );

  const bm25 = new BM25();
  bm25.fit(documents);
  const ranked = bm25.score(query);

  const results: CsvRow[] = [];
  for (const [idx, score] of ranked.slice(0, maxResults)) {
    if (score <= 0) break;
    const row = data[idx];
    const filtered: CsvRow = {};
    for (const col of outputCols) {
      if (col in row) filtered[col] = row[col];
    }
    results.push(filtered);
  }

  return results;
}

export function detectDomain(query: string): string {
  const queryLower = query.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    scores[domain] = keywords.reduce((count, kw) => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return count + (regex.test(queryLower) ? 1 : 0);
    }, 0);
  }

  let best = 'style';
  let bestScore = 0;
  for (const [domain, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }

  return bestScore > 0 ? best : 'style';
}

export function search(
  query: string,
  domain?: string,
  maxResults = MAX_RESULTS,
): SearchResult {
  const resolvedDomain = domain ?? detectDomain(query);
  const config = CSV_CONFIG[resolvedDomain] ?? CSV_CONFIG.style;
  const filepath = join(getDataDir(), config.file);

  if (!existsSync(filepath)) {
    return { error: `File not found: ${filepath}`, domain: resolvedDomain, query, file: config.file, count: 0, results: [] };
  }

  const results = searchCsv(filepath, config.searchCols, config.outputCols, query, maxResults);

  return {
    domain: resolvedDomain,
    query,
    file: config.file,
    count: results.length,
    results,
  };
}

export function searchStack(
  query: string,
  stack: string,
  maxResults = MAX_RESULTS,
): SearchResult {
  const stackConfig = STACK_CONFIG[stack];
  if (!stackConfig) {
    return {
      error: `Unknown stack: ${stack}. Available: ${Object.keys(STACK_CONFIG).join(', ')}`,
      domain: 'stack',
      query,
      file: '',
      count: 0,
      results: [],
    };
  }

  const filepath = join(getDataDir(), stackConfig.file);

  if (!existsSync(filepath)) {
    return { error: `Stack file not found: ${filepath}`, domain: 'stack', stack, query, file: stackConfig.file, count: 0, results: [] };
  }

  const results = searchCsv(filepath, STACK_COLS.searchCols, STACK_COLS.outputCols, query, maxResults);

  return {
    domain: 'stack',
    stack,
    query,
    file: stackConfig.file,
    count: results.length,
    results,
  };
}
