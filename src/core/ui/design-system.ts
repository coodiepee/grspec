/**
 * Design System Generator
 *
 * Aggregates multi-domain search results and applies reasoning rules
 * to produce comprehensive design system recommendations.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { loadCsv, getDataDir, type CsvRow } from './csv-loader.js';
import { search } from './search.js';

const REASONING_FILE = 'ui-reasoning.csv';

interface SearchConfig {
  maxResults: number;
}

const SEARCH_CONFIG: Record<string, SearchConfig> = {
  product: { maxResults: 1 },
  style: { maxResults: 3 },
  color: { maxResults: 2 },
  landing: { maxResults: 2 },
  typography: { maxResults: 2 },
};

export interface DesignSystemPattern {
  name: string;
  sections: string;
  ctaPlacement: string;
  colorStrategy: string;
  conversion: string;
}

export interface DesignSystemStyle {
  name: string;
  type: string;
  effects: string;
  keywords: string;
  bestFor: string;
  performance: string;
  accessibility: string;
  lightMode: string;
  darkMode: string;
}

export interface DesignSystemColors {
  primary: string;
  onPrimary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  destructive: string;
  ring: string;
  notes: string;
  cta: string;
  text: string;
}

export interface DesignSystemTypography {
  heading: string;
  body: string;
  mood: string;
  bestFor: string;
  googleFontsUrl: string;
  cssImport: string;
}

export interface DesignSystem {
  projectName: string;
  category: string;
  pattern: DesignSystemPattern;
  style: DesignSystemStyle;
  colors: DesignSystemColors;
  typography: DesignSystemTypography;
  keyEffects: string;
  antiPatterns: string;
  decisionRules: Record<string, string>;
  severity: string;
}

interface ReasoningResult {
  pattern: string;
  stylePriority: string[];
  colorMood: string;
  typographyMood: string;
  keyEffects: string;
  antiPatterns: string;
  decisionRules: Record<string, string>;
  severity: string;
}

function loadReasoning(): CsvRow[] {
  const filepath = join(getDataDir(), REASONING_FILE);
  if (!existsSync(filepath)) return [];
  return loadCsv(filepath);
}

function findReasoningRule(reasoningData: CsvRow[], category: string): CsvRow | undefined {
  const categoryLower = category.toLowerCase();

  // Exact match
  const exact = reasoningData.find((r) => (r.UI_Category ?? '').toLowerCase() === categoryLower);
  if (exact) return exact;

  // Partial match
  const partial = reasoningData.find((r) => {
    const cat = (r.UI_Category ?? '').toLowerCase();
    return cat.includes(categoryLower) || categoryLower.includes(cat);
  });
  if (partial) return partial;

  // Keyword match
  return reasoningData.find((r) => {
    const keywords = (r.UI_Category ?? '').toLowerCase().replace(/[/\-]/g, ' ').split(/\s+/);
    return keywords.some((kw) => categoryLower.includes(kw));
  });
}

function applyReasoning(reasoningData: CsvRow[], category: string): ReasoningResult {
  const rule = findReasoningRule(reasoningData, category);

  if (!rule) {
    return {
      pattern: 'Hero + Features + CTA',
      stylePriority: ['Minimalism', 'Flat Design'],
      colorMood: 'Professional',
      typographyMood: 'Clean',
      keyEffects: 'Subtle hover transitions',
      antiPatterns: '',
      decisionRules: {},
      severity: 'MEDIUM',
    };
  }

  let decisionRules: Record<string, string> = {};
  try {
    decisionRules = JSON.parse(rule.Decision_Rules ?? '{}');
  } catch {
    // ignore malformed JSON
  }

  return {
    pattern: rule.Recommended_Pattern ?? '',
    stylePriority: (rule.Style_Priority ?? '').split('+').map((s) => s.trim()),
    colorMood: rule.Color_Mood ?? '',
    typographyMood: rule.Typography_Mood ?? '',
    keyEffects: rule.Key_Effects ?? '',
    antiPatterns: rule.Anti_Patterns ?? '',
    decisionRules,
    severity: rule.Severity ?? 'MEDIUM',
  };
}

function selectBestMatch(results: CsvRow[], priorityKeywords: string[]): CsvRow {
  if (results.length === 0) return {};
  if (priorityKeywords.length === 0) return results[0];

  // Exact style name match
  for (const priority of priorityKeywords) {
    const priorityLower = priority.toLowerCase().trim();
    for (const result of results) {
      const styleName = (result['Style Category'] ?? '').toLowerCase();
      if (priorityLower.includes(styleName) || styleName.includes(priorityLower)) {
        return result;
      }
    }
  }

  // Score by keyword match
  const scored = results.map((result) => {
    const resultStr = JSON.stringify(result).toLowerCase();
    let score = 0;
    for (const kw of priorityKeywords) {
      const kwLower = kw.toLowerCase().trim();
      if ((result['Style Category'] ?? '').toLowerCase().includes(kwLower)) score += 10;
      else if ((result.Keywords ?? '').toLowerCase().includes(kwLower)) score += 3;
      else if (resultStr.includes(kwLower)) score += 1;
    }
    return { score, result };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].score > 0 ? scored[0].result : results[0];
}

export function generateDesignSystem(query: string, projectName?: string): DesignSystem {
  const reasoningData = loadReasoning();

  // Step 1: Search product to get category
  const productResult = search(query, 'product', 1);
  const productResults = productResult.results;
  const category = productResults[0]?.['Product Type'] ?? 'General';

  // Step 2: Get reasoning rules
  const reasoning = applyReasoning(reasoningData, category);
  const stylePriority = reasoning.stylePriority;

  // Step 3: Multi-domain search with style priority
  const styleQuery = stylePriority.length > 0
    ? `${query} ${stylePriority.slice(0, 2).join(' ')}`
    : query;

  const styleResult = search(styleQuery, 'style', 3);
  const colorResult = search(query, 'color', 2);
  const typographyResult = search(query, 'typography', 2);
  const landingResult = search(query, 'landing', 2);

  // Step 4: Select best matches
  const bestStyle = selectBestMatch(styleResult.results, stylePriority);
  const bestColor = colorResult.results[0] ?? {};
  const bestTypography = typographyResult.results[0] ?? {};
  const bestLanding = landingResult.results[0] ?? {};

  // Step 5: Build final recommendation
  const styleEffects = bestStyle['Effects & Animation'] ?? '';
  const combinedEffects = styleEffects || reasoning.keyEffects;

  return {
    projectName: projectName ?? query.toUpperCase(),
    category,
    pattern: {
      name: bestLanding['Pattern Name'] ?? reasoning.pattern ?? 'Hero + Features + CTA',
      sections: bestLanding['Section Order'] ?? 'Hero > Features > CTA',
      ctaPlacement: bestLanding['Primary CTA Placement'] ?? 'Above fold',
      colorStrategy: bestLanding['Color Strategy'] ?? '',
      conversion: bestLanding['Conversion Optimization'] ?? '',
    },
    style: {
      name: bestStyle['Style Category'] ?? 'Minimalism',
      type: bestStyle.Type ?? 'General',
      effects: styleEffects,
      keywords: bestStyle.Keywords ?? '',
      bestFor: bestStyle['Best For'] ?? '',
      performance: bestStyle.Performance ?? '',
      accessibility: bestStyle.Accessibility ?? '',
      lightMode: bestStyle['Light Mode ✓'] ?? '',
      darkMode: bestStyle['Dark Mode ✓'] ?? '',
    },
    colors: {
      primary: bestColor.Primary ?? '#2563EB',
      onPrimary: bestColor['On Primary'] ?? '',
      secondary: bestColor.Secondary ?? '#3B82F6',
      accent: bestColor.Accent ?? '#F97316',
      background: bestColor.Background ?? '#F8FAFC',
      foreground: bestColor.Foreground ?? '#1E293B',
      muted: bestColor.Muted ?? '',
      border: bestColor.Border ?? '',
      destructive: bestColor.Destructive ?? '',
      ring: bestColor.Ring ?? '',
      notes: bestColor.Notes ?? '',
      cta: bestColor.Accent ?? '#F97316',
      text: bestColor.Foreground ?? '#1E293B',
    },
    typography: {
      heading: bestTypography['Heading Font'] ?? 'Inter',
      body: bestTypography['Body Font'] ?? 'Inter',
      mood: bestTypography['Mood/Style Keywords'] ?? reasoning.typographyMood ?? '',
      bestFor: bestTypography['Best For'] ?? '',
      googleFontsUrl: bestTypography['Google Fonts URL'] ?? '',
      cssImport: bestTypography['CSS Import'] ?? '',
    },
    keyEffects: combinedEffects,
    antiPatterns: reasoning.antiPatterns,
    decisionRules: reasoning.decisionRules,
    severity: reasoning.severity,
  };
}
