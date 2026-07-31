/**
 * Design System Persistence
 *
 * Project foundation: flat `grspec/ui/MASTER.md`
 * Change pages: `ui/pages/<slug>.md` only (no change-level MASTER)
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { search } from './search.js';
import { parseUiArtifactStatus } from './ui-artifact.js';
import type { DesignSystem } from './design-system.js';

export interface PersistOptions {
  provisional?: boolean;
}

export interface PersistResult {
  status: string;
  designSystemDir: string;
  createdFiles: string[];
}

export function isChangeDirectory(dir: string): boolean {
  return existsSync(join(dir, '.grspec.yaml'));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

export function persistProjectFoundation(
  designSystem: DesignSystem,
  projectGrspecDir: string,
  page?: string,
): PersistResult {
  const uiDir = join(projectGrspecDir, 'ui');
  const pagesDir = join(uiDir, 'pages');
  const createdFiles: string[] = [];

  mkdirSync(uiDir, { recursive: true });

  const masterFile = join(uiDir, 'MASTER.md');
  writeFileSync(masterFile, formatMasterMd(designSystem), 'utf-8');
  createdFiles.push(masterFile);

  if (page) {
    mkdirSync(pagesDir, { recursive: true });
    const pageFile = join(pagesDir, `${slugify(page)}.md`);
    writeFileSync(pageFile, formatPageOverrideMd(designSystem, page), 'utf-8');
    createdFiles.push(pageFile);
  }

  return { status: 'success', designSystemDir: uiDir, createdFiles };
}

export function persistChangePage(
  designSystem: DesignSystem,
  page: string,
  changeDir: string,
  options?: PersistOptions,
): PersistResult {
  const pagesDir = join(changeDir, 'ui', 'pages');
  mkdirSync(pagesDir, { recursive: true });

  let provisional = options?.provisional;
  if (provisional === undefined) {
    provisional = parseUiArtifactStatus(join(changeDir, 'ui.md')) === 'blocked';
  }

  const pageFile = join(pagesDir, `${slugify(page)}.md`);
  writeFileSync(pageFile, formatPageOverrideMd(designSystem, page, { provisional }), 'utf-8');

  return {
    status: 'success',
    designSystemDir: join(changeDir, 'ui'),
    createdFiles: [pageFile],
  };
}

export function persistProjectPage(
  designSystem: DesignSystem,
  page: string,
  projectGrspecDir: string,
): PersistResult {
  const pagesDir = join(projectGrspecDir, 'ui', 'pages');
  mkdirSync(pagesDir, { recursive: true });

  const pageFile = join(pagesDir, `${slugify(page)}.md`);
  writeFileSync(pageFile, formatPageOverrideMd(designSystem, page), 'utf-8');

  return {
    status: 'success',
    designSystemDir: join(projectGrspecDir, 'ui'),
    createdFiles: [pageFile],
  };
}

/**
 * Routes persist output by target directory.
 * Project-level `design-system --persist` writes pages only (never MASTER).
 */
export function persistDesignSystem(
  designSystem: DesignSystem,
  page?: string,
  outputDir?: string,
): PersistResult {
  const baseDir = outputDir ?? process.cwd();

  if (isChangeDirectory(baseDir)) {
    const pageName = page ?? slugify(designSystem.projectName);
    return persistChangePage(designSystem, pageName, baseDir);
  }

  const grspecDir =
    baseDir.endsWith('grspec') || existsSync(join(baseDir, 'ui'))
      ? baseDir
      : join(baseDir, 'grspec');

  if (page) {
    return persistProjectPage(designSystem, page, grspecDir);
  }

  return {
    status: 'noop',
    designSystemDir: join(grspecDir, 'ui'),
    createdFiles: [],
  };
}

function formatMasterMd(ds: DesignSystem): string {
  const { projectName, category, style, colors, typography, keyEffects, antiPatterns, pattern } = ds;
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const lines: string[] = [];

  lines.push('# Design System Master File', '');
  lines.push('> **LOGIC:** When building a specific page, first check `ui/pages/[page-name].md` (change or project).');
  lines.push('> If that file exists, its rules **override** this Master file.');
  lines.push('> If not, strictly follow the rules below.', '');
  lines.push('---', '');
  lines.push(`**Project:** ${projectName}`);
  lines.push(`**Generated:** ${timestamp}`);
  lines.push(`**Category:** ${category}`, '');
  lines.push('---', '');

  lines.push('## Global Rules', '', '### Color Palette', '');
  lines.push('| Role | Hex | CSS Variable |');
  lines.push('|------|-----|--------------|');
  const colorEntries: [string, string, string][] = [
    ['Primary', colors.primary, '--color-primary'],
    ['On Primary', colors.onPrimary, '--color-on-primary'],
    ['Secondary', colors.secondary, '--color-secondary'],
    ['Accent/CTA', colors.accent, '--color-accent'],
    ['Background', colors.background, '--color-background'],
    ['Foreground', colors.foreground, '--color-foreground'],
    ['Muted', colors.muted, '--color-muted'],
    ['Border', colors.border, '--color-border'],
    ['Destructive', colors.destructive, '--color-destructive'],
    ['Ring', colors.ring, '--color-ring'],
  ];
  for (const [label, hex, cssVar] of colorEntries) {
    if (hex) lines.push(`| ${label} | \`${hex}\` | \`${cssVar}\` |`);
  }
  lines.push('');
  if (colors.notes) lines.push(`**Color Notes:** ${colors.notes}`, '');

  lines.push('### Typography', '');
  lines.push(`- **Heading Font:** ${typography.heading}`);
  lines.push(`- **Body Font:** ${typography.body}`);
  if (typography.mood) lines.push(`- **Mood:** ${typography.mood}`);
  if (typography.googleFontsUrl) {
    lines.push(`- **Google Fonts:** [${typography.heading} + ${typography.body}](${typography.googleFontsUrl})`);
  }
  lines.push('');
  if (typography.cssImport) {
    lines.push('**CSS Import:**', '```css', typography.cssImport, '```', '');
  }

  lines.push('### Spacing Variables', '');
  lines.push('| Token | Value | Usage |');
  lines.push('|-------|-------|-------|');
  lines.push('| `--space-xs` | `4px` / `0.25rem` | Tight gaps |');
  lines.push('| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |');
  lines.push('| `--space-md` | `16px` / `1rem` | Standard padding |');
  lines.push('| `--space-lg` | `24px` / `1.5rem` | Section padding |');
  lines.push('| `--space-xl` | `32px` / `2rem` | Large gaps |');
  lines.push('| `--space-2xl` | `48px` / `3rem` | Section margins |');
  lines.push('| `--space-3xl` | `64px` / `4rem` | Hero padding |');
  lines.push('');

  lines.push('### Shadow Depths', '');
  lines.push('| Level | Value | Usage |');
  lines.push('|-------|-------|-------|');
  lines.push('| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |');
  lines.push('| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |');
  lines.push('| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |');
  lines.push('| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |');
  lines.push('');

  lines.push('---', '', '## Component Specs', '');
  lines.push('### Buttons', '', '```css', '/* Primary Button */');
  lines.push(`.btn-primary {`);
  lines.push(`  background: ${colors.cta};`);
  lines.push('  color: white;');
  lines.push('  padding: 12px 24px;');
  lines.push('  border-radius: 8px;');
  lines.push('  font-weight: 600;');
  lines.push('  transition: all 200ms ease;');
  lines.push('  cursor: pointer;');
  lines.push('}', '');
  lines.push('.btn-primary:hover {');
  lines.push('  opacity: 0.9;');
  lines.push('  transform: translateY(-1px);');
  lines.push('}', '');
  lines.push('/* Secondary Button */');
  lines.push('.btn-secondary {');
  lines.push('  background: transparent;');
  lines.push(`  color: ${colors.primary};`);
  lines.push(`  border: 2px solid ${colors.primary};`);
  lines.push('  padding: 12px 24px;');
  lines.push('  border-radius: 8px;');
  lines.push('  font-weight: 600;');
  lines.push('  transition: all 200ms ease;');
  lines.push('  cursor: pointer;');
  lines.push('}', '```', '');

  lines.push('### Cards', '', '```css');
  lines.push('.card {');
  lines.push(`  background: ${colors.background};`);
  lines.push('  border-radius: 12px;');
  lines.push('  padding: 24px;');
  lines.push('  box-shadow: var(--shadow-md);');
  lines.push('  transition: all 200ms ease;');
  lines.push('  cursor: pointer;');
  lines.push('}', '');
  lines.push('.card:hover {');
  lines.push('  box-shadow: var(--shadow-lg);');
  lines.push('  transform: translateY(-2px);');
  lines.push('}', '```', '');

  lines.push('### Inputs', '', '```css');
  lines.push('.input {');
  lines.push('  padding: 12px 16px;');
  lines.push('  border: 1px solid #E2E8F0;');
  lines.push('  border-radius: 8px;');
  lines.push('  font-size: 16px;');
  lines.push('  transition: border-color 200ms ease;');
  lines.push('}', '');
  lines.push('.input:focus {');
  lines.push(`  border-color: ${colors.primary};`);
  lines.push('  outline: none;');
  lines.push(`  box-shadow: 0 0 0 3px ${colors.primary}20;`);
  lines.push('}', '```', '');

  lines.push('### Modals', '', '```css');
  lines.push('.modal-overlay {');
  lines.push('  background: rgba(0, 0, 0, 0.5);');
  lines.push('  backdrop-filter: blur(4px);');
  lines.push('}', '');
  lines.push('.modal {');
  lines.push('  background: white;');
  lines.push('  border-radius: 16px;');
  lines.push('  padding: 32px;');
  lines.push('  box-shadow: var(--shadow-xl);');
  lines.push('  max-width: 500px;');
  lines.push('  width: 90%;');
  lines.push('}', '```', '');

  lines.push('---', '', '## Style Guidelines', '');
  lines.push(`**Style:** ${style.name}`, '');
  if (style.keywords) lines.push(`**Keywords:** ${style.keywords}`, '');
  if (style.bestFor) lines.push(`**Best For:** ${style.bestFor}`, '');
  if (keyEffects) lines.push(`**Key Effects:** ${keyEffects}`, '');

  lines.push('### Page Pattern', '');
  lines.push(`**Pattern Name:** ${pattern.name}`, '');
  if (pattern.conversion) lines.push(`- **Conversion Strategy:** ${pattern.conversion}`);
  if (pattern.ctaPlacement) lines.push(`- **CTA Placement:** ${pattern.ctaPlacement}`);
  lines.push(`- **Section Order:** ${pattern.sections}`, '');

  lines.push('---', '', '## Anti-Patterns (Do NOT Use)', '');
  if (antiPatterns) {
    for (const anti of antiPatterns.split('+').map((a) => a.trim()).filter(Boolean)) {
      lines.push(`- \u274C ${anti}`);
    }
  }
  lines.push('', '### Additional Forbidden Patterns', '');
  lines.push('- \u274C **Emojis as icons** \u2014 Use SVG icons (Heroicons, Lucide, Simple Icons)');
  lines.push('- \u274C **Missing cursor:pointer** \u2014 All clickable elements must have cursor:pointer');
  lines.push('- \u274C **Layout-shifting hovers** \u2014 Avoid scale transforms that shift layout');
  lines.push('- \u274C **Low contrast text** \u2014 Maintain 4.5:1 minimum contrast ratio');
  lines.push('- \u274C **Instant state changes** \u2014 Always use transitions (150-300ms)');
  lines.push('- \u274C **Invisible focus states** \u2014 Focus states must be visible for a11y', '');

  lines.push('---', '', '## Pre-Delivery Checklist', '');
  lines.push('Before delivering any UI code, verify:', '');
  lines.push('- [ ] No emojis used as icons (use SVG instead)');
  lines.push('- [ ] All icons from consistent icon set (Heroicons/Lucide)');
  lines.push('- [ ] `cursor-pointer` on all clickable elements');
  lines.push('- [ ] Hover states with smooth transitions (150-300ms)');
  lines.push('- [ ] Light mode: text contrast 4.5:1 minimum');
  lines.push('- [ ] Focus states visible for keyboard navigation');
  lines.push('- [ ] `prefers-reduced-motion` respected');
  lines.push('- [ ] Responsive: 375px, 768px, 1024px, 1440px');
  lines.push('- [ ] No content hidden behind fixed navbars');
  lines.push('- [ ] No horizontal scroll on mobile', '');

  return lines.join('\n');
}

function detectPageType(context: string, styleResults?: Record<string, string>[]): string {
  const contextLower = context.toLowerCase();
  const patterns: [string[], string][] = [
    [['dashboard', 'admin', 'analytics', 'data', 'metrics', 'stats', 'monitor', 'overview'], 'Dashboard / Data View'],
    [['checkout', 'payment', 'cart', 'purchase', 'order', 'billing'], 'Checkout / Payment'],
    [['settings', 'profile', 'account', 'preferences', 'config'], 'Settings / Profile'],
    [['landing', 'marketing', 'homepage', 'hero', 'home', 'promo'], 'Landing / Marketing'],
    [['login', 'signin', 'signup', 'register', 'auth', 'password'], 'Authentication'],
    [['pricing', 'plans', 'subscription', 'tiers', 'packages'], 'Pricing / Plans'],
    [['blog', 'article', 'post', 'news', 'content', 'story'], 'Blog / Article'],
    [['product', 'item', 'detail', 'pdp', 'shop', 'store'], 'Product Detail'],
    [['search', 'results', 'browse', 'filter', 'catalog', 'list'], 'Search Results'],
    [['empty', '404', 'error', 'not found', 'zero'], 'Empty State'],
  ];

  for (const [keywords, pageType] of patterns) {
    if (keywords.some((kw) => contextLower.includes(kw))) return pageType;
  }

  if (styleResults && styleResults.length > 0) {
    const bestFor = (styleResults[0]['Best For'] ?? '').toLowerCase();
    if (['dashboard', 'data'].some((k) => bestFor.includes(k))) return 'Dashboard / Data View';
    if (['landing', 'marketing'].some((k) => bestFor.includes(k))) return 'Landing / Marketing';
  }

  return 'General';
}

interface PageOverrideFormatOptions {
  provisional?: boolean;
}

function formatPageOverrideMd(
  ds: DesignSystem,
  pageName: string,
  options?: PageOverrideFormatOptions,
): string {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const pageTitle = pageName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const combinedContext = pageName.toLowerCase();

  const styleResult = search(combinedContext, 'style', 1);
  const uxResult = search(combinedContext, 'ux', 3);
  const landingResult = search(combinedContext, 'landing', 1);

  const pageType = detectPageType(combinedContext, styleResult.results);

  const layout: Record<string, string> = {};
  const spacing: Record<string, string> = {};
  const typographyOverrides: Record<string, string> = {};
  const colorOverrides: Record<string, string> = {};
  const components: string[] = [];
  const uniqueComponents: string[] = [];
  const recommendations: string[] = [];

  if (styleResult.results.length > 0) {
    const s = styleResult.results[0];
    const keywords = (s.Keywords ?? '').toLowerCase();
    if (['data', 'dense', 'dashboard', 'grid'].some((k) => keywords.includes(k))) {
      layout['Max Width'] = '1400px or full-width';
      layout['Grid'] = '12-column grid for data flexibility';
      spacing['Content Density'] = 'High \u2014 optimize for information display';
    } else if (['minimal', 'simple', 'clean', 'single'].some((k) => keywords.includes(k))) {
      layout['Max Width'] = '800px (narrow, focused)';
      layout['Layout'] = 'Single column, centered';
      spacing['Content Density'] = 'Low \u2014 focus on clarity';
    } else {
      layout['Max Width'] = '1200px (standard)';
      layout['Layout'] = 'Full-width sections, centered content';
    }
    const effects = s['Effects & Animation'] ?? '';
    if (effects) recommendations.push(`Effects: ${effects}`);
  }

  for (const ux of uxResult.results) {
    const cat = ux.Category ?? '';
    if (ux.Do) recommendations.push(`${cat}: ${ux.Do}`);
    if (ux["Don't"]) components.push(`Avoid: ${ux["Don't"]}`);
  }

  if (landingResult.results.length > 0) {
    const l = landingResult.results[0];
    if (l['Section Order']) layout['Sections'] = l['Section Order'];
    if (l['Primary CTA Placement']) recommendations.push(`CTA Placement: ${l['Primary CTA Placement']}`);
    if (l['Color Strategy']) colorOverrides['Strategy'] = l['Color Strategy'];
  }

  if (Object.keys(layout).length === 0) {
    layout['Max Width'] = '1200px';
    layout['Layout'] = 'Responsive grid';
  }
  if (recommendations.length === 0) {
    recommendations.push('Refer to grspec/ui/MASTER.md for global design tokens', 'Add specific overrides as needed for this page');
  }

  const lines: string[] = [];

  if (options?.provisional) {
    lines.push('---', 'provisional: true', '---', '');
  }

  lines.push(`# ${pageTitle} Page Overrides`, '');
  lines.push(`> **PROJECT:** ${ds.projectName}`);
  lines.push(`> **Generated:** ${timestamp}`);
  lines.push(`> **Page Type:** ${pageType}`, '');
  lines.push('> \u26A0\uFE0F **IMPORTANT:** Rules in this file **override** project page files for this screen.');
  lines.push('> For global tokens, refer to `grspec/ui/MASTER.md`. Only deviations are documented here.', '');
  lines.push('---', '', '## Page-Specific Rules', '');

  lines.push('### Layout Overrides', '');
  for (const [k, v] of Object.entries(layout)) lines.push(`- **${k}:** ${v}`);
  lines.push('');

  lines.push('### Spacing Overrides', '');
  if (Object.keys(spacing).length > 0) {
    for (const [k, v] of Object.entries(spacing)) lines.push(`- **${k}:** ${v}`);
  } else {
    lines.push('- No overrides \u2014 use Master spacing');
  }
  lines.push('');

  lines.push('### Typography Overrides', '');
  if (Object.keys(typographyOverrides).length > 0) {
    for (const [k, v] of Object.entries(typographyOverrides)) lines.push(`- **${k}:** ${v}`);
  } else {
    lines.push('- No overrides \u2014 use Master typography');
  }
  lines.push('');

  lines.push('### Color Overrides', '');
  if (Object.keys(colorOverrides).length > 0) {
    for (const [k, v] of Object.entries(colorOverrides)) lines.push(`- **${k}:** ${v}`);
  } else {
    lines.push('- No overrides \u2014 use Master colors');
  }
  lines.push('');

  lines.push('### Component Overrides', '');
  if (components.length > 0) {
    for (const c of components) lines.push(`- ${c}`);
  } else {
    lines.push('- No overrides \u2014 use Master component specs');
  }
  lines.push('');

  lines.push('---', '', '## Page-Specific Components', '');
  if (uniqueComponents.length > 0) {
    for (const comp of uniqueComponents) lines.push(`- ${comp}`);
  } else {
    lines.push('- No unique components for this page');
  }
  lines.push('');

  lines.push('---', '', '## Recommendations', '');
  for (const r of recommendations) lines.push(`- ${r}`);
  lines.push('');

  return lines.join('\n');
}
