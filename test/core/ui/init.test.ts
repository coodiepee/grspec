import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  detectProjectStack,
  assembleInitQuery,
  checkExistingDesignSystem,
  generateRulesChecklist,
} from '../../../src/core/ui/init.js';

describe('detectProjectStack', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(import.meta.dirname, '..', '..', 'fixtures', 'tmp-ui-init');
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('extracts project name from package.json', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'my-cool-app',
      dependencies: {},
    }));

    const result = detectProjectStack(tempDir);
    expect(result.projectName).toBe('my-cool-app');
  });

  it('detects react in dependencies', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'test',
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
    }));

    const result = detectProjectStack(tempDir);
    expect(result.detectedStacks).toContain('react');
  });

  it('prefers more specific framework over generic react', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'test',
      dependencies: { react: '^18.0.0', next: '^14.0.0' },
    }));

    const result = detectProjectStack(tempDir);
    expect(result.primaryStack).toBe('nextjs');
  });

  it('detects stack from devDependencies', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'test',
      devDependencies: { svelte: '^4.0.0' },
    }));

    const result = detectProjectStack(tempDir);
    expect(result.detectedStacks).toContain('svelte');
  });

  it('returns null projectName when no package.json exists', () => {
    const result = detectProjectStack(tempDir);
    expect(result.projectName).toBeNull();
    expect(result.detectedStacks).toEqual([]);
  });

  it('returns null projectName when package.json has no name field', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      dependencies: { vue: '^3.0.0' },
    }));

    const result = detectProjectStack(tempDir);
    expect(result.projectName).toBeNull();
    expect(result.detectedStacks).toContain('vue');
  });

  it('detects vue framework', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'vue-app',
      dependencies: { vue: '^3.0.0' },
    }));

    const result = detectProjectStack(tempDir);
    expect(result.detectedStacks).toContain('vue');
    expect(result.primaryStack).toBe('vue');
  });

  it('detects nuxt over vue when both present', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'nuxt-app',
      dependencies: { vue: '^3.0.0', nuxt: '^3.0.0' },
    }));

    const result = detectProjectStack(tempDir);
    expect(result.primaryStack).toBe('nuxtjs');
  });

  it('detects angular framework', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'ng-app',
      dependencies: { '@angular/core': '^17.0.0' },
    }));

    const result = detectProjectStack(tempDir);
    expect(result.detectedStacks).toContain('angular');
  });

  it('returns empty stacks when no recognized packages found', () => {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'cli-tool',
      dependencies: { commander: '^11.0.0', chalk: '^5.0.0' },
    }));

    const result = detectProjectStack(tempDir);
    expect(result.detectedStacks).toEqual([]);
    expect(result.primaryStack).toBeNull();
  });
});

describe('assembleInitQuery', () => {
  it('assembles query from type only', () => {
    const query = assembleInitQuery({ type: 'saas' });
    expect(query).toBe('saas');
  });

  it('assembles query from type and style', () => {
    const query = assembleInitQuery({ type: 'devtool', style: 'minimal dark' });
    expect(query).toBe('devtool minimal dark');
  });

  it('assembles query from type, style, and stack', () => {
    const query = assembleInitQuery({ type: 'saas', style: 'modern', stack: 'react' });
    expect(query).toBe('saas modern react');
  });

  it('skips empty or undefined fields', () => {
    const query = assembleInitQuery({ type: 'ecommerce', style: '', stack: undefined });
    expect(query).toBe('ecommerce');
  });

  it('trims whitespace from components', () => {
    const query = assembleInitQuery({ type: '  saas  ', style: ' clean ' });
    expect(query).toBe('saas clean');
  });
});

describe('checkExistingDesignSystem', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(import.meta.dirname, '..', '..', 'fixtures', 'tmp-ui-init-check');
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns null when no ui directory exists', () => {
    const result = checkExistingDesignSystem(tempDir);
    expect(result).toBeNull();
  });

  it('returns null when ui exists but has no MASTER.md', () => {
    mkdirSync(join(tempDir, 'ui'), { recursive: true });
    const result = checkExistingDesignSystem(tempDir);
    expect(result).toBeNull();
  });

  it('returns info when grspec/ui/MASTER.md exists', () => {
    const uiDir = join(tempDir, 'ui');
    mkdirSync(uiDir, { recursive: true });
    writeFileSync(join(uiDir, 'MASTER.md'), '# Design System Master File\n\n**Style:** Minimalism\n');

    const result = checkExistingDesignSystem(tempDir);
    expect(result).not.toBeNull();
    expect(result!.style).toBe('Minimalism');
    expect(result!.path).toContain('ui');
  });

  it('returns "Unknown" style when MASTER.md has no style heading', () => {
    const uiDir = join(tempDir, 'ui');
    mkdirSync(uiDir, { recursive: true });
    writeFileSync(join(uiDir, 'MASTER.md'), '# Design System Master File\n');

    const result = checkExistingDesignSystem(tempDir);
    expect(result).not.toBeNull();
    expect(result!.style).toBe('Unknown');
  });
});

describe('generateRulesChecklist', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(import.meta.dirname, '..', '..', 'fixtures', 'tmp-ui-init-rules');
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('generates a markdown checklist file', () => {
    const outputPath = join(tempDir, 'RULES-CHECKLIST.md');
    generateRulesChecklist(outputPath, 'web');

    expect(existsSync(outputPath)).toBe(true);
  });

  it('generates non-empty content', () => {
    const outputPath = join(tempDir, 'RULES-CHECKLIST.md');
    generateRulesChecklist(outputPath, 'web');

    const { readFileSync } = require('fs');
    const content = readFileSync(outputPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('- [ ]');
  });

  it('filters rules by platform', () => {
    const webPath = join(tempDir, 'web.md');
    const appPath = join(tempDir, 'app.md');

    generateRulesChecklist(webPath, 'web');
    generateRulesChecklist(appPath, 'app');

    const { readFileSync } = require('fs');
    const webContent = readFileSync(webPath, 'utf-8');
    const appContent = readFileSync(appPath, 'utf-8');

    expect(webContent).not.toBe(appContent);
  });
});
