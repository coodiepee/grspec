import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseCsvLine, loadCsv, getDataDir } from '../../../src/core/ui/csv-loader.js';

describe('csv-loader', () => {
  describe('parseCsvLine', () => {
    it('parses simple comma-separated values', () => {
      expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('handles quoted fields', () => {
      expect(parseCsvLine('"hello world",foo,bar')).toEqual(['hello world', 'foo', 'bar']);
    });

    it('handles escaped quotes within quoted fields', () => {
      expect(parseCsvLine('"say ""hello""",foo')).toEqual(['say "hello"', 'foo']);
    });

    it('handles commas within quoted fields', () => {
      expect(parseCsvLine('"a,b",c,d')).toEqual(['a,b', 'c', 'd']);
    });

    it('handles empty fields', () => {
      expect(parseCsvLine('a,,c')).toEqual(['a', '', 'c']);
    });

    it('handles single field', () => {
      expect(parseCsvLine('hello')).toEqual(['hello']);
    });

    it('handles empty line', () => {
      expect(parseCsvLine('')).toEqual(['']);
    });
  });

  describe('loadCsv', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = join(tmpdir(), `csv-test-${Date.now()}`);
      mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    it('loads CSV with headers and rows', () => {
      const csvContent = 'Name,Value,Category\nAlpha,100,A\nBeta,200,B';
      writeFileSync(join(tempDir, 'test.csv'), csvContent, 'utf-8');

      const rows = loadCsv(join(tempDir, 'test.csv'));
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({ Name: 'Alpha', Value: '100', Category: 'A' });
      expect(rows[1]).toEqual({ Name: 'Beta', Value: '200', Category: 'B' });
    });

    it('handles CSV with quoted fields', () => {
      const csvContent = 'Name,Description\nFoo,"A complex, quoted field"\nBar,"Say ""hi""!"';
      writeFileSync(join(tempDir, 'quoted.csv'), csvContent, 'utf-8');

      const rows = loadCsv(join(tempDir, 'quoted.csv'));
      expect(rows).toHaveLength(2);
      expect(rows[0].Description).toBe('A complex, quoted field');
      expect(rows[1].Description).toBe('Say "hi"!');
    });

    it('returns empty array for header-only CSV', () => {
      writeFileSync(join(tempDir, 'empty.csv'), 'A,B,C\n', 'utf-8');
      const rows = loadCsv(join(tempDir, 'empty.csv'));
      expect(rows).toEqual([]);
    });

    it('returns empty array for empty file', () => {
      writeFileSync(join(tempDir, 'blank.csv'), '', 'utf-8');
      const rows = loadCsv(join(tempDir, 'blank.csv'));
      expect(rows).toEqual([]);
    });

    it('handles CRLF line endings', () => {
      const csvContent = 'Name,Value\r\nAlpha,100\r\nBeta,200';
      writeFileSync(join(tempDir, 'crlf.csv'), csvContent, 'utf-8');

      const rows = loadCsv(join(tempDir, 'crlf.csv'));
      expect(rows).toHaveLength(2);
      expect(rows[0].Name).toBe('Alpha');
    });

    it('handles missing column values', () => {
      const csvContent = 'A,B,C\nonly_a';
      writeFileSync(join(tempDir, 'short.csv'), csvContent, 'utf-8');

      const rows = loadCsv(join(tempDir, 'short.csv'));
      expect(rows).toHaveLength(1);
      expect(rows[0].A).toBe('only_a');
      expect(rows[0].B).toBe('');
    });
  });

  describe('getDataDir', () => {
    it('returns a path that ends with assets/ui/data', () => {
      const dir = getDataDir();
      expect(dir).toMatch(/assets[/\\]ui[/\\]data$/);
    });
  });
});
