/**
 * UI Command
 *
 * CLI subcommand for UI/UX design intelligence — BM25-powered search
 * across styles, colors, typography, UX guidelines, charts, and more.
 */

import type { Command } from 'commander';
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import {
  search,
  searchStack,
  generateDesignSystem,
  formatAsciiBox,
  formatMarkdown,
  persistDesignSystem,
  persistProjectFoundation,
  AVAILABLE_DOMAINS,
  AVAILABLE_STACKS,
  CSV_CONFIG,
  getDataDir,
} from '../core/ui/index.js';
import {
  loadRules,
  filterByCategory,
  filterByPlatform,
  filterBySeverity,
  searchRules,
  formatChecklist,
} from '../core/ui/rules.js';
import {
  parseDesignCsv,
  listStyles,
  getStyleSpec,
  searchStyles,
} from '../core/ui/reference.js';
import {
  checkCursorPointer,
  checkEmojiIcons,
  checkTransitionTiming,
  checkReducedMotion,
  aggregateFindings,
  type ReviewFinding,
} from '../core/ui/review.js';
import {
  detectDesignSystem,
  readUpstreamVersion,
  buildStatusReport,
} from '../core/ui/status.js';
import {
  listPlatforms,
  loadPlatformTemplate,
  getSkillOutputPath,
  resolveInstallSkillBundle,
} from '../core/ui/installer.js';
import { createRequire } from 'module';
import { generateSkillContent, getSkillTemplates } from '../core/shared/skill-generation.js';

const require = createRequire(import.meta.url);
const { version: GRSPEC_VERSION } = require('../../package.json');
import {
  resolveUpstreamPath,
  checkForUpdates,
  generateUpstreamMd,
} from '../core/ui/sync.js';
import { detectUiContentInChange } from '../core/ui/detect.js';
import {
  detectProjectStack,
  assembleInitQuery,
  checkExistingDesignSystem,
  generateRulesChecklist,
} from '../core/ui/init.js';
import { validateChangeExists } from './workflow/shared.js';
import { logger } from '../utils/logger.js';

function formatSearchOutput(result: {
  domain: string;
  query: string;
  file: string;
  count: number;
  results: Record<string, string>[];
  stack?: string;
  error?: string;
}): string {
  if (result.error) return `Error: ${result.error}`;

  const lines: string[] = [];
  if (result.stack) {
    lines.push('## UI Pro Max Stack Guidelines');
    lines.push(`**Stack:** ${result.stack} | **Query:** ${result.query}`);
  } else {
    lines.push('## UI Pro Max Search Results');
    lines.push(`**Domain:** ${result.domain} | **Query:** ${result.query}`);
  }
  lines.push(`**Source:** ${result.file} | **Found:** ${result.count} results\n`);

  for (let i = 0; i < result.results.length; i++) {
    const row = result.results[i];
    lines.push(`### Result ${i + 1}`);
    for (const [key, value] of Object.entries(row)) {
      const display = value.length > 300 ? value.slice(0, 300) + '...' : value;
      lines.push(`- **${key}:** ${display}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function registerUiCommand(program: Command): void {
  const uiCmd = program
    .command('ui')
    .description('UI/UX design intelligence — search styles, colors, typography, UX guidelines, and more');

  uiCmd
    .command('search <query>')
    .description('Search the UI/UX knowledge base')
    .option('-d, --domain <domain>', `Search domain (${AVAILABLE_DOMAINS.join(', ')})`)
    .option('-s, --stack <stack>', `Stack-specific search (${AVAILABLE_STACKS.join(', ')})`)
    .option('-n, --max-results <n>', 'Max results', '3')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options: { domain?: string; stack?: string; maxResults?: string; json?: boolean }) => {
      const maxResults = parseInt(options.maxResults ?? '3', 10);

      if (options.stack) {
        const result = searchStack(query, options.stack, maxResults);
        if (options.json) {
          logger.info(JSON.stringify(result, null, 2));
        } else {
          logger.info(formatSearchOutput(result));
        }
        return;
      }

      if (options.domain && !AVAILABLE_DOMAINS.includes(options.domain)) {
        logger.error(`Invalid domain: ${options.domain}`);
        logger.error(`Valid domains: ${AVAILABLE_DOMAINS.join(', ')}`);
        process.exitCode = 1;
        return;
      }

      const result = search(query, options.domain, maxResults);
      if (options.json) {
        logger.info(JSON.stringify(result, null, 2));
      } else {
        logger.info(formatSearchOutput(result));
      }
    });

  uiCmd
    .command('design-system <query>')
    .description('Generate a complete design system recommendation')
    .option('-p, --project-name <name>', 'Project name')
    .option('-f, --format <format>', 'Output format: ascii (default) or markdown', 'ascii')
    .option('--persist', 'Save page overrides to grspec/ui/pages/ or change ui/pages/')
    .option('--page <name>', 'Create page-specific override file')
    .option('-o, --output-dir <dir>', 'Output directory for persisted files')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options: {
      projectName?: string;
      format?: string;
      persist?: boolean;
      page?: string;
      outputDir?: string;
      json?: boolean;
    }) => {
      const ds = generateDesignSystem(query, options.projectName);

      if (options.json) {
        logger.info(JSON.stringify(ds, null, 2));
      } else if (options.format === 'markdown') {
        logger.info(formatMarkdown(ds));
      } else {
        logger.info(formatAsciiBox(ds));
      }

      if (options.persist) {
        const result = persistDesignSystem(ds, options.page, options.outputDir);
        if (result.createdFiles.length === 0) {
          logger.info('\nNo files persisted. Use --page for project pages or --output <changeDir> for change pages.');
          return;
        }

        logger.info('\n' + '='.repeat(60));
        logger.info('Design system persisted:');
        for (const filePath of result.createdFiles) {
          logger.info(`   ${filePath}`);
        }
        logger.info('');
        logger.info('Reference grspec/ui/MASTER.md for global tokens; change ui/pages/ override per screen.');
        logger.info('='.repeat(60));
      }
    });

  uiCmd
    .command('domains')
    .description('List available search domains')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      if (options.json) {
        const data = Object.entries(CSV_CONFIG).map(([name, config]) => ({
          name,
          file: config.file,
          searchCols: config.searchCols,
        }));
        logger.info(JSON.stringify(data, null, 2));
        return;
      }

      logger.info('Available search domains:\n');
      logger.info('  Domain          File                    Search Columns');
      logger.info('  ──────          ────                    ──────────────');
      for (const [name, config] of Object.entries(CSV_CONFIG)) {
        logger.info(`  ${name.padEnd(16)} ${config.file.padEnd(24)} ${config.searchCols.join(', ')}`);
      }
    });

  uiCmd
    .command('stacks')
    .description('List available technology stacks')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      if (options.json) {
        logger.info(JSON.stringify(AVAILABLE_STACKS, null, 2));
        return;
      }

      logger.info('Available technology stacks:\n');
      for (const stack of AVAILABLE_STACKS) {
        logger.info(`  - ${stack}`);
      }
    });

  // --- New subcommands ---

  uiCmd
    .command('rules [category]')
    .description('Query UI/UX rules database (205 rules across 10 categories)')
    .option('-p, --platform <platform>', 'Filter by platform: web, app, both', 'both')
    .option('-s, --severity <severity>', 'Filter by severity: CRITICAL, HIGH, MEDIUM, LOW')
    .option('--search <query>', 'Search rules by keyword (BM25)')
    .option('--checklist', 'Output as markdown checklist')
    .option('--json', 'Output as JSON')
    .action((category: string | undefined, options: {
      platform?: string;
      severity?: string;
      search?: string;
      checklist?: boolean;
      json?: boolean;
    }) => {
      let rules = loadRules();

      if (category) rules = filterByCategory(rules, category);
      if (options.platform && options.platform !== 'both') rules = filterByPlatform(rules, options.platform);
      if (options.severity) rules = filterBySeverity(rules, options.severity);
      if (options.search) rules = searchRules(rules, options.search);

      if (options.json) {
        logger.info(JSON.stringify(rules, null, 2));
      } else if (options.checklist) {
        logger.info(formatChecklist(rules));
      } else if (!category && !options.search && !options.severity && options.platform === 'both') {
        const catMap = new Map<string, { count: number; severities: Set<string> }>();
        for (const r of rules) {
          const entry = catMap.get(r.Category) ?? { count: 0, severities: new Set<string>() };
          entry.count++;
          entry.severities.add(r.Severity);
          catMap.set(r.Category, entry);
        }
        logger.info(`UI/UX Rules: ${rules.length} total across ${catMap.size} categories\n`);
        logger.info(`  ${'Category'.padEnd(25)} ${'Count'.padEnd(7)} Severities`);
        logger.info(`  ${'─'.repeat(25)} ${'─'.repeat(7)} ${'─'.repeat(30)}`);
        for (const [cat, info] of catMap) {
          logger.info(`  ${cat.padEnd(25)} ${String(info.count).padEnd(7)} ${[...info.severities].join(', ')}`);
        }
        logger.info(`\nUse: grspec ui rules <category> for details`);
      } else {
        logger.info(`Found ${rules.length} rules\n`);
        for (const r of rules) {
          logger.info(`  ${r.RuleID.padEnd(25)} [${r.Severity}] [${r.Platform}] ${r.Short}`);
        }
      }
    });

  uiCmd
    .command('reference [style]')
    .description('View full design-system specifications (67 styles)')
    .option('-l, --list', 'List all available styles')
    .option('--search <query>', 'Search styles by keyword')
    .option('--section <section>', 'Show specific section (philosophy, tokens, components, code)')
    .option('--json', 'Output as JSON')
    .action((style: string | undefined, options: {
      list?: boolean;
      search?: string;
      section?: string;
      json?: boolean;
    }) => {
      if (options.list) {
        const styles = listStyles();
        if (options.json) {
          logger.info(JSON.stringify(styles, null, 2));
        } else {
          logger.info(`Available styles (${styles.length}):\n`);
          for (const s of styles) {
            logger.info(`  ${s.name.padEnd(35)} ${s.category}`);
          }
        }
        return;
      }

      const blocks = parseDesignCsv();

      if (options.search) {
        const results = searchStyles(blocks, options.search);
        if (options.json) {
          logger.info(JSON.stringify(results.map((r) => ({ name: r.name, description: r.description })), null, 2));
        } else {
          logger.info(`Found ${results.length} matching styles:\n`);
          for (const r of results.slice(0, 10)) {
            logger.info(`  ${r.name}`);
            logger.info(`    ${r.description.slice(0, 80)}...\n`);
          }
        }
        return;
      }

      if (style) {
        const spec = getStyleSpec(blocks, style);
        if (!spec) {
          logger.error(`Style not found: ${style}`);
          logger.error(`Available: ${blocks.map((b) => b.name).join(', ')}`);
          process.exitCode = 1;
          return;
        }
        if (options.json) {
          logger.info(JSON.stringify(spec, null, 2));
        } else {
          logger.info(`# ${spec.name}\n`);
          logger.info(spec.description);
          logger.info(`\n## Use Cases\n${spec.useCases}`);
          logger.info(`\n## Design System\n${spec.content}`);
        }
        return;
      }

      logger.info('Usage: grspec ui reference <style-name>');
      logger.info('       grspec ui reference --list');
      logger.info('       grspec ui reference --search <query>');
    });

  uiCmd
    .command('review [path]')
    .description('Run static UX quality audit against the rule set')
    .option('-p, --platform <platform>', 'Focus on platform: web, app, both', 'both')
    .option('--checklist', 'Output as checklist')
    .option('--json', 'Output as JSON')
    .action((targetPath: string | undefined, options: {
      platform?: string;
      checklist?: boolean;
      json?: boolean;
    }) => {
      const scanPath = targetPath ?? '.';
      const findings: ReviewFinding[] = [];

      function scanDir(dir: string): void {
        if (!existsSync(dir)) return;
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (/\.(tsx|jsx|css|scss|vue|svelte)$/.test(entry.name)) {
            const code = readFileSync(fullPath, 'utf-8');
            findings.push(...checkCursorPointer(code, fullPath));
            findings.push(...checkEmojiIcons(code, fullPath));
            findings.push(...checkTransitionTiming(code, fullPath));
            findings.push(...checkReducedMotion(code, fullPath));
          }
        }
      }

      scanDir(resolve(scanPath));
      const report = aggregateFindings(findings);

      if (options.json) {
        logger.info(JSON.stringify(report, null, 2));
      } else {
        logger.info(`UI Review: ${report.total} findings\n`);
        if (report.critical.length) {
          logger.info(`  CRITICAL (${report.critical.length}):`);
          for (const f of report.critical) logger.info(`    ${f.file}:${f.line} — ${f.message}`);
        }
        if (report.high.length) {
          logger.info(`  HIGH (${report.high.length}):`);
          for (const f of report.high) logger.info(`    ${f.file}:${f.line} — ${f.message}`);
        }
        if (report.medium.length) {
          logger.info(`  MEDIUM (${report.medium.length}):`);
          for (const f of report.medium) logger.info(`    ${f.file}:${f.line} — ${f.message}`);
        }
        if (report.total === 0) logger.info('  ✓ No issues found');
      }
    });

  uiCmd
    .command('status')
    .description('Show project UI configuration status')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      const projectRoot = process.cwd();
      const assetsDir = resolve(getDataDir(), '..');
      const report = buildStatusReport({
        projectRoot,
        upstreamPath: resolve(assetsDir, 'UPSTREAM.md'),
      });

      if (options.json) {
        logger.info(JSON.stringify(report, null, 2));
      } else {
        logger.info('UI Project Status\n');
        logger.info(`  Design System: ${report.designSystem.found ? `✓ ${report.designSystem.style}` : '✗ Not configured'}`);
        if (report.upstream) {
          logger.info(`  Upstream: v${report.upstream.version} (synced ${report.upstream.date})`);
        } else {
          logger.info('  Upstream: Not synced');
        }
      }
    });

  uiCmd
    .command('install')
    .description('Export grspec UI sub-skills to AI platforms')
    .option('-p, --platform <platform>', 'Target platform')
    .option('-l, --list', 'List supported platforms')
    .option('-o, --output <dir>', 'Custom output directory')
    .option('--all', 'Export all ten UI sub-skills (default: init, design-system, review)')
    .option('--force', 'Overwrite existing files')
    .option('--json', 'Output as JSON')
    .action((options: {
      platform?: string;
      list?: boolean;
      output?: string;
      all?: boolean;
      force?: boolean;
      json?: boolean;
    }) => {
      const templatesDir = resolve(getDataDir(), '..', 'templates');

      if (options.list) {
        const platforms = listPlatforms(templatesDir);
        if (options.json) {
          logger.info(JSON.stringify(platforms, null, 2));
        } else {
          logger.info(`Supported platforms (${platforms.length}):\n`);
          for (const p of platforms) {
            const tpl = loadPlatformTemplate(templatesDir, p);
            logger.info(`  ${p.padEnd(15)} ${tpl?.displayName ?? ''}`);
          }
        }
        return;
      }

      if (!options.platform) {
        logger.error('Usage: grspec ui install --platform <name>');
        logger.error('       grspec ui install --list');
        process.exitCode = 1;
        return;
      }

      const tpl = loadPlatformTemplate(templatesDir, options.platform);
      if (!tpl) {
        logger.error(`Unknown platform: ${options.platform}`);
        process.exitCode = 1;
        return;
      }

      const projectRoot = options.output ?? process.cwd();
      const skillBundle = resolveInstallSkillBundle(tpl, options.all ?? false);
      const uiSkillTemplates = getSkillTemplates().filter((entry) => entry.workflowId === 'ui');
      const installedPaths: string[] = [];
      const skippedPaths: string[] = [];

      for (const skillDirName of skillBundle) {
        const skillEntry = uiSkillTemplates.find((entry) => entry.dirName === skillDirName);
        if (!skillEntry) {
          continue;
        }

        const outputPath = getSkillOutputPath(tpl, projectRoot, skillDirName);
        if (existsSync(outputPath) && !options.force) {
          skippedPaths.push(outputPath);
          continue;
        }

        const content = generateSkillContent(skillEntry.template, GRSPEC_VERSION);
        mkdirSync(dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, content, 'utf-8');
        installedPaths.push(outputPath);
      }

      if (installedPaths.length === 0 && skippedPaths.length > 0 && !options.force) {
        logger.error(`Files already exist (${skippedPaths.length}). Use --force to overwrite.`);
        process.exitCode = 1;
        return;
      }

      if (options.json) {
        logger.info(JSON.stringify({
          platform: tpl.platform,
          installedPaths,
          skippedPaths,
          success: installedPaths.length > 0,
        }, null, 2));
      } else {
        logger.info(`✓ Installed ${installedPaths.length} UI sub-skill(s) for ${tpl.displayName}`);
        for (const outputPath of installedPaths) {
          logger.info(`  ${outputPath}`);
        }
        if (skippedPaths.length > 0) {
          logger.info(`Skipped ${skippedPaths.length} existing file(s) (use --force to overwrite)`);
        }
      }
    });

  uiCmd
    .command('detect')
    .description('Detect UI content in a change\'s artifacts')
    .requiredOption('-c, --change <name>', 'Change to analyze')
    .option('--json', 'Output as JSON')
    .action(async (options: { change: string; json?: boolean }) => {
      const projectRoot = process.cwd();

      try {
        await validateChangeExists(options.change, projectRoot);
      } catch (err) {
        if (options.json) {
          logger.info(JSON.stringify({ error: (err as Error).message }, null, 2));
        } else {
          logger.error((err as Error).message);
        }
        process.exitCode = 1;
        return;
      }

      const changeDir = join(projectRoot, 'grspec', 'changes', options.change);
      const result = detectUiContentInChange(changeDir);

      const filesToScan = ['proposal.md', 'design.md'];
      const source = filesToScan.filter((f) => existsSync(join(changeDir, f)));

      if (options.json) {
        logger.info(JSON.stringify({
          detected: result.detected,
          keywords: result.keywords,
          source,
          score: result.keywords.length,
        }, null, 2));
      } else {
        if (result.detected) {
          logger.info(`UI detected: yes (score: ${result.keywords.length})`);
          logger.info(`Keywords: ${result.keywords.join(', ')}`);
          logger.info(`Scanned: ${source.join(', ')}`);
        } else if (result.keywords.length > 0) {
          logger.info(`UI detected: no (score: ${result.keywords.length}, threshold: 3)`);
          logger.info(`Keywords: ${result.keywords.join(', ')}`);
          logger.info(`Scanned: ${source.join(', ')}`);
        } else {
          logger.info('UI detected: no');
          logger.info(`Scanned: ${source.join(', ')}`);
        }
      }
    });

  uiCmd
    .command('sync')
    .description('Synchronize UI data from upstream source')
    .option('--check', 'Check for updates without syncing')
    .option('--force', 'Force sync even if versions match')
    .option('--from <path>', 'Custom upstream path')
    .option('--json', 'Output as JSON')
    .action((options: {
      check?: boolean;
      force?: boolean;
      from?: string;
      json?: boolean;
    }) => {
      const assetsDir = resolve(getDataDir(), '..');
      const upstreamMd = resolve(assetsDir, 'UPSTREAM.md');
      const grspecRoot = resolve(assetsDir, '..', '..');
      const upstreamDir = resolveUpstreamPath(grspecRoot, options.from);

      if (!existsSync(upstreamDir)) {
        logger.error(`Upstream not found: ${upstreamDir}`);
        logger.error('Use --from <path> to specify the upstream location');
        process.exitCode = 1;
        return;
      }

      const status = checkForUpdates(upstreamMd, upstreamDir);

      if (options.check) {
        if (options.json) {
          logger.info(JSON.stringify(status, null, 2));
        } else if (status.hasUpdates) {
          logger.info(`Updates available: ${status.localVersion} → ${status.upstreamVersion}`);
        } else {
          logger.info(`Up to date (v${status.localVersion})`);
        }
        return;
      }

      if (!status.hasUpdates && !options.force) {
        logger.info(`Already up to date (v${status.localVersion})`);
        return;
      }

      logger.info(`Syncing: ${status.localVersion} → ${status.upstreamVersion}`);
      logger.info('Run with --check first to preview. Full sync requires manual verification.');
    });

  uiCmd
    .command('init')
    .description('Initialize a project design system with auto-detection')
    .option('-t, --type <type>', 'Product type (saas, ecommerce, devtool, healthcare, etc.)')
    .option('-s, --style <keywords>', 'Style keywords (e.g., "minimal dark modern")')
    .option('-p, --project <name>', 'Project name (auto-detected from package.json)')
    .option('--page <name>', 'Also generate a page-specific override')
    .option('--with-rules', 'Generate a rules checklist alongside the design system')
    .option('--platform <platform>', 'Platform for rules: web, app, both', 'web')
    .option('-o, --output <dir>', 'Output directory (default: grspec/)')
    .option('--force', 'Overwrite existing design system')
    .option('--json', 'Output as JSON')
    .action((options: {
      type?: string;
      style?: string;
      project?: string;
      page?: string;
      withRules?: boolean;
      platform?: string;
      output?: string;
      force?: boolean;
      json?: boolean;
    }) => {
      const outputBase = options.output ?? join(process.cwd(), 'grspec');
      const detected = detectProjectStack(process.cwd());

      if (!options.type) {
        if (options.json) {
          logger.info(JSON.stringify({ error: 'Missing required option: --type' }, null, 2));
        } else {
          logger.error('Missing required option: --type <product-type>');
          logger.error('Examples: saas, ecommerce, devtool, healthcare, portfolio');
        }
        process.exitCode = 1;
        return;
      }

      const existing = checkExistingDesignSystem(outputBase);
      if (existing && !options.force) {
        if (options.json) {
          logger.info(JSON.stringify({
            error: 'Design system already exists',
            style: existing.style,
            path: existing.path,
          }, null, 2));
        } else {
          logger.error(`Design system already exists (style: ${existing.style})`);
          logger.error(`  Path: ${existing.path}`);
          logger.error('Use --force to overwrite');
        }
        process.exitCode = 1;
        return;
      }

      const projectName = options.project ?? detected.projectName ?? options.type.toUpperCase();
      const stack = detected.primaryStack ?? undefined;

      const query = assembleInitQuery({
        type: options.type,
        style: options.style,
        stack,
      });

      const ds = generateDesignSystem(query, projectName);

      if (options.json) {
        logger.info(JSON.stringify({
          designSystem: ds,
          detected: {
            projectName: detected.projectName,
            stacks: detected.detectedStacks,
            primaryStack: detected.primaryStack,
          },
          query,
        }, null, 2));
      } else {
        logger.info(formatAsciiBox(ds));
      }

      const persistResult = persistProjectFoundation(ds, outputBase, options.page);

      if (!options.json) {
        logger.info('\n' + '='.repeat(60));
        logger.info('Design system initialized at grspec/ui/MASTER.md');
        for (const filePath of persistResult.createdFiles) {
          logger.info(`   ${filePath}`);
        }
      }

      if (options.withRules) {
        const rulesPath = join(outputBase, 'ui', 'RULES-CHECKLIST.md');
        generateRulesChecklist(rulesPath, options.platform ?? 'web');

        if (!options.json) {
          logger.info(`   ${rulesPath}`);
        }
      }

      if (!options.json) {
        if (detected.primaryStack) {
          logger.info(`\nDetected stack: ${detected.primaryStack}`);
        }
        logger.info('='.repeat(60));
      }
    });
}
