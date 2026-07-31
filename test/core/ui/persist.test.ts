import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  persistDesignSystem,
  persistProjectFoundation,
  persistChangePage,
  isChangeDirectory,
} from '../../../src/core/ui/persist.js';
import { generateDesignSystem } from '../../../src/core/ui/design-system.js';

describe('persist', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `persist-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('persistProjectFoundation', () => {
    it('creates flat grspec/ui/MASTER.md', () => {
      const ds = generateDesignSystem('SaaS dashboard', 'TestProject');
      const result = persistProjectFoundation(ds, tempDir);

      expect(result.status).toBe('success');
      expect(result.createdFiles).toHaveLength(1);
      expect(existsSync(join(tempDir, 'ui', 'MASTER.md'))).toBe(true);
    });

    it('creates optional project page under grspec/ui/pages/', () => {
      const ds = generateDesignSystem('SaaS dashboard', 'TestProject');
      const result = persistProjectFoundation(ds, tempDir, 'dashboard');

      expect(result.createdFiles).toHaveLength(2);
      expect(existsSync(join(tempDir, 'ui', 'pages', 'dashboard.md'))).toBe(true);
    });
  });

  describe('persistChangePage', () => {
    it('writes ui/pages only under change directory', () => {
      const changeDir = join(tempDir, 'change');
      mkdirSync(changeDir, { recursive: true });
      writeFileSync(join(changeDir, '.grspec.yaml'), 'schema: spec-driven\n');

      const ds = generateDesignSystem('billing', 'App');
      const result = persistChangePage(ds, 'billing-settings', changeDir);

      expect(result.createdFiles).toHaveLength(1);
      expect(existsSync(join(changeDir, 'ui', 'pages', 'billing-settings.md'))).toBe(true);
      expect(existsSync(join(changeDir, 'ui', 'MASTER.md'))).toBe(false);
    });

    it('adds provisional frontmatter when ui.md is blocked', () => {
      const changeDir = join(tempDir, 'change-blocked');
      mkdirSync(changeDir, { recursive: true });
      writeFileSync(join(changeDir, '.grspec.yaml'), 'schema: spec-driven\n');
      writeFileSync(join(changeDir, 'ui.md'), '## Status\n\nblocked\n');

      const ds = generateDesignSystem('billing', 'App');
      persistChangePage(ds, 'billing', changeDir);
      const content = readFileSync(join(changeDir, 'ui', 'pages', 'billing.md'), 'utf-8');
      expect(content).toContain('provisional: true');
    });
  });

  describe('persistDesignSystem routing', () => {
    it('routes change directory to page-only persist', () => {
      const changeDir = join(tempDir, 'routed-change');
      mkdirSync(changeDir, { recursive: true });
      writeFileSync(join(changeDir, '.grspec.yaml'), 'schema: spec-driven\n');

      const ds = generateDesignSystem('SaaS', 'My App');
      persistDesignSystem(ds, 'dashboard', changeDir);

      expect(isChangeDirectory(changeDir)).toBe(true);
      expect(existsSync(join(changeDir, 'ui', 'pages', 'dashboard.md'))).toBe(true);
    });

    it('does not write project MASTER from design-system --persist without init', () => {
      const ds = generateDesignSystem('SaaS', 'App');
      const result = persistDesignSystem(ds, undefined, tempDir);

      expect(result.status).toBe('noop');
      expect(result.createdFiles).toHaveLength(0);
      expect(existsSync(join(tempDir, 'ui', 'MASTER.md'))).toBe(false);
    });

    it('writes project page when page is specified', () => {
      const grspecDir = join(tempDir, 'grspec');
      mkdirSync(grspecDir, { recursive: true });
      const ds = generateDesignSystem('SaaS', 'App');
      persistDesignSystem(ds, 'settings', grspecDir);
      expect(existsSync(join(grspecDir, 'ui', 'pages', 'settings.md'))).toBe(true);
    });
  });

  describe('MASTER.md content', () => {
    it('contains required sections', () => {
      const ds = generateDesignSystem('SaaS dashboard', 'TestProject');
      persistProjectFoundation(ds, tempDir);
      const content = readFileSync(join(tempDir, 'ui', 'MASTER.md'), 'utf-8');

      expect(content).toContain('# Design System Master File');
      expect(content).toContain('**Project:** TestProject');
      expect(content).toContain('## Global Rules');
      expect(content).toContain('### Color Palette');
      expect(content).toContain('## Pre-Delivery Checklist');
    });

    it('references ui/pages override path', () => {
      const ds = generateDesignSystem('SaaS', 'App');
      persistProjectFoundation(ds, tempDir);
      const content = readFileSync(join(tempDir, 'ui', 'MASTER.md'), 'utf-8');
      expect(content).toContain('ui/pages/[page-name].md');
    });
  });

  describe('page override content', () => {
    it('contains required page override sections', () => {
      const ds = generateDesignSystem('SaaS', 'App');
      persistProjectFoundation(ds, tempDir, 'dashboard');
      const content = readFileSync(join(tempDir, 'ui', 'pages', 'dashboard.md'), 'utf-8');

      expect(content).toContain('# Dashboard Page Overrides');
      expect(content).toContain('grspec/ui/MASTER.md');
      expect(content).toContain('### Layout Overrides');
    });
  });
});
