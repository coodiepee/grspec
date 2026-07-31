/**
 * UI Review — Static Analysis
 *
 * Performs regex-based static checks against UI/UX rules.
 * Covers cursor-pointer, emoji-as-icon, transition timing, and reduced-motion.
 */

export interface ReviewFinding {
  ruleId: string;
  severity: string;
  message: string;
  file: string;
  line: number;
}

export interface ReviewReport {
  critical: ReviewFinding[];
  high: ReviewFinding[];
  medium: ReviewFinding[];
  low: ReviewFinding[];
  total: number;
}

const JSX_EXTENSIONS = /\.(tsx|jsx)$/;
const STYLE_EXTENSIONS = /\.(css|scss|less|tsx|jsx|vue|svelte)$/;

export function checkCursorPointer(code: string, filename: string): ReviewFinding[] {
  if (!JSX_EXTENSIONS.test(filename)) return [];

  const findings: ReviewFinding[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/onClick\s*[={]/.test(line) && !line.includes('cursor-pointer')) {
      findings.push({
        ruleId: 'cursor-pointer',
        severity: 'CRITICAL',
        message: 'Clickable element missing cursor-pointer class',
        file: filename,
        line: i + 1,
      });
    }
  }

  return findings;
}

export function checkEmojiIcons(code: string, filename: string): ReviewFinding[] {
  if (!JSX_EXTENSIONS.test(filename)) return [];

  const findings: ReviewFinding[] = [];
  const lines = code.split('\n');

  const emojiInIconContext =
    /(?:className\s*=\s*["'][^"']*icon[^"']*["']|<(?:span|i|div)[^>]*(?:icon|btn-icon))[^>]*>[\s]*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  for (let i = 0; i < lines.length; i++) {
    if (emojiInIconContext.test(lines[i])) {
      findings.push({
        ruleId: 'no-emoji-icons',
        severity: 'HIGH',
        message: 'Emoji used as icon — use SVG icon library instead',
        file: filename,
        line: i + 1,
      });
    }
  }

  return findings;
}

export function checkTransitionTiming(code: string, filename: string): ReviewFinding[] {
  if (!STYLE_EXTENSIONS.test(filename)) return [];

  const findings: ReviewFinding[] = [];
  const lines = code.split('\n');

  const cssTimingRegex = /transition[^;]*?(\d+)ms/;
  const tailwindDurationRegex = /duration-(\d+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const cssMatch = cssTimingRegex.exec(line);
    if (cssMatch && parseInt(cssMatch[1], 10) > 500) {
      findings.push({
        ruleId: 'duration-timing',
        severity: 'MEDIUM',
        message: `Transition ${cssMatch[1]}ms exceeds recommended 500ms max`,
        file: filename,
        line: i + 1,
      });
    }

    const twMatch = tailwindDurationRegex.exec(line);
    if (twMatch && parseInt(twMatch[1], 10) > 500) {
      findings.push({
        ruleId: 'duration-timing',
        severity: 'MEDIUM',
        message: `Tailwind duration-${twMatch[1]} exceeds recommended 500ms max`,
        file: filename,
        line: i + 1,
      });
    }
  }

  return findings;
}

export function checkReducedMotion(code: string, filename: string): ReviewFinding[] {
  if (!STYLE_EXTENSIONS.test(filename)) return [];

  const hasAnimation = /animation\s*:/i.test(code);
  if (!hasAnimation) return [];

  const hasReducedMotion = /prefers-reduced-motion/.test(code);
  if (hasReducedMotion) return [];

  const findings: ReviewFinding[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (/animation\s*:/.test(lines[i])) {
      findings.push({
        ruleId: 'reduced-motion',
        severity: 'CRITICAL',
        message: 'Animation used without prefers-reduced-motion media query',
        file: filename,
        line: i + 1,
      });
      break;
    }
  }

  return findings;
}

export function aggregateFindings(findings: ReviewFinding[]): ReviewReport {
  return {
    critical: findings.filter((f) => f.severity === 'CRITICAL'),
    high: findings.filter((f) => f.severity === 'HIGH'),
    medium: findings.filter((f) => f.severity === 'MEDIUM'),
    low: findings.filter((f) => f.severity === 'LOW'),
    total: findings.length,
  };
}
