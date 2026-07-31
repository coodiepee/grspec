import { describe, it, expect } from 'vitest';
import { generateDesignSystem } from '../../../src/core/ui/design-system.js';

describe('generateDesignSystem', () => {
  it('returns a complete design system for a valid query', () => {
    const ds = generateDesignSystem('SaaS dashboard analytics');
    expect(ds).toBeDefined();
    expect(ds.projectName).toBeDefined();
    expect(ds.category).toBeDefined();
    expect(ds.pattern).toBeDefined();
    expect(ds.style).toBeDefined();
    expect(ds.colors).toBeDefined();
    expect(ds.typography).toBeDefined();
  });

  it('uses custom project name when provided', () => {
    const ds = generateDesignSystem('fintech banking', 'FinApp');
    expect(ds.projectName).toBe('FinApp');
  });

  it('defaults project name to uppercase query', () => {
    const ds = generateDesignSystem('test query');
    expect(ds.projectName).toBe('TEST QUERY');
  });

  it('returns valid color hex codes', () => {
    const ds = generateDesignSystem('ecommerce luxury');
    expect(ds.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(ds.colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('returns non-empty typography', () => {
    const ds = generateDesignSystem('healthcare medical');
    expect(ds.typography.heading).toBeTruthy();
    expect(ds.typography.body).toBeTruthy();
  });

  it('returns pattern with sections', () => {
    const ds = generateDesignSystem('landing page saas');
    expect(ds.pattern.name).toBeTruthy();
    expect(ds.pattern.sections).toBeTruthy();
  });

  it('returns style with name', () => {
    const ds = generateDesignSystem('minimalism clean modern');
    expect(ds.style.name).toBeTruthy();
  });
});
