/**
 * UI/UX Rules Query Engine
 *
 * Loads structured rules from rules.csv and provides filtering,
 * searching (BM25), and formatted output capabilities.
 */

import { loadCsv, getDataDir, type CsvRow } from './csv-loader.js';
import { BM25 } from './bm25.js';
import { resolve } from 'path';

export interface Rule {
  Category: string;
  RuleID: string;
  Platform: string;
  Severity: string;
  Short: string;
  Do: string;
  Dont: string;
  Reference: string;
}

function toRule(row: CsvRow): Rule {
  return {
    Category: row['Category'] ?? '',
    RuleID: row['RuleID'] ?? '',
    Platform: row['Platform'] ?? 'both',
    Severity: row['Severity'] ?? 'MEDIUM',
    Short: row['Short'] ?? '',
    Do: row['Do'] ?? '',
    Dont: row['Dont'] ?? '',
    Reference: row['Reference'] ?? '',
  };
}

export function loadRules(filepath?: string): Rule[] {
  const path = filepath ?? resolve(getDataDir(), 'rules.csv');
  const rows = loadCsv(path);
  return rows.map(toRule);
}

export function filterByCategory(rules: Rule[], category: string): Rule[] {
  const normalized = category.toLowerCase();
  return rules.filter((r) => r.Category.toLowerCase() === normalized);
}

export function filterByPlatform(rules: Rule[], platform: string): Rule[] {
  const p = platform.toLowerCase();
  if (p === 'both') return rules;
  return rules.filter((r) => r.Platform === p || r.Platform === 'both');
}

export function filterBySeverity(rules: Rule[], severity: string): Rule[] {
  const levels = severity
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);
  return rules.filter((r) => levels.includes(r.Severity));
}

export function searchRules(rules: Rule[], query: string): Rule[] {
  if (rules.length === 0) return [];

  const bm25 = new BM25();
  const documents = rules.map(
    (r) => `${r.Category} ${r.RuleID} ${r.Short} ${r.Do} ${r.Dont} ${r.Reference}`,
  );
  bm25.fit(documents);

  const scores = bm25.score(query);
  const results: Rule[] = [];

  for (const [idx, score] of scores) {
    if (score > 0) {
      results.push(rules[idx]);
    }
  }

  return results;
}

export function formatChecklist(rules: Rule[]): string {
  if (rules.length === 0) return '';

  return rules
    .map((r) => `- [ ] \`${r.RuleID}\` [${r.Severity}] [${r.Platform}] — ${r.Short}`)
    .join('\n');
}
