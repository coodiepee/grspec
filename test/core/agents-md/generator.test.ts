import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { detectProjectMetadata, generateAgentsMdContent } from '../../../src/core/agents-md/generator.js';

describe('agents-md/generator', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-agents-md-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('detectProjectMetadata', () => {
    it('detects Node ecosystem from package.json', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ name: 'my-project', description: 'A test project' }),
      );

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.name).toBe('my-project');
      expect(metadata.description).toBe('A test project');
      expect(metadata.ecosystem).not.toBeNull();
      expect(metadata.ecosystem!.language).toMatch(/Script$/);
    });

    it('detects TypeScript when tsconfig.json exists', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({}));
      fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.language).toBe('TypeScript');
    });

    it('detects JavaScript when no tsconfig.json', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({}));

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.language).toBe('JavaScript');
    });

    it('detects scripts from package.json', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ scripts: { build: 'tsc', test: 'vitest', lint: 'eslint src/' } }),
      );

      const metadata = detectProjectMetadata(tmpDir);
      const commands = metadata.ecosystem!.commands.map(c => c.label);
      expect(commands).toContain('build');
      expect(commands).toContain('test');
      expect(commands).toContain('lint');
    });

    it('falls back to directory name when no package.json', () => {
      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.name).toBe(path.basename(tmpDir));
      expect(metadata.description).toBe('');
      expect(metadata.ecosystem).toBeNull();
    });

    it('handles malformed package.json gracefully', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), 'not json');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.name).toBe(path.basename(tmpDir));
    });

    it('detects src/ subdirectories', () => {
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir);
      fs.mkdirSync(path.join(srcDir, 'core'));
      fs.mkdirSync(path.join(srcDir, 'utils'));
      fs.writeFileSync(path.join(srcDir, 'index.ts'), '');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.srcDirectories).toEqual(['core', 'utils']);
    });

    it('returns empty srcDirectories when no src/ exists', () => {
      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.srcDirectories).toEqual([]);
    });

    it('detects grspec directory', () => {
      fs.mkdirSync(path.join(tmpDir, 'grspec'));
      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.hasGrspec).toBe(true);
    });

    it('reports no grspec when directory missing', () => {
      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.hasGrspec).toBe(false);
    });

    it('detects pnpm runner from pnpm-lock.yaml', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({}));
      fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.runner).toBe('pnpm');
    });

    it('detects yarn runner from yarn.lock', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({}));
      fs.writeFileSync(path.join(tmpDir, 'yarn.lock'), '');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.runner).toBe('yarn');
    });

    it('defaults to npm when no lockfile found', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({}));

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.runner).toBe('npm');
    });

    it('detects Rust ecosystem from Cargo.toml', () => {
      fs.writeFileSync(path.join(tmpDir, 'Cargo.toml'), '[package]\nname = "my-crate"');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.language).toBe('Rust');
      expect(metadata.ecosystem!.runner).toBe('cargo');
      expect(metadata.ecosystem!.testCommand).toBe('cargo test');
    });

    it('detects Go ecosystem from go.mod', () => {
      fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module example.com/mymod');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.language).toBe('Go');
      expect(metadata.ecosystem!.runner).toBe('go');
      expect(metadata.ecosystem!.testCommand).toBe('go test ./...');
    });

    it('detects Python ecosystem from pyproject.toml', () => {
      fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[tool.poetry]\nname = "myapp"');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.language).toBe('Python');
    });

    it('detects Python uv runner from uv.lock', () => {
      fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '');
      fs.writeFileSync(path.join(tmpDir, 'uv.lock'), '');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.runner).toBe('uv');
      expect(metadata.ecosystem!.testCommand).toBe('uv run pytest');
    });

    it('detects Maven ecosystem from pom.xml', () => {
      fs.writeFileSync(path.join(tmpDir, 'pom.xml'), '<project></project>');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.language).toBe('Java');
      expect(metadata.ecosystem!.runner).toBe('mvn');
    });

    it('detects Gradle ecosystem from build.gradle', () => {
      fs.writeFileSync(path.join(tmpDir, 'build.gradle'), 'plugins {}');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.language).toBe('Java');
      expect(metadata.ecosystem!.runner).toBe('gradle');
    });

    it('detects Makefile ecosystem as fallback', () => {
      fs.writeFileSync(path.join(tmpDir, 'Makefile'), 'build:\n\techo build');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.runner).toBe('make');
    });

    it('prefers package.json over Makefile when both exist', () => {
      fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({}));
      fs.writeFileSync(path.join(tmpDir, 'Makefile'), '');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.language).toMatch(/Script$/);
    });

    it('detects tech stack packages in Node ecosystem', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({
          dependencies: { react: '^18.0.0' },
          devDependencies: { vitest: '^1.0.0', vite: '^5.0.0' },
        }),
      );

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.techStack).toContain('React');
      expect(metadata.ecosystem!.techStack).toContain('Vitest');
      expect(metadata.ecosystem!.techStack).toContain('Vite');
    });

    it('uses exact package name matching for tech stack', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ dependencies: { 'react-icons': '^4.0.0' } }),
      );

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.techStack).not.toContain('React');
    });

    it('detects conventional commits from commitlint', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ devDependencies: { '@commitlint/cli': '^17.0.0' } }),
      );

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.usesConventionalCommits).toBe(true);
    });

    it('detects pre-commit hooks from husky', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ devDependencies: { husky: '^8.0.0' } }),
      );

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.hasPreCommitHooks).toBe(true);
    });

    it('detects Python pre-commit hooks from config file', () => {
      fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '');
      fs.writeFileSync(path.join(tmpDir, '.pre-commit-config.yaml'), '');

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.hasPreCommitHooks).toBe(true);
    });

    it('detects Node.js version from engines field', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ engines: { node: '>=20.19.0' } }),
      );

      const metadata = detectProjectMetadata(tmpDir);
      expect(metadata.ecosystem!.runtimeVersion).toBe('Node >=20.19.0');
    });
  });

  describe('generateAgentsMdContent', () => {
    it('includes project name as heading', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ name: 'awesome-tool' }),
      );

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('# awesome-tool');
    });

    it('includes grspec version marker', () => {
      const content = generateAgentsMdContent(tmpDir, '0.4.0');
      expect(content).toContain('Generated by grspec v0.4.0');
    });

    it('includes detected commands for Node project', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ scripts: { build: 'tsc', test: 'vitest' } }),
      );

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('## Commands');
      expect(content).toMatch(/run build/);
      expect(content).toMatch(/run test/);
    });

    it('uses pnpm commands when pnpm-lock.yaml exists', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ scripts: { build: 'tsc', test: 'vitest' } }),
      );
      fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('pnpm run build');
      expect(content).toContain('pnpm run test');
    });

    it('generates Rust commands for Cargo.toml project', () => {
      fs.writeFileSync(path.join(tmpDir, 'Cargo.toml'), '[package]');

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('cargo build');
      expect(content).toContain('cargo test');
      expect(content).toContain('cargo clippy');
    });

    it('generates Go commands for go.mod project', () => {
      fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module example.com/m');

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('go build ./...');
      expect(content).toContain('go test ./...');
    });

    it('generates Python commands for pyproject.toml project', () => {
      fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '');

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('pytest');
      expect(content).toContain('ruff');
    });

    it('includes TODO placeholders when no ecosystem detected', () => {
      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('TODO');
    });

    it('includes Boundaries section with three-tier system', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ scripts: { lint: 'eslint', test: 'vitest', build: 'tsc' } }),
      );

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('## Boundaries');
      expect(content).toContain('✅ **Always:**');
      expect(content).toContain('⚠️ **Ask first:**');
      expect(content).toContain('🚫 **Never:**');
    });

    it('includes Git Workflow section with commit format', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ scripts: { lint: 'eslint', test: 'vitest' } }),
      );

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('## Git Workflow');
      expect(content).toContain('Commit format:');
      expect(content).toContain('<type>: <summary>');
      expect(content).toContain('feat/');
      expect(content).toContain('Squash merge');
    });

    it('shows Conventional Commits when commitlint detected', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ devDependencies: { '@commitlint/cli': '^17.0.0' } }),
      );

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('Conventional Commits');
    });

    it('includes grspec-aware commit format when grspec directory exists', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ scripts: { lint: 'eslint', test: 'vitest' } }),
      );
      fs.mkdirSync(path.join(tmpDir, 'grspec'));

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('<type>(<change>): <summary>');
      expect(content).toContain('grspec change name');
      expect(content).toContain('### Commit Scope by File Type');
      expect(content).toContain('Implement a plan item');
      expect(content).toContain('grspec/changes/<name>');
    });

    it('omits grspec commit guidance when no grspec directory', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ scripts: { lint: 'eslint', test: 'vitest' } }),
      );

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).not.toContain('Commit Scope by File Type');
      expect(content).not.toContain('grspec change name');
    });

    it('includes tech stack line when detected', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({
          dependencies: { react: '^18.0.0' },
          devDependencies: { vitest: '^1.0.0' },
          engines: { node: '>=20' },
        }),
      );

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('Tech stack:');
      expect(content).toContain('React');
      expect(content).toContain('Node >=20');
    });

    it('includes architecture from src/ directories', () => {
      const srcDir = path.join(tmpDir, 'src');
      fs.mkdirSync(srcDir);
      fs.mkdirSync(path.join(srcDir, 'core'));
      fs.mkdirSync(path.join(srcDir, 'commands'));

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('## Architecture');
      expect(content).toContain('core/');
      expect(content).toContain('commands/');
    });

    it('includes code style summary', () => {
      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('## Code Style');
      expect(content).toContain('self-documenting');
      expect(content).toContain('WHY');
    });

    it('includes grspec workflow section', () => {
      fs.mkdirSync(path.join(tmpDir, 'grspec'));

      const content = generateAgentsMdContent(tmpDir, '1.0.0');
      expect(content).toContain('## grspec Workflow');
      expect(content).toContain('grspec/specs/');
      expect(content).toContain('→ ui →');
    });

    it('sections appear in standard order', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({ name: 'test-proj', scripts: { build: 'tsc', test: 'vitest' } }),
      );
      fs.mkdirSync(path.join(tmpDir, 'src'));
      fs.mkdirSync(path.join(tmpDir, 'grspec'));

      const content = generateAgentsMdContent(tmpDir, '1.0.0');

      const commandsIdx = content.indexOf('## Commands');
      const archIdx = content.indexOf('## Architecture');
      const styleIdx = content.indexOf('## Code Style');
      const testIdx = content.indexOf('## Testing');
      const gitIdx = content.indexOf('## Git Workflow');
      const boundIdx = content.indexOf('## Boundaries');
      const workflowIdx = content.indexOf('## grspec Workflow');

      expect(commandsIdx).toBeLessThan(archIdx);
      expect(archIdx).toBeLessThan(styleIdx);
      expect(styleIdx).toBeLessThan(testIdx);
      expect(testIdx).toBeLessThan(gitIdx);
      expect(gitIdx).toBeLessThan(boundIdx);
      expect(boundIdx).toBeLessThan(workflowIdx);
    });
  });
});
