/**
 * UI Init Module
 *
 * Auto-detects project stack and name from package.json,
 * assembles design system queries from structured parameters,
 * and guards against overwriting existing design systems.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { AVAILABLE_STACKS } from './config.js';
import { loadRules, filterByPlatform, formatChecklist } from './rules.js';

const PACKAGE_TO_STACK: Record<string, string> = {
  react: 'react',
  next: 'nextjs',
  nuxt: 'nuxtjs',
  vue: 'vue',
  svelte: 'svelte',
  astro: 'astro',
  '@angular/core': 'angular',
  'react-native': 'react-native',
  flutter: 'flutter',
  'nuxt-ui': 'nuxt-ui',
  '@shadcn/ui': 'shadcn',
  three: 'threejs',
  laravel: 'laravel',
  '@jetpack-compose/core': 'jetpack-compose',
};

const FRAMEWORK_SPECIFICITY: Record<string, number> = {
  nextjs: 3,
  nuxtjs: 3,
  'nuxt-ui': 4,
  shadcn: 4,
  'react-native': 3,
  angular: 2,
  svelte: 2,
  astro: 2,
  vue: 1,
  react: 1,
  flutter: 2,
  threejs: 2,
  laravel: 2,
  'jetpack-compose': 2,
  'html-tailwind': 1,
};

export interface DetectedStack {
  projectName: string | null;
  detectedStacks: string[];
  primaryStack: string | null;
}

export interface InitQueryOptions {
  type: string;
  style?: string;
  stack?: string;
}

export interface ExistingDesignSystemInfo {
  style: string;
  path: string;
}

export function detectProjectStack(projectRoot: string): DetectedStack {
  const packageJsonPath = join(projectRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return { projectName: null, detectedStacks: [], primaryStack: null };
  }

  let packageJson: Record<string, unknown>;
  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  } catch {
    return { projectName: null, detectedStacks: [], primaryStack: null };
  }

  const projectName = typeof packageJson.name === 'string' ? packageJson.name : null;

  const allDeps: Record<string, string> = {
    ...((packageJson.dependencies as Record<string, string>) ?? {}),
    ...((packageJson.devDependencies as Record<string, string>) ?? {}),
  };

  const detectedStacks: string[] = [];
  for (const [packageName, stackName] of Object.entries(PACKAGE_TO_STACK)) {
    if (packageName in allDeps && AVAILABLE_STACKS.includes(stackName)) {
      detectedStacks.push(stackName);
    }
  }

  let primaryStack: string | null = null;
  if (detectedStacks.length > 0) {
    let highestSpecificity = -1;
    for (const stack of detectedStacks) {
      const specificity = FRAMEWORK_SPECIFICITY[stack] ?? 0;
      if (specificity > highestSpecificity) {
        highestSpecificity = specificity;
        primaryStack = stack;
      }
    }
  }

  return { projectName, detectedStacks, primaryStack };
}

export function assembleInitQuery(options: InitQueryOptions): string {
  const parts = [options.type, options.style, options.stack]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());

  return parts.join(' ');
}

export function checkExistingDesignSystem(grspecDir: string): ExistingDesignSystemInfo | null {
  const masterPath = join(grspecDir, 'ui', 'MASTER.md');

  if (!existsSync(masterPath)) {
    return null;
  }

  const content = readFileSync(masterPath, 'utf-8');
  const styleMatch =
    content.match(/\*\*Style:\*\*\s*(.+)/) ?? content.match(/##\s*Style:\s*(.+)/i);
  const style = styleMatch ? styleMatch[1].trim() : 'Unknown';
  return { style, path: join(grspecDir, 'ui') };
}

export function generateRulesChecklist(outputPath: string, platform: string): void {
  let rules = loadRules();
  if (platform !== 'both') {
    rules = filterByPlatform(rules, platform);
  }

  const content = formatChecklist(rules);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, 'utf-8');
}
