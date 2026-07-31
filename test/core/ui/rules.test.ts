import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadRules,
  filterByCategory,
  filterByPlatform,
  filterBySeverity,
  searchRules,
  formatChecklist,
  type Rule,
} from '../../../src/core/ui/rules.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_CSV = resolve(__dirname, '../../../assets/ui/data/rules.csv');

describe('rules', () => {
  let allRules: Rule[];

  beforeAll(() => {
    allRules = loadRules(RULES_CSV);
  });

  describe('loadRules', () => {
    it('loads all rules from CSV', () => {
      expect(allRules.length).toBeGreaterThan(100);
    });

    it('parses rule fields correctly', () => {
      const first = allRules[0];
      expect(first).toHaveProperty('Category');
      expect(first).toHaveProperty('RuleID');
      expect(first).toHaveProperty('Platform');
      expect(first).toHaveProperty('Severity');
      expect(first).toHaveProperty('Short');
      expect(first).toHaveProperty('Do');
      expect(first).toHaveProperty('Dont');
      expect(first).toHaveProperty('Reference');
    });

    it('first rule is color-contrast', () => {
      expect(allRules[0].RuleID).toBe('color-contrast');
      expect(allRules[0].Category).toBe('Accessibility');
      expect(allRules[0].Severity).toBe('CRITICAL');
    });
  });

  describe('filterByCategory', () => {
    it('returns only rules in the specified category', () => {
      const accessibilityRules = filterByCategory(allRules, 'Accessibility');
      expect(accessibilityRules.length).toBeGreaterThan(0);
      expect(accessibilityRules.every((r) => r.Category === 'Accessibility')).toBe(true);
    });

    it('is case-insensitive', () => {
      const rules = filterByCategory(allRules, 'accessibility');
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.Category === 'Accessibility')).toBe(true);
    });

    it('returns empty array for unknown category', () => {
      const rules = filterByCategory(allRules, 'nonexistent');
      expect(rules).toEqual([]);
    });
  });

  describe('filterByPlatform', () => {
    it('returns rules matching the platform', () => {
      const webRules = filterByPlatform(allRules, 'web');
      expect(webRules.length).toBeGreaterThan(0);
      expect(webRules.every((r) => r.Platform === 'web' || r.Platform === 'both')).toBe(true);
    });

    it('returns app-specific plus both rules', () => {
      const appRules = filterByPlatform(allRules, 'app');
      expect(appRules.length).toBeGreaterThan(0);
      expect(appRules.every((r) => r.Platform === 'app' || r.Platform === 'both')).toBe(true);
    });

    it('returns all rules when platform is both', () => {
      const bothRules = filterByPlatform(allRules, 'both');
      expect(bothRules.length).toBe(allRules.length);
    });
  });

  describe('filterBySeverity', () => {
    it('returns only CRITICAL rules', () => {
      const critical = filterBySeverity(allRules, 'CRITICAL');
      expect(critical.length).toBeGreaterThan(0);
      expect(critical.every((r) => r.Severity === 'CRITICAL')).toBe(true);
    });

    it('returns only HIGH rules', () => {
      const high = filterBySeverity(allRules, 'HIGH');
      expect(high.length).toBeGreaterThan(0);
      expect(high.every((r) => r.Severity === 'HIGH')).toBe(true);
    });

    it('is case-insensitive', () => {
      const medium = filterBySeverity(allRules, 'medium');
      expect(medium.length).toBeGreaterThan(0);
      expect(medium.every((r) => r.Severity === 'MEDIUM')).toBe(true);
    });

    it('supports comma-separated severity levels', () => {
      const results = filterBySeverity(allRules, 'CRITICAL,HIGH');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.Severity === 'CRITICAL' || r.Severity === 'HIGH')).toBe(true);
      const hasCritical = results.some((r) => r.Severity === 'CRITICAL');
      const hasHigh = results.some((r) => r.Severity === 'HIGH');
      expect(hasCritical).toBe(true);
      expect(hasHigh).toBe(true);
    });
  });

  describe('searchRules', () => {
    it('finds rules by keyword', () => {
      const results = searchRules(allRules, 'contrast');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].RuleID).toMatch(/contrast|color/);
    });

    it('returns empty for nonsense query', () => {
      const results = searchRules(allRules, 'xyznonexistent123');
      expect(results).toEqual([]);
    });

    it('ranks relevant results higher', () => {
      const results = searchRules(allRules, 'touch target size');
      expect(results[0].RuleID).toBe('touch-target-size');
    });
  });

  describe('formatChecklist', () => {
    it('formats rules as markdown checklist', () => {
      const subset = allRules.slice(0, 3);
      const output = formatChecklist(subset);
      expect(output).toContain('- [ ]');
      expect(output).toContain(subset[0].RuleID);
      expect(output).toContain(subset[0].Short);
    });

    it('includes platform and severity markers', () => {
      const subset = [allRules[0]];
      const output = formatChecklist(subset);
      expect(output).toContain('[CRITICAL]');
    });

    it('handles empty input', () => {
      const output = formatChecklist([]);
      expect(output).toBe('');
    });
  });
});
