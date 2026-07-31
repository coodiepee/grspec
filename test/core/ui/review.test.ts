import { describe, it, expect } from 'vitest';
import {
  checkCursorPointer,
  checkEmojiIcons,
  checkTransitionTiming,
  checkReducedMotion,
  aggregateFindings,
  type ReviewFinding,
} from '../../../src/core/ui/review.js';

describe('review', () => {
  describe('checkCursorPointer', () => {
    it('flags onClick without cursor-pointer', () => {
      const code = `<div onClick={handleClick} className="btn">Click me</div>`;
      const findings = checkCursorPointer(code, 'test.tsx');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('cursor-pointer');
    });

    it('passes when cursor-pointer is present', () => {
      const code = `<div onClick={handleClick} className="cursor-pointer btn">Click me</div>`;
      const findings = checkCursorPointer(code, 'test.tsx');
      expect(findings).toEqual([]);
    });

    it('passes for non-JSX files', () => {
      const code = `function handleClick() { return true; }`;
      const findings = checkCursorPointer(code, 'utils.ts');
      expect(findings).toEqual([]);
    });
  });

  describe('checkEmojiIcons', () => {
    it('flags emoji used as icon in JSX', () => {
      const code = `<span className="icon">🔔</span>`;
      const findings = checkEmojiIcons(code, 'nav.tsx');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('no-emoji-icons');
    });

    it('passes when no emoji in icon context', () => {
      const code = `<Icon name="bell" />`;
      const findings = checkEmojiIcons(code, 'nav.tsx');
      expect(findings).toEqual([]);
    });

    it('ignores emoji in text content (non-icon context)', () => {
      const code = `<p>Hello 👋 welcome back!</p>`;
      const findings = checkEmojiIcons(code, 'greeting.tsx');
      expect(findings).toEqual([]);
    });
  });

  describe('checkTransitionTiming', () => {
    it('flags transitions over 500ms', () => {
      const code = `transition: all 800ms ease;`;
      const findings = checkTransitionTiming(code, 'styles.css');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('duration-timing');
    });

    it('passes for transitions under 500ms', () => {
      const code = `transition: all 200ms ease;`;
      const findings = checkTransitionTiming(code, 'styles.css');
      expect(findings).toEqual([]);
    });

    it('flags duration class over 500', () => {
      const code = `className="duration-700"`;
      const findings = checkTransitionTiming(code, 'card.tsx');
      expect(findings.length).toBeGreaterThan(0);
    });

    it('passes duration class under 500', () => {
      const code = `className="duration-300"`;
      const findings = checkTransitionTiming(code, 'card.tsx');
      expect(findings).toEqual([]);
    });
  });

  describe('checkReducedMotion', () => {
    it('flags animation without reduced-motion check', () => {
      const code = `.animate { animation: spin 1s linear infinite; }`;
      const findings = checkReducedMotion(code, 'anim.css');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].ruleId).toBe('reduced-motion');
    });

    it('passes when prefers-reduced-motion is present', () => {
      const code = `
.animate { animation: spin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) { .animate { animation: none; } }
`;
      const findings = checkReducedMotion(code, 'anim.css');
      expect(findings).toEqual([]);
    });
  });

  describe('aggregateFindings', () => {
    it('groups findings by severity', () => {
      const findings: ReviewFinding[] = [
        { ruleId: 'cursor-pointer', severity: 'CRITICAL', message: 'Missing cursor-pointer', file: 'a.tsx', line: 1 },
        { ruleId: 'duration-timing', severity: 'MEDIUM', message: 'Slow transition', file: 'b.css', line: 5 },
        { ruleId: 'no-emoji-icons', severity: 'HIGH', message: 'Emoji as icon', file: 'c.tsx', line: 3 },
      ];
      const report = aggregateFindings(findings);
      expect(report.critical).toHaveLength(1);
      expect(report.high).toHaveLength(1);
      expect(report.medium).toHaveLength(1);
      expect(report.total).toBe(3);
    });

    it('handles empty findings', () => {
      const report = aggregateFindings([]);
      expect(report.total).toBe(0);
      expect(report.critical).toEqual([]);
    });
  });
});
