import { describe, it, expect } from 'vitest';
import { detectDomain, search, searchStack } from '../../../src/core/ui/search.js';
import { AVAILABLE_DOMAINS, AVAILABLE_STACKS } from '../../../src/core/ui/config.js';

describe('detectDomain', () => {
  it('detects color domain', () => {
    expect(detectDomain('color palette for SaaS')).toBe('color');
  });

  it('detects chart domain', () => {
    expect(detectDomain('bar chart visualization')).toBe('chart');
  });

  it('detects ux domain', () => {
    expect(detectDomain('accessibility keyboard navigation')).toBe('ux');
  });

  it('detects product domain', () => {
    expect(detectDomain('ecommerce dashboard fintech')).toBe('product');
  });

  it('detects style domain for style keywords', () => {
    expect(detectDomain('glassmorphism design')).toBe('style');
  });

  it('detects typography domain', () => {
    expect(detectDomain('font pairing heading font')).toBe('typography');
  });

  it('defaults to style for unknown queries', () => {
    expect(detectDomain('something random')).toBe('style');
  });
});

describe('search', () => {
  it('returns results for a valid query', () => {
    const result = search('minimalism clean', 'style', 3);
    expect(result.domain).toBe('style');
    expect(result.query).toBe('minimalism clean');
    expect(result.count).toBeGreaterThan(0);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('auto-detects domain when not specified', () => {
    const result = search('glassmorphism blur transparent');
    expect(result.domain).toBe('style');
    expect(result.count).toBeGreaterThan(0);
  });

  it('respects maxResults parameter', () => {
    const result = search('design', 'style', 1);
    expect(result.results.length).toBeLessThanOrEqual(1);
  });

  it('searches product domain', () => {
    const result = search('saas dashboard', 'product', 2);
    expect(result.domain).toBe('product');
    expect(result.file).toBe('products.csv');
  });

  it('searches color domain', () => {
    const result = search('fintech', 'color', 2);
    expect(result.domain).toBe('color');
    expect(result.file).toBe('colors.csv');
  });

  it('returns error for invalid file path', () => {
    const result = search('test', 'style', 3);
    // Should not error with real data files present
    expect(result.error).toBeUndefined();
  });
});

describe('searchStack', () => {
  it('returns results for a valid stack', () => {
    const result = searchStack('performance optimization', 'react', 3);
    expect(result.domain).toBe('stack');
    expect(result.stack).toBe('react');
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  it('returns error for unknown stack', () => {
    const result = searchStack('test', 'nonexistent', 3);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('Unknown stack');
  });
});

describe('config', () => {
  it('has expected domains', () => {
    expect(AVAILABLE_DOMAINS).toContain('style');
    expect(AVAILABLE_DOMAINS).toContain('color');
    expect(AVAILABLE_DOMAINS).toContain('typography');
    expect(AVAILABLE_DOMAINS).toContain('ux');
    expect(AVAILABLE_DOMAINS).toContain('chart');
    expect(AVAILABLE_DOMAINS).toContain('product');
    expect(AVAILABLE_DOMAINS.length).toBeGreaterThanOrEqual(10);
  });

  it('has expected stacks', () => {
    expect(AVAILABLE_STACKS).toContain('react');
    expect(AVAILABLE_STACKS).toContain('nextjs');
    expect(AVAILABLE_STACKS).toContain('vue');
    expect(AVAILABLE_STACKS).toContain('flutter');
    expect(AVAILABLE_STACKS.length).toBe(16);
  });
});
