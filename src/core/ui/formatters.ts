/**
 * Design System Formatters
 *
 * ASCII box and Markdown output formatters for design system recommendations.
 */

import type { DesignSystem } from './design-system.js';

const BOX_WIDTH = 90;

function hexToAnsi(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '';
  const colorterm = process.env.COLORTERM ?? '';
  if (colorterm !== 'truecolor' && colorterm !== '24bit') return '';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `\x1b[38;2;${r};${g};${b}m██\x1b[0m `;
}

function ansiLjust(s: string, width: number): string {
  const visibleLen = s.replace(/\x1b\[[0-9;]*m/g, '').length;
  const pad = width - visibleLen;
  return s + ' '.repeat(Math.max(0, pad));
}

function sectionHeader(name: string, width: number): string {
  const label = `─── ${name} `;
  const fill = '─'.repeat(width - label.length - 1);
  return `├${label}${fill}┤`;
}

function wrapText(text: string, prefix: string, width: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = prefix;

  for (const word of words) {
    if (current.length + word.length + 1 <= width - 2) {
      current += (current === prefix ? '' : ' ') + word;
    } else {
      if (current !== prefix) lines.push(current);
      current = prefix + word;
    }
  }
  if (current !== prefix) lines.push(current);
  return lines;
}

export function formatAsciiBox(ds: DesignSystem): string {
  const { projectName, pattern, style, colors, typography, keyEffects, antiPatterns } = ds;
  const w = BOX_WIDTH - 1;
  const lines: string[] = [];

  // Header
  lines.push('╔' + '═'.repeat(w) + '╗');
  lines.push(ansiLjust(`║  TARGET: ${projectName} - RECOMMENDED DESIGN SYSTEM`, BOX_WIDTH) + '║');
  lines.push('╚' + '═'.repeat(w) + '╝');
  lines.push('┌' + '─'.repeat(w) + '┐');

  // Pattern
  lines.push(sectionHeader('PATTERN', BOX_WIDTH + 1));
  lines.push(`│  Name: ${pattern.name}`.padEnd(BOX_WIDTH) + '│');
  if (pattern.conversion) lines.push(`│     Conversion: ${pattern.conversion}`.padEnd(BOX_WIDTH) + '│');
  if (pattern.ctaPlacement) lines.push(`│     CTA: ${pattern.ctaPlacement}`.padEnd(BOX_WIDTH) + '│');
  lines.push('│     Sections:'.padEnd(BOX_WIDTH) + '│');
  const sections = pattern.sections.split('>').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < sections.length; i++) {
    lines.push(`│       ${i + 1}. ${sections[i]}`.padEnd(BOX_WIDTH) + '│');
  }

  // Style
  lines.push(sectionHeader('STYLE', BOX_WIDTH + 1));
  lines.push(`│  Name: ${style.name}`.padEnd(BOX_WIDTH) + '│');
  if (style.lightMode || style.darkMode) {
    lines.push(`│     Mode Support: Light ${style.lightMode}  Dark ${style.darkMode}`.padEnd(BOX_WIDTH) + '│');
  }
  if (style.keywords) {
    for (const l of wrapText(`Keywords: ${style.keywords}`, '│     ', BOX_WIDTH)) {
      lines.push(l.padEnd(BOX_WIDTH) + '│');
    }
  }
  if (style.bestFor) {
    for (const l of wrapText(`Best For: ${style.bestFor}`, '│     ', BOX_WIDTH)) {
      lines.push(l.padEnd(BOX_WIDTH) + '│');
    }
  }
  if (style.performance || style.accessibility) {
    lines.push(`│     Performance: ${style.performance} | Accessibility: ${style.accessibility}`.padEnd(BOX_WIDTH) + '│');
  }

  // Colors
  lines.push(sectionHeader('COLORS', BOX_WIDTH + 1));
  const colorEntries: [string, keyof typeof colors, string][] = [
    ['Primary', 'primary', '--color-primary'],
    ['On Primary', 'onPrimary', '--color-on-primary'],
    ['Secondary', 'secondary', '--color-secondary'],
    ['Accent/CTA', 'accent', '--color-accent'],
    ['Background', 'background', '--color-background'],
    ['Foreground', 'foreground', '--color-foreground'],
    ['Muted', 'muted', '--color-muted'],
    ['Border', 'border', '--color-border'],
    ['Destructive', 'destructive', '--color-destructive'],
    ['Ring', 'ring', '--color-ring'],
  ];
  for (const [label, key, cssVar] of colorEntries) {
    const hexVal = colors[key as keyof typeof colors];
    if (!hexVal) continue;
    const swatch = hexToAnsi(hexVal);
    const content = `│     ${swatch}${(label + ':').padEnd(14)} ${hexVal.padEnd(10)} (${cssVar})`;
    lines.push(ansiLjust(content, BOX_WIDTH) + '│');
  }
  if (colors.notes) {
    for (const l of wrapText(`Notes: ${colors.notes}`, '│     ', BOX_WIDTH)) {
      lines.push(l.padEnd(BOX_WIDTH) + '│');
    }
  }

  // Typography
  lines.push(sectionHeader('TYPOGRAPHY', BOX_WIDTH + 1));
  lines.push(`│  ${typography.heading} / ${typography.body}`.padEnd(BOX_WIDTH) + '│');
  if (typography.mood) {
    for (const l of wrapText(`Mood: ${typography.mood}`, '│     ', BOX_WIDTH)) {
      lines.push(l.padEnd(BOX_WIDTH) + '│');
    }
  }
  if (typography.bestFor) {
    for (const l of wrapText(`Best For: ${typography.bestFor}`, '│     ', BOX_WIDTH)) {
      lines.push(l.padEnd(BOX_WIDTH) + '│');
    }
  }
  if (typography.googleFontsUrl) {
    lines.push(`│     Google Fonts: ${typography.googleFontsUrl}`.padEnd(BOX_WIDTH) + '│');
  }
  if (typography.cssImport) {
    lines.push(`│     CSS Import: ${typography.cssImport.slice(0, 70)}...`.padEnd(BOX_WIDTH) + '│');
  }

  // Effects
  if (keyEffects) {
    lines.push(sectionHeader('KEY EFFECTS', BOX_WIDTH + 1));
    for (const l of wrapText(keyEffects, '│     ', BOX_WIDTH)) {
      lines.push(l.padEnd(BOX_WIDTH) + '│');
    }
  }

  // Anti-patterns
  if (antiPatterns) {
    lines.push(sectionHeader('AVOID', BOX_WIDTH + 1));
    for (const l of wrapText(antiPatterns, '│     ', BOX_WIDTH)) {
      lines.push(l.padEnd(BOX_WIDTH) + '│');
    }
  }

  // Pre-delivery checklist
  lines.push(sectionHeader('PRE-DELIVERY CHECKLIST', BOX_WIDTH + 1));
  const checklist = [
    '[ ] No emojis as icons (use SVG: Heroicons/Lucide)',
    '[ ] cursor-pointer on all clickable elements',
    '[ ] Hover states with smooth transitions (150-300ms)',
    '[ ] Light mode: text contrast 4.5:1 minimum',
    '[ ] Focus states visible for keyboard nav',
    '[ ] prefers-reduced-motion respected',
    '[ ] Responsive: 375px, 768px, 1024px, 1440px',
  ];
  for (const item of checklist) {
    lines.push(`│     ${item}`.padEnd(BOX_WIDTH) + '│');
  }

  lines.push('└' + '─'.repeat(w) + '┘');
  return lines.join('\n');
}

export function formatMarkdown(ds: DesignSystem): string {
  const { projectName, pattern, style, colors, typography, keyEffects, antiPatterns } = ds;
  const lines: string[] = [];

  lines.push(`## Design System: ${projectName}`, '');

  // Pattern
  lines.push('### Pattern');
  lines.push(`- **Name:** ${pattern.name}`);
  if (pattern.conversion) lines.push(`- **Conversion Focus:** ${pattern.conversion}`);
  if (pattern.ctaPlacement) lines.push(`- **CTA Placement:** ${pattern.ctaPlacement}`);
  if (pattern.colorStrategy) lines.push(`- **Color Strategy:** ${pattern.colorStrategy}`);
  lines.push(`- **Sections:** ${pattern.sections}`, '');

  // Style
  lines.push('### Style');
  lines.push(`- **Name:** ${style.name}`);
  if (style.lightMode || style.darkMode) lines.push(`- **Mode Support:** Light ${style.lightMode} | Dark ${style.darkMode}`);
  if (style.keywords) lines.push(`- **Keywords:** ${style.keywords}`);
  if (style.bestFor) lines.push(`- **Best For:** ${style.bestFor}`);
  if (style.performance || style.accessibility) {
    lines.push(`- **Performance:** ${style.performance} | **Accessibility:** ${style.accessibility}`);
  }
  lines.push('');

  // Colors
  lines.push('### Colors');
  lines.push('| Role | Hex | CSS Variable |');
  lines.push('|------|-----|--------------|');
  const mdColorEntries: [string, keyof typeof colors, string][] = [
    ['Primary', 'primary', '--color-primary'],
    ['On Primary', 'onPrimary', '--color-on-primary'],
    ['Secondary', 'secondary', '--color-secondary'],
    ['Accent/CTA', 'accent', '--color-accent'],
    ['Background', 'background', '--color-background'],
    ['Foreground', 'foreground', '--color-foreground'],
    ['Muted', 'muted', '--color-muted'],
    ['Border', 'border', '--color-border'],
    ['Destructive', 'destructive', '--color-destructive'],
    ['Ring', 'ring', '--color-ring'],
  ];
  for (const [label, key, cssVar] of mdColorEntries) {
    const hexVal = colors[key as keyof typeof colors];
    if (hexVal) lines.push(`| ${label} | \`${hexVal}\` | \`${cssVar}\` |`);
  }
  if (colors.notes) lines.push(`\n*Notes: ${colors.notes}*`);
  lines.push('');

  // Typography
  lines.push('### Typography');
  lines.push(`- **Heading:** ${typography.heading}`);
  lines.push(`- **Body:** ${typography.body}`);
  if (typography.mood) lines.push(`- **Mood:** ${typography.mood}`);
  if (typography.bestFor) lines.push(`- **Best For:** ${typography.bestFor}`);
  if (typography.googleFontsUrl) lines.push(`- **Google Fonts:** ${typography.googleFontsUrl}`);
  if (typography.cssImport) {
    lines.push('- **CSS Import:**', '```css', typography.cssImport, '```');
  }
  lines.push('');

  // Effects
  if (keyEffects) lines.push('### Key Effects', keyEffects, '');

  // Anti-patterns
  if (antiPatterns) {
    lines.push('### Avoid (Anti-patterns)');
    lines.push('- ' + antiPatterns.replace(/ \+ /g, '\n- '), '');
  }

  // Pre-delivery checklist
  lines.push('### Pre-Delivery Checklist');
  lines.push('- [ ] No emojis as icons (use SVG: Heroicons/Lucide)');
  lines.push('- [ ] cursor-pointer on all clickable elements');
  lines.push('- [ ] Hover states with smooth transitions (150-300ms)');
  lines.push('- [ ] Light mode: text contrast 4.5:1 minimum');
  lines.push('- [ ] Focus states visible for keyboard nav');
  lines.push('- [ ] prefers-reduced-motion respected');
  lines.push('- [ ] Responsive: 375px, 768px, 1024px, 1440px');
  lines.push('');

  return lines.join('\n');
}
