/**
 * AGENTS.md Generator
 *
 * Language-agnostic project metadata detection and AGENTS.md assembly.
 * Detects ecosystem from manifest files (package.json, Cargo.toml, go.mod,
 * pyproject.toml, pom.xml, etc.) and extracts commands, tech stack, and conventions.
 */

import path from 'path';
import * as fs from 'fs';
import { assembleAgentsMd, getCodeStyleSummary, type AgentsMdSections } from './template.js';

// ─── Ecosystem Abstractions ──────────────────────────────────────────

interface EcosystemSignal {
  manifestFile: string;
  detect: (projectPath: string) => EcosystemDetail;
}

export interface EcosystemDetail {
  language: string;
  runner: string;
  techStack: string[];
  commands: CommandEntry[];
  testCommand: string;
  lintCommand: string;
  buildCommand: string;
  usesConventionalCommits: boolean;
  hasPreCommitHooks: boolean;
  runtimeVersion: string;
}

export interface CommandEntry {
  label: string;
  command: string;
}

// ─── Node.js Ecosystem ───────────────────────────────────────────────

const NODE_FRAMEWORK_PACKAGES: Record<string, string> = {
  'react': 'React', 'next': 'Next.js', 'vue': 'Vue', 'nuxt': 'Nuxt',
  'svelte': 'Svelte', '@angular/core': 'Angular',
  'express': 'Express', 'fastify': 'Fastify', '@nestjs/core': 'NestJS', 'hono': 'Hono',
};

const NODE_TEST_PACKAGES: Record<string, string> = {
  'vitest': 'Vitest', 'jest': 'Jest', 'mocha': 'Mocha',
  '@playwright/test': 'Playwright', 'cypress': 'Cypress',
};

const NODE_BUNDLER_PACKAGES: Record<string, string> = {
  'vite': 'Vite', 'webpack': 'webpack', 'esbuild': 'esbuild',
  'turbo': 'Turborepo', 'tsup': 'tsup',
};

function lookupPackages(allDeps: Record<string, string>, map: Record<string, string>): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const [pkg, display] of Object.entries(map)) {
    if (allDeps[pkg] && !seen.has(display)) {
      found.push(display);
      seen.add(display);
    }
  }
  return found;
}

function detectNodeEcosystem(projectPath: string): EcosystemDetail {
  const lockFiles: [string, string][] = [
    ['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'], ['bun.lock', 'bun'],
  ];
  let runner = 'npm';
  for (const [file, mgr] of lockFiles) {
    if (fs.existsSync(path.join(projectPath, file))) { runner = mgr; break; }
  }

  const run = (script: string) => `${runner} run ${script}`;
  const hasTs = fs.existsSync(path.join(projectPath, 'tsconfig.json'));
  const detail: EcosystemDetail = {
    language: hasTs ? 'TypeScript' : 'JavaScript',
    runner, techStack: [], commands: [],
    testCommand: '', lintCommand: '', buildCommand: '',
    usesConventionalCommits: false, hasPreCommitHooks: false, runtimeVersion: '',
  };

  const pkgPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return detail;

  let raw: Record<string, unknown>;
  try { raw = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')); } catch { return detail; }

  const deps = (raw.dependencies && typeof raw.dependencies === 'object')
    ? raw.dependencies as Record<string, string> : {};
  const devDeps = (raw.devDependencies && typeof raw.devDependencies === 'object')
    ? raw.devDependencies as Record<string, string> : {};
  const allDeps = { ...deps, ...devDeps };

  detail.techStack = [
    ...lookupPackages(allDeps, NODE_FRAMEWORK_PACKAGES),
    ...lookupPackages(allDeps, NODE_TEST_PACKAGES),
    ...lookupPackages(allDeps, NODE_BUNDLER_PACKAGES),
  ];

  const scripts = (raw.scripts && typeof raw.scripts === 'object')
    ? raw.scripts as Record<string, string> : {};
  for (const key of ['build', 'test', 'lint', 'dev', 'start', 'typecheck', 'check']) {
    if (scripts[key]) detail.commands.push({ label: key, command: run(key) });
  }
  if (scripts.test) detail.testCommand = run('test');
  if (scripts.lint) detail.lintCommand = run('lint');
  if (scripts.build) detail.buildCommand = run('build');

  detail.usesConventionalCommits = Object.keys(devDeps).some(
    p => p === 'commitlint' || p.startsWith('@commitlint/'),
  );
  detail.hasPreCommitHooks = devDeps['husky'] !== undefined || devDeps['lint-staged'] !== undefined;

  const engines = (raw.engines && typeof raw.engines === 'object')
    ? raw.engines as Record<string, string> : {};
  if (typeof engines.node === 'string') detail.runtimeVersion = `Node ${engines.node}`;

  return detail;
}

// ─── Rust Ecosystem ──────────────────────────────────────────────────

function detectRustEcosystem(_projectPath: string): EcosystemDetail {
  return {
    language: 'Rust', runner: 'cargo', techStack: [],
    commands: [
      { label: 'build', command: 'cargo build' },
      { label: 'test', command: 'cargo test' },
      { label: 'lint', command: 'cargo clippy' },
      { label: 'format', command: 'cargo fmt' },
    ],
    testCommand: 'cargo test', lintCommand: 'cargo clippy', buildCommand: 'cargo build',
    usesConventionalCommits: false, hasPreCommitHooks: false, runtimeVersion: '',
  };
}

// ─── Go Ecosystem ────────────────────────────────────────────────────

function detectGoEcosystem(_projectPath: string): EcosystemDetail {
  return {
    language: 'Go', runner: 'go', techStack: [],
    commands: [
      { label: 'build', command: 'go build ./...' },
      { label: 'test', command: 'go test ./...' },
      { label: 'lint', command: 'golangci-lint run' },
      { label: 'vet', command: 'go vet ./...' },
    ],
    testCommand: 'go test ./...', lintCommand: 'golangci-lint run', buildCommand: 'go build ./...',
    usesConventionalCommits: false, hasPreCommitHooks: false, runtimeVersion: '',
  };
}

// ─── Python Ecosystem ────────────────────────────────────────────────

function detectPythonEcosystem(projectPath: string): EcosystemDetail {
  const lockDetectors: [string, string][] = [
    ['uv.lock', 'uv'], ['poetry.lock', 'poetry'], ['Pipfile', 'pipenv'],
  ];
  let runner = 'python';
  for (const [file, mgr] of lockDetectors) {
    if (fs.existsSync(path.join(projectPath, file))) { runner = mgr; break; }
  }
  const prefix = runner === 'python' ? '' : `${runner} run `;

  return {
    language: 'Python', runner, techStack: [],
    commands: [
      { label: 'test', command: `${prefix}pytest` },
      { label: 'lint', command: `${prefix}ruff check .` },
      { label: 'typecheck', command: `${prefix}mypy .` },
    ],
    testCommand: `${prefix}pytest`, lintCommand: `${prefix}ruff check .`, buildCommand: '',
    usesConventionalCommits: false,
    hasPreCommitHooks: fs.existsSync(path.join(projectPath, '.pre-commit-config.yaml')),
    runtimeVersion: '',
  };
}

// ─── Java / Kotlin Ecosystems ────────────────────────────────────────

function detectMavenEcosystem(_projectPath: string): EcosystemDetail {
  return {
    language: 'Java', runner: 'mvn', techStack: ['Maven'],
    commands: [
      { label: 'build', command: 'mvn package' },
      { label: 'test', command: 'mvn test' },
      { label: 'lint', command: 'mvn checkstyle:check' },
    ],
    testCommand: 'mvn test', lintCommand: 'mvn checkstyle:check', buildCommand: 'mvn package',
    usesConventionalCommits: false, hasPreCommitHooks: false, runtimeVersion: '',
  };
}

function detectGradleEcosystem(_projectPath: string): EcosystemDetail {
  return {
    language: 'Java', runner: 'gradle', techStack: ['Gradle'],
    commands: [
      { label: 'build', command: './gradlew build' },
      { label: 'test', command: './gradlew test' },
    ],
    testCommand: './gradlew test', lintCommand: '', buildCommand: './gradlew build',
    usesConventionalCommits: false, hasPreCommitHooks: false, runtimeVersion: '',
  };
}

// ─── Makefile (generic fallback) ─────────────────────────────────────

function detectMakefileEcosystem(_projectPath: string): EcosystemDetail {
  return {
    language: '', runner: 'make', techStack: [],
    commands: [
      { label: 'build', command: 'make build' },
      { label: 'test', command: 'make test' },
    ],
    testCommand: 'make test', lintCommand: '', buildCommand: 'make build',
    usesConventionalCommits: false, hasPreCommitHooks: false, runtimeVersion: '',
  };
}

// ─── Ecosystem Registry (order = priority) ───────────────────────────

const ECOSYSTEM_SIGNALS: EcosystemSignal[] = [
  { manifestFile: 'package.json', detect: detectNodeEcosystem },
  { manifestFile: 'Cargo.toml', detect: detectRustEcosystem },
  { manifestFile: 'go.mod', detect: detectGoEcosystem },
  { manifestFile: 'pyproject.toml', detect: detectPythonEcosystem },
  { manifestFile: 'requirements.txt', detect: detectPythonEcosystem },
  { manifestFile: 'Pipfile', detect: detectPythonEcosystem },
  { manifestFile: 'pom.xml', detect: detectMavenEcosystem },
  { manifestFile: 'build.gradle', detect: detectGradleEcosystem },
  { manifestFile: 'build.gradle.kts', detect: detectGradleEcosystem },
  { manifestFile: 'Makefile', detect: detectMakefileEcosystem },
];

// ─── Project Metadata ────────────────────────────────────────────────

export interface ProjectMetadata {
  name: string;
  description: string;
  ecosystem: EcosystemDetail | null;
  srcDirectories: string[];
  hasGrspec: boolean;
}

export function detectProjectMetadata(projectPath: string): ProjectMetadata {
  const metadata: ProjectMetadata = {
    name: path.basename(projectPath),
    description: '',
    ecosystem: null,
    srcDirectories: [],
    hasGrspec: false,
  };

  for (const signal of ECOSYSTEM_SIGNALS) {
    if (fs.existsSync(path.join(projectPath, signal.manifestFile))) {
      metadata.ecosystem = signal.detect(projectPath);
      break;
    }
  }

  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (typeof raw.name === 'string') metadata.name = raw.name;
      if (typeof raw.description === 'string') metadata.description = raw.description;
    } catch { /* unparseable — keep defaults */ }
  }

  const srcPath = path.join(projectPath, 'src');
  if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
    try {
      metadata.srcDirectories = fs.readdirSync(srcPath)
        .filter(entry => fs.statSync(path.join(srcPath, entry)).isDirectory())
        .sort();
    } catch { /* permission or read error */ }
  }

  metadata.hasGrspec = fs.existsSync(path.join(projectPath, 'grspec'))
    && fs.statSync(path.join(projectPath, 'grspec')).isDirectory();

  return metadata;
}

// ─── Section Builders ────────────────────────────────────────────────

function buildTechStackLine(eco: EcosystemDetail | null): string {
  if (!eco) return '';
  const parts: string[] = [];
  if (eco.language) parts.push(eco.language);
  if (eco.runtimeVersion) parts.push(eco.runtimeVersion);
  parts.push(...eco.techStack);
  parts.push(eco.runner);
  if (parts.length <= 1) return '';
  return `Tech stack: ${parts.join(' · ')}`;
}

function buildCommandsSection(eco: EcosystemDetail | null): string {
  if (!eco || eco.commands.length === 0) {
    return '<!-- TODO: Add your build, test, and lint commands -->';
  }
  return eco.commands.map(c => `- \`${c.command}\` — ${c.label}`).join('\n');
}

function buildArchitecture(srcDirectories: string[]): string {
  if (srcDirectories.length === 0) return '<!-- TODO: Describe your project structure -->';
  const lines = srcDirectories.map(dir => `  ${dir}/`);
  return `\`\`\`\nsrc/\n${lines.join('\n')}\n\`\`\``;
}

function buildTesting(eco: EcosystemDetail | null): string {
  if (eco?.testCommand) return `- Run tests: \`${eco.testCommand}\``;
  return '<!-- TODO: Add your test runner and conventions -->';
}

function buildGitWorkflow(eco: EcosystemDetail | null, hasGrspec: boolean): string {
  const lines: string[] = [];

  if (hasGrspec) {
    lines.push('- Commit format: `<type>(<change>): <summary>` (imperative mood, <80 chars)');
    lines.push('  - Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`');
    lines.push('  - `<change>`: active grspec change name (omit for unscoped work)');
    lines.push('  - Examples:');
    lines.push('    - `feat(my-change): add validation logic`');
    lines.push('    - `test(my-change): add edge case coverage`');
    lines.push('    - `docs(my-change): update design with new approach`');
    lines.push('    - `chore: archive my-change`');
  } else if (eco?.usesConventionalCommits) {
    lines.push('- Commit format: Conventional Commits (`<type>(<scope>): <summary>`)');
    lines.push('  - Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`');
    lines.push('  - Keep summary under 80 characters, imperative mood');
  } else {
    lines.push('- Commit format: `<type>: <summary>` (imperative mood, <80 chars)');
    lines.push('  - Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`');
    lines.push('  - Examples: `feat: add tech stack detection`, `fix: handle missing package.json`');
  }

  lines.push('- Branch from `main`, prefix with `feat/`, `fix/`, or `chore/`');

  const preCommitParts: string[] = [];
  if (eco?.lintCommand) preCommitParts.push(eco.lintCommand);
  if (eco?.testCommand) preCommitParts.push(eco.testCommand);
  if (preCommitParts.length > 0) {
    lines.push(`- Before committing: \`${preCommitParts.join(' && ')}\``);
  } else {
    lines.push('<!-- TODO: Add your pre-commit checks -->');
  }

  lines.push('- Squash merge PRs');
  if (eco?.hasPreCommitHooks) lines.push('- Pre-commit hooks are configured');

  if (hasGrspec) {
    lines.push('');
    lines.push('### Commit Scope by File Type');
    lines.push('');
    lines.push('| When you...                    | git add                                   | Commit type  |');
    lines.push('|-------------------------------|-------------------------------------------|--------------|');
    lines.push('| Implement a plan item          | `src/` + `test/` (modified files)         | `feat`/`fix` |');
    lines.push('| Create/update grspec artifacts | `grspec/changes/<name>/`                  | `docs`       |');
    lines.push('| Archive a change               | `grspec/specs/` + `grspec/changes/<name>` | `chore`      |');
    lines.push('| Update project config          | `AGENTS.md`, `.cursor/`, `package.json`   | `chore`      |');
  }

  return lines.join('\n');
}

function buildBoundaries(eco: EcosystemDetail | null): string {
  const lines: string[] = [];

  const alwaysItems: string[] = [];
  if (eco?.lintCommand) alwaysItems.push(`Run \`${eco.lintCommand}\` before committing`);
  if (eco?.testCommand) alwaysItems.push(`Run \`${eco.testCommand}\` before committing`);
  if (eco?.buildCommand) alwaysItems.push(`Verify \`${eco.buildCommand}\` succeeds`);
  if (alwaysItems.length === 0) alwaysItems.push('Run all verification commands before committing');

  lines.push('- ✅ **Always:**');
  for (const item of alwaysItems) lines.push(`  - ${item}`);

  lines.push('- ⚠️ **Ask first:**');
  lines.push('  - Database schema changes');
  lines.push('  - Adding new dependencies');
  lines.push('  - Modifying CI/CD config');

  lines.push('- 🚫 **Never:**');
  lines.push('  - Commit secrets or API keys');
  lines.push('  - Force push to main/master');
  lines.push('  - Delete test files to make tests pass');
  lines.push('  - Skip type checks or linting to proceed');

  return lines.join('\n');
}

function buildGrspecWorkflow(hasGrspec: boolean): string {
  const base = `This project uses grspec for spec-driven development.
- Specs: \`grspec/specs/\` — behavioral requirements (current truth)
- Changes: \`grspec/changes/\` — active change proposals with delta specs
- Format: \`### Requirement:\` / \`#### Scenario:\` structured specs`;

  if (!hasGrspec) return base;
  return `${base}\n- Workflow: propose → specs → design → ui → plan → implement → verify → archive`;
}

// ─── Public API ──────────────────────────────────────────────────────

export function generateAgentsMdContent(projectPath: string, grspecVersion: string): string {
  const metadata = detectProjectMetadata(projectPath);
  const eco = metadata.ecosystem;

  const sections: AgentsMdSections = {
    projectName: metadata.name,
    projectDescription: metadata.description,
    techStack: buildTechStackLine(eco),
    commands: buildCommandsSection(eco),
    architecture: buildArchitecture(metadata.srcDirectories),
    codeStyle: getCodeStyleSummary(),
    testing: buildTesting(eco),
    gitWorkflow: buildGitWorkflow(eco, metadata.hasGrspec),
    boundaries: buildBoundaries(eco),
    grspecWorkflow: buildGrspecWorkflow(metadata.hasGrspec),
  };

  return assembleAgentsMd(sections, grspecVersion);
}
