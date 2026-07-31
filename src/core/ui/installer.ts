/**
 * UI Platform Installer
 *
 * Exports UI sub-skills to multiple AI platforms using JSON templates.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, join, basename } from 'path';

export const DEFAULT_UI_INSTALL_SKILLS = [
  'grspec-ui-init',
  'grspec-ui-design-system',
  'grspec-ui-review',
] as const;

export const ALL_UI_INSTALL_SKILLS = [
  'grspec-ui-init',
  'grspec-ui-search',
  'grspec-ui-design-system',
  'grspec-ui-rules',
  'grspec-ui-reference',
  'grspec-ui-review',
  'grspec-ui-status',
  'grspec-ui-detect',
  'grspec-ui-install',
  'grspec-ui-sync',
] as const;

export interface FolderStructure {
  root: string;
  skillPath?: string;
  skillParentPath?: string;
  filename: string;
}

export interface PlatformTemplate {
  platform: string;
  displayName: string;
  installType: string;
  folderStructure: FolderStructure;
  skills: string[];
  frontmatter: { name: string; description: string };
  sections: { quickReference: boolean };
  title: string;
  description: string;
  skillOrWorkflow: string;
}

export interface AssembleOptions {
  includeRules: boolean;
}

export function listPlatforms(templatesDir?: string): string[] {
  const dir = templatesDir ?? resolve(__dirname, '..', '..', '..', 'assets', 'ui', 'templates');
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => basename(f, '.json'))
    .sort();
}

export function loadPlatformTemplate(
  templatesDir: string,
  platform: string,
): PlatformTemplate | null {
  const filepath = join(templatesDir, `${platform}.json`);
  if (!existsSync(filepath)) return null;

  const content = readFileSync(filepath, 'utf-8');
  return JSON.parse(content) as PlatformTemplate;
}

export function resolveSkillParentPath(template: PlatformTemplate): string {
  const { folderStructure } = template;
  if (folderStructure.skillParentPath) {
    return folderStructure.skillParentPath;
  }

  if (folderStructure.skillPath) {
    const slashIndex = folderStructure.skillPath.indexOf('/');
    return slashIndex >= 0 ? folderStructure.skillPath.slice(0, slashIndex) : folderStructure.skillPath;
  }

  return 'skills';
}

export function resolveInstallSkillBundle(
  template: PlatformTemplate,
  installAll: boolean,
): string[] {
  if (installAll) {
    return template.skills?.length ? [...template.skills] : [...ALL_UI_INSTALL_SKILLS];
  }
  return [...DEFAULT_UI_INSTALL_SKILLS];
}

export function assembleSkillContent(template: PlatformTemplate, options: AssembleOptions): string {
  const lines: string[] = [];

  lines.push(`---`);
  lines.push(`name: ${template.frontmatter.name}`);
  lines.push(`description: ${template.frontmatter.description}`);
  lines.push(`---`);
  lines.push('');
  lines.push(`# ${template.title}`);
  lines.push('');
  lines.push(template.description);
  lines.push('');
  lines.push('## When to Use');
  lines.push('');
  lines.push('Use this skill when working on UI structure, visual design, interaction patterns, or UX quality.');
  lines.push('');
  lines.push('## Commands');
  lines.push('');
  lines.push('- `grspec ui search <query>` — Search design database');
  lines.push('- `grspec ui design-system` — Generate design system');
  lines.push('- `grspec ui rules [category]` — Query UI/UX rules');
  lines.push('- `grspec ui reference [style]` — View design specifications');
  lines.push('- `grspec ui review [path]` — Run UX quality audit');
  lines.push('- `grspec ui status` — Show project UI status');

  if (options.includeRules && template.sections.quickReference) {
    lines.push('');
    lines.push('## Quick Reference');
    lines.push('');
    lines.push('Run `grspec ui rules` to query the full rule database (205 rules across 10 categories).');
    lines.push('');
    lines.push('Categories: Accessibility (CRITICAL), Touch & Interaction (CRITICAL), Performance (HIGH),');
    lines.push('Style Selection (HIGH), Layout & Responsive (HIGH), Typography & Color (MEDIUM),');
    lines.push('Animation (MEDIUM), Forms & Feedback (MEDIUM), Navigation Patterns (HIGH), Charts & Data (LOW)');
  }

  lines.push('');
  return lines.join('\n');
}

export function getSkillOutputPath(
  template: PlatformTemplate,
  projectRoot: string,
  skillDirName: string,
): string {
  const { root, filename } = template.folderStructure;
  const skillParentPath = resolveSkillParentPath(template);
  return join(projectRoot, root, skillParentPath, skillDirName, filename);
}

/** @deprecated Use getSkillOutputPath with a skill directory name */
export function getOutputPath(template: PlatformTemplate, projectRoot: string): string {
  return getSkillOutputPath(template, projectRoot, DEFAULT_UI_INSTALL_SKILLS[0]);
}
