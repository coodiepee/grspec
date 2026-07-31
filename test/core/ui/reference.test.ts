import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  parseDesignCsv,
  listStyles,
  getStyleSpec,
  searchStyles,
  type StyleBlock,
} from '../../../src/core/ui/reference.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DESIGN_CSV = resolve(__dirname, '../../../assets/ui/data/design.csv');
const STYLES_CSV = resolve(__dirname, '../../../assets/ui/data/styles.csv');

describe('reference', () => {
  let blocks: StyleBlock[];

  beforeAll(() => {
    blocks = parseDesignCsv(DESIGN_CSV);
  });

  describe('parseDesignCsv', () => {
    it('parses design.csv into style blocks', () => {
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('each block has name and content', () => {
      for (const block of blocks) {
        expect(block.name).toBeTruthy();
        expect(block.content).toBeTruthy();
      }
    });

    it('first block is Bauhaus', () => {
      expect(blocks[0].name).toContain('Bauhaus');
    });

    it('extracts description from block', () => {
      expect(blocks[0].description).toBeTruthy();
      expect(blocks[0].description.length).toBeGreaterThan(10);
    });
  });

  describe('listStyles', () => {
    it('returns style names from styles.csv', () => {
      const styles = listStyles(STYLES_CSV);
      expect(styles.length).toBeGreaterThan(50);
    });

    it('each style has name and category', () => {
      const styles = listStyles(STYLES_CSV);
      for (const s of styles) {
        expect(s.name).toBeTruthy();
        expect(s.category).toBeTruthy();
      }
    });
  });

  describe('getStyleSpec', () => {
    it('returns full spec for a known style', () => {
      const spec = getStyleSpec(blocks, 'Bauhaus');
      expect(spec).not.toBeNull();
      expect(spec!.content).toContain('Design Philosophy');
    });

    it('is case-insensitive', () => {
      const spec = getStyleSpec(blocks, 'bauhaus');
      expect(spec).not.toBeNull();
    });

    it('returns null for unknown style', () => {
      const spec = getStyleSpec(blocks, 'nonexistent-style-xyz');
      expect(spec).toBeNull();
    });

    it('handles partial match', () => {
      const spec = getStyleSpec(blocks, 'Monochrome');
      expect(spec).not.toBeNull();
    });
  });

  describe('searchStyles', () => {
    it('finds styles by keyword', () => {
      const results = searchStyles(blocks, 'geometric');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty for nonsense query', () => {
      const results = searchStyles(blocks, 'xyznonexistent123abc');
      expect(results).toEqual([]);
    });

    it('ranks relevant results higher', () => {
      const results = searchStyles(blocks, 'black white monochrome');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Monochrome');
    });
  });
});
