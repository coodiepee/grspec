/**
 * UI Content Detection
 *
 * Detects UI-related content in text by scanning for curated keywords.
 * Used by the workflow integration to enrich design and apply instructions
 * when a change involves UI work.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface UiDetectionResult {
  detected: boolean;
  keywords: string[];
}

const UI_KEYWORDS: string[] = [
  'color',
  'palette',
  'style',
  'ui',
  'layout',
  'font',
  'typography',
  'component',
  'responsive',
  'animation',
  'dark mode',
  'landing',
  'dashboard',
  'icon',
  'accessibility',
  'wcag',
  'chart',
  'visualization',
  'glassmorphism',
  'neumorphism',
  'brutalism',
  'minimalism',
  'tailwind',
  'css',
];

export function detectUiContent(text: string): UiDetectionResult {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const keyword of UI_KEYWORDS) {
    if (lower.includes(keyword)) {
      matched.push(keyword);
    }
  }

  return {
    detected: matched.length >= 3,
    keywords: matched,
  };
}

export function detectUiContentInChange(changeDir: string): UiDetectionResult {
  const filesToScan = ['proposal.md', 'design.md'];
  const parts: string[] = [];

  for (const file of filesToScan) {
    const filePath = path.join(changeDir, file);
    try {
      parts.push(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      // file doesn't exist, skip
    }
  }

  if (parts.length === 0) {
    return { detected: false, keywords: [] };
  }

  return detectUiContent(parts.join('\n'));
}
