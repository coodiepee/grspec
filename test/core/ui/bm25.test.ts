import { describe, it, expect } from 'vitest';
import { BM25 } from '../../../src/core/ui/bm25.js';

describe('BM25', () => {
  describe('tokenize', () => {
    it('lowercases and splits text', () => {
      const bm25 = new BM25();
      expect(bm25.tokenize('Hello World Test')).toEqual(['hello', 'world', 'test']);
    });

    it('removes punctuation', () => {
      const bm25 = new BM25();
      expect(bm25.tokenize('hello, world! test.')).toEqual(['hello', 'world', 'test']);
    });

    it('filters short words (<=2 chars)', () => {
      const bm25 = new BM25();
      expect(bm25.tokenize('a to the big')).toEqual(['the', 'big']);
    });

    it('handles empty string', () => {
      const bm25 = new BM25();
      expect(bm25.tokenize('')).toEqual([]);
    });
  });

  describe('fit and score', () => {
    it('returns empty scores for empty corpus', () => {
      const bm25 = new BM25();
      bm25.fit([]);
      expect(bm25.score('test')).toEqual([]);
    });

    it('ranks matching documents higher', () => {
      const bm25 = new BM25();
      bm25.fit([
        'glassmorphism blur transparent overlay',
        'minimalism clean simple flat design',
        'brutalism bold harsh raw typography',
      ]);

      const results = bm25.score('minimalism clean');
      expect(results[0][0]).toBe(1); // index 1 should rank highest
      expect(results[0][1]).toBeGreaterThan(0);
    });

    it('returns zero score for non-matching query', () => {
      const bm25 = new BM25();
      bm25.fit(['hello world', 'foo bar']);
      const results = bm25.score('xyznonexistent');
      expect(results[0][1]).toBe(0);
      expect(results[1][1]).toBe(0);
    });

    it('handles single document corpus', () => {
      const bm25 = new BM25();
      bm25.fit(['dark mode high contrast elegant']);
      const results = bm25.score('dark mode');
      expect(results).toHaveLength(1);
      expect(results[0][1]).toBeGreaterThan(0);
    });

    it('respects term frequency in scoring', () => {
      const bm25 = new BM25();
      bm25.fit([
        'react react react performance optimization',
        'react vue angular svelte comparison',
      ]);
      const results = bm25.score('react');
      // Doc with higher TF for "react" should score higher
      expect(results[0][0]).toBe(0);
    });
  });
});
