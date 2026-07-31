/**
 * UI Reference Viewer
 *
 * Parses the design.csv file (non-standard format with style blocks)
 * and provides lookup, listing, and search capabilities.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadCsv, getDataDir, type CsvRow } from './csv-loader.js';
import { BM25 } from './bm25.js';

export interface StyleBlock {
  name: string;
  description: string;
  useCases: string;
  content: string;
}

export interface StyleListItem {
  name: string;
  category: string;
  keywords: string;
  bestFor: string;
}

/**
 * Parse design.csv into style blocks.
 * Format: each block starts with a name line, followed by description,
 * use cases, and a <design-system>...</design-system> section.
 */
export function parseDesignCsv(filepath?: string): StyleBlock[] {
  const path = filepath ?? resolve(getDataDir(), 'design.csv');
  const content = readFileSync(path, 'utf-8');
  const blocks: StyleBlock[] = [];

  const sections = content.split(/<\/design-system>/);

  for (const section of sections) {
    const designIdx = section.indexOf('<design-system>');
    if (designIdx === -1) continue;

    const preamble = section.substring(0, designIdx).trim();
    const designContent = section.substring(designIdx + '<design-system>'.length).trim();

    const lines = preamble.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length === 0) continue;

    // First non-empty line is the name (may have quotes or other leading chars)
    const name = lines[0].replace(/^[""\s]+/, '').replace(/[""\s]+$/, '');

    // Second line is description
    let description = '';
    if (lines.length > 1) {
      description = lines[1].replace(/^[""\s]+/, '').replace(/[""\s]+$/, '');
    }

    // Remaining preamble lines are use cases
    const useCases = lines.slice(2).join('\n').replace(/^[""\s]+/, '').replace(/[""\s]+$/, '');

    blocks.push({ name, description, useCases, content: designContent });
  }

  return blocks;
}

/**
 * List all styles from styles.csv (the structured style index).
 */
export function listStyles(filepath?: string): StyleListItem[] {
  const path = filepath ?? resolve(getDataDir(), 'styles.csv');
  const rows = loadCsv(path);

  return rows.map((row: CsvRow) => ({
    name: row['Style Category'] ?? '',
    category: row['Type'] ?? '',
    keywords: row['Keywords'] ?? '',
    bestFor: row['Best For'] ?? '',
  }));
}

/**
 * Get full design-system spec for a named style.
 * Matches by case-insensitive substring.
 */
export function getStyleSpec(blocks: StyleBlock[], styleName: string): StyleBlock | null {
  const query = styleName.toLowerCase();

  // Exact match first
  const exact = blocks.find((b) => b.name.toLowerCase() === query);
  if (exact) return exact;

  // Partial/substring match
  const partial = blocks.find(
    (b) =>
      b.name.toLowerCase().includes(query) || query.includes(b.name.toLowerCase().split('（')[0]),
  );
  return partial ?? null;
}

/**
 * Search style blocks using BM25.
 */
export function searchStyles(blocks: StyleBlock[], query: string): StyleBlock[] {
  if (blocks.length === 0) return [];

  const bm25 = new BM25();
  const documents = blocks.map(
    (b) => `${b.name} ${b.description} ${b.useCases} ${b.content.substring(0, 500)}`,
  );
  bm25.fit(documents);

  const scores = bm25.score(query);
  const results: StyleBlock[] = [];

  for (const [idx, score] of scores) {
    if (score > 0) {
      results.push(blocks[idx]);
    }
  }

  return results;
}
