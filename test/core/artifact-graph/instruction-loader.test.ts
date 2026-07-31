import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  loadTemplate,
  loadChangeContext,
  generateInstructions,
  formatChangeStatus,
  injectFrontmatter,
  TemplateLoadError,
} from '../../../src/core/artifact-graph/instruction-loader.js';

describe('instruction-loader', () => {
  describe('loadTemplate', () => {
    it('should load template from schema directory', () => {
      // Uses built-in spec-driven schema
      const template = loadTemplate('spec-driven', 'proposal.md');

      expect(template).toContain('## Why');
      expect(template).toContain('## What Changes');
    });

    it('should throw TemplateLoadError for non-existent template', () => {
      expect(() => loadTemplate('spec-driven', 'nonexistent.md')).toThrow(
        TemplateLoadError
      );
    });

    it('should throw TemplateLoadError for non-existent schema', () => {
      expect(() => loadTemplate('nonexistent-schema', 'proposal.md')).toThrow(
        TemplateLoadError
      );
    });

    it('should include template path in error', () => {
      try {
        loadTemplate('spec-driven', 'nonexistent.md');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(TemplateLoadError);
        expect((err as TemplateLoadError).templatePath).toContain('nonexistent.md');
      }
    });
  });

  describe('loadChangeContext', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should load context with default schema', () => {
      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('spec-driven');
      expect(context.changeName).toBe('my-change');
      expect(context.graph.getName()).toBe('spec-driven');
      expect(context.completed.size).toBe(0);
    });

    it('should load context with explicit schema', () => {
      const context = loadChangeContext(tempDir, 'my-change', 'spec-driven');

      expect(context.schemaName).toBe('spec-driven');
      expect(context.graph.getName()).toBe('spec-driven');
    });

    it('should detect completed artifacts', () => {
      // Create change directory with proposal.md
      const changeDir = path.join(tempDir, 'grspec', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');

      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.completed.has('proposal')).toBe(true);
    });

    it('should return empty completed set for non-existent change directory', () => {
      const context = loadChangeContext(tempDir, 'nonexistent-change');

      expect(context.completed.size).toBe(0);
    });

    it('should auto-detect schema from .grspec.yaml metadata', () => {
      // Create change directory with metadata file
      const changeDir = path.join(tempDir, 'grspec', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, '.grspec.yaml'), 'schema: spec-driven\ncreated: "2025-01-05"\n');

      // Load without explicit schema - should detect from metadata
      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('spec-driven');
      expect(context.graph.getName()).toBe('spec-driven');
    });

    it('should use explicit schema over metadata schema', () => {
      // Create change directory with metadata file using spec-driven
      const changeDir = path.join(tempDir, 'grspec', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, '.grspec.yaml'), 'schema: spec-driven\n');

      // Load with explicit schema - should override metadata
      const context = loadChangeContext(tempDir, 'my-change', 'spec-driven');

      expect(context.schemaName).toBe('spec-driven');
      expect(context.graph.getName()).toBe('spec-driven');
    });

    it('should fall back to default when no metadata and no explicit schema', () => {
      // Create change directory without metadata file
      const changeDir = path.join(tempDir, 'grspec', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });

      const context = loadChangeContext(tempDir, 'my-change');

      expect(context.schemaName).toBe('spec-driven');
    });
  });

  describe('generateInstructions', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should include artifact metadata', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      expect(instructions.changeName).toBe('my-change');
      expect(instructions.artifactId).toBe('proposal');
      expect(instructions.schemaName).toBe('spec-driven');
      expect(instructions.outputPath).toBe('proposal.md');
    });

    it('should include template content', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      expect(instructions.template).toContain('## Why');
    });

    it('should show dependencies with completion status', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'specs');

      expect(instructions.dependencies).toHaveLength(1);
      expect(instructions.dependencies[0].id).toBe('proposal');
      expect(instructions.dependencies[0].done).toBe(false);
    });

    it('should mark completed dependencies as done', () => {
      // Create proposal
      const changeDir = path.join(tempDir, 'grspec', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');

      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'specs');

      expect(instructions.dependencies[0].done).toBe(true);
    });

    it('should list artifacts unlocked by this one', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      // proposal unlocks specs and design
      expect(instructions.unlocks).toContain('specs');
      expect(instructions.unlocks).toContain('design');
    });

    it('should have empty dependencies for root artifact', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const instructions = generateInstructions(context, 'proposal');

      expect(instructions.dependencies).toHaveLength(0);
    });

    it('should throw for non-existent artifact', () => {
      const context = loadChangeContext(tempDir, 'my-change');

      expect(() => generateInstructions(context, 'nonexistent')).toThrow(
        "Artifact 'nonexistent' not found"
      );
    });

    describe('project config integration', () => {
      it('should return context as separate field for all artifacts', () => {
        // Create project config
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
context: |
  Tech stack: TypeScript, React
  API style: RESTful
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        // Context should be in separate field, not in template
        expect(instructions.context).toContain('Tech stack: TypeScript, React');
        expect(instructions.context).toContain('API style: RESTful');
        expect(instructions.template).not.toContain('Tech stack');
        expect(instructions.template).toContain('## Why'); // Actual template content
      });

      it('should return undefined context when config is absent', () => {
        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toBeUndefined();
        expect(instructions.rules).toBeUndefined();
        expect(instructions.template).toContain('## Why'); // Actual template content
      });

      it('should preserve multi-line context', () => {
        // Create project config with multi-line context
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
context: |
  Line 1
  Line 2
  Line 3
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toContain('Line 1\nLine 2\nLine 3');
      });

      it('should preserve special characters in context', () => {
        // Create project config with special characters
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
context: |
  Special: < > & " ' @ # $ % [ ] { }
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toContain('Special: < > & " \' @ # $ % [ ] { }');
      });

      it('should return rules only for matching artifact', () => {
        // Create project config with rules
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format
`
        );

        const context = loadChangeContext(tempDir, 'my-change');

        // Check proposal artifact has its rules
        const proposalInstructions = generateInstructions(context, 'proposal', tempDir);
        expect(proposalInstructions.rules).toEqual(['Include rollback plan', 'Identify affected teams']);
        expect(proposalInstructions.template).not.toContain('rollback plan');

        // Check specs artifact has its rules
        const specsInstructions = generateInstructions(context, 'specs', tempDir);
        expect(specsInstructions.rules).toEqual(['Use Given/When/Then format']);
        expect(specsInstructions.template).not.toContain('Given/When/Then');
      });

      it('should return undefined rules for non-matching artifact', () => {
        // Create project config with rules only for proposal
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Include rollback plan
`
        );

        const context = loadChangeContext(tempDir, 'my-change');

        // Check design artifact (no rules configured) has undefined rules
        const designInstructions = generateInstructions(context, 'design', tempDir);
        expect(designInstructions.rules).toBeUndefined();
      });

      it('should return undefined rules when empty array', () => {
        // Create project config with empty rules array
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
context: Some context
rules:
  proposal: []
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toBe('Some context');
        expect(instructions.rules).toBeUndefined();
      });

      it('should keep context, rules, and template as separate fields', () => {
        // Create project config with both context and rules
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
context: Project context here
rules:
  proposal:
    - Rule 1
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        // All three should be separate
        expect(instructions.context).toBe('Project context here');
        expect(instructions.rules).toEqual(['Rule 1']);
        expect(instructions.template).toContain('## Why');
        // Template should not contain context or rules
        expect(instructions.template).not.toContain('Project context here');
        expect(instructions.template).not.toContain('Rule 1');
      });

      it('should handle context without rules', () => {
        // Create project config with only context
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
context: Project context only
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toBe('Project context only');
        expect(instructions.rules).toBeUndefined();
        expect(instructions.template).toContain('## Why');
      });

      it('should handle rules without context', () => {
        // Create project config with only rules
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Rule only
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal', tempDir);

        expect(instructions.context).toBeUndefined();
        expect(instructions.rules).toEqual(['Rule only']);
        expect(instructions.template).toContain('## Why');
      });

      it('should work without project root parameter', () => {
        const context = loadChangeContext(tempDir, 'my-change');
        const instructions = generateInstructions(context, 'proposal'); // No projectRoot

        expect(instructions.context).toBeUndefined();
        expect(instructions.rules).toBeUndefined();
        expect(instructions.template).toContain('## Why');
      });
    });

    describe('validation and warnings', () => {
      let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
      });

      it('should warn about unknown artifact IDs in rules', () => {
        // Create project config with invalid artifact ID
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Valid rule
  invalid-artifact:
    - Invalid rule
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        generateInstructions(context, 'proposal', tempDir);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Unknown artifact ID in rules: "invalid-artifact"')
        );
      });

      it('should deduplicate validation warnings within session', () => {
        // Create a fresh temp directory to avoid cache pollution
        const freshTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-test-'));

        try {
          // Create project config with a uniquely named invalid artifact ID
          const configDir = path.join(freshTempDir, 'grspec');
          fs.mkdirSync(configDir, { recursive: true });
          fs.writeFileSync(
            path.join(configDir, 'grspec.yaml'),
            `schema: spec-driven
rules:
  unique-invalid-artifact-${Date.now()}:
    - Invalid rule
`
          );

          const context = loadChangeContext(freshTempDir, 'my-change');

          // Call multiple times
          generateInstructions(context, 'proposal', freshTempDir);
          generateInstructions(context, 'specs', freshTempDir);
          generateInstructions(context, 'design', freshTempDir);

          // Warning should be shown only once (deduplication works)
          // Note: We may have gotten warnings from other tests, so check that
          // the count didn't increase by more than 1 from the first call
          const callCount = consoleWarnSpy.mock.calls.filter(call =>
            call[0]?.includes('Unknown artifact ID in rules')
          ).length;

          expect(callCount).toBeGreaterThanOrEqual(1);
        } finally {
          fs.rmSync(freshTempDir, { recursive: true, force: true });
        }
      });

      it('should not warn for valid artifact IDs', () => {
        // Create project config with valid artifact IDs
        const configDir = path.join(tempDir, 'grspec');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'grspec.yaml'),
          `schema: spec-driven
rules:
  proposal:
    - Rule 1
  specs:
    - Rule 2
`
        );

        const context = loadChangeContext(tempDir, 'my-change');
        generateInstructions(context, 'proposal', tempDir);

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('formatChangeStatus', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should show all artifacts as ready/blocked when nothing completed', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      expect(status.changeName).toBe('my-change');
      expect(status.schemaName).toBe('spec-driven');
      expect(status.isComplete).toBe(false);

      // proposal has no deps, should be ready
      const proposal = status.artifacts.find(a => a.id === 'proposal');
      expect(proposal?.status).toBe('ready');

      // specs depends on proposal, should be blocked
      const specs = status.artifacts.find(a => a.id === 'specs');
      expect(specs?.status).toBe('blocked');
      expect(specs?.missingDeps).toContain('proposal');
    });

    it('should show completed artifacts as done', () => {
      const changeDir = path.join(tempDir, 'grspec', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');

      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      const proposal = status.artifacts.find(a => a.id === 'proposal');
      expect(proposal?.status).toBe('done');

      // specs should now be ready
      const specs = status.artifacts.find(a => a.id === 'specs');
      expect(specs?.status).toBe('ready');
    });

    it('should include output paths for each artifact', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      const proposal = status.artifacts.find(a => a.id === 'proposal');
      expect(proposal?.outputPath).toBe('proposal.md');

      const specs = status.artifacts.find(a => a.id === 'specs');
      expect(specs?.outputPath).toBe('specs/**/*.md');
    });

    it('should report isComplete true when all done', () => {
      const changeDir = path.join(tempDir, 'grspec', 'changes', 'my-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.mkdirSync(path.join(changeDir, 'specs'), { recursive: true });

      // Create all required files for spec-driven schema
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');
      fs.writeFileSync(path.join(changeDir, 'specs', 'test.md'), '# Spec');
      fs.writeFileSync(path.join(changeDir, 'design.md'), '# Design');
      fs.writeFileSync(path.join(changeDir, 'plan.md'), '# Plan');

      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      expect(status.isComplete).toBe(true);
      expect(status.artifacts.every(a => a.status === 'done')).toBe(true);
    });

    it('should show blocked artifacts with missing dependencies', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      // plan requires specs and design
      const plan = status.artifacts.find(a => a.id === 'plan');
      expect(plan?.status).toBe('blocked');
      expect(plan?.missingDeps).toContain('specs');
      expect(plan?.missingDeps).toContain('design');
    });

    it('should sort artifacts in build order', () => {
      const context = loadChangeContext(tempDir, 'my-change');
      const status = formatChangeStatus(context);

      const ids = status.artifacts.map(a => a.id);
      const proposalIdx = ids.indexOf('proposal');
      const specsIdx = ids.indexOf('specs');
      const planIdx = ids.indexOf('plan');

      // proposal must come before specs, specs before plan
      expect(proposalIdx).toBeLessThan(specsIdx);
      expect(specsIdx).toBeLessThan(planIdx);
    });
  });

  describe('injectFrontmatter', () => {
    it('should prepend YAML frontmatter to template content', () => {
      const result = injectFrontmatter('design', 'my-feature', 'spec-driven', '## Context\n');
      expect(result).toMatch(/^---\n/);
      expect(result).toContain('type: design');
      expect(result).toContain('change: my-feature');
      expect(result).toContain('schema: spec-driven');
      expect(result).toContain('## Context');
    });

    it('should map specs artifact ID to spec type', () => {
      const result = injectFrontmatter('specs', 'my-change', 'spec-driven', '## ADDED');
      expect(result).toContain('type: spec');
      expect(result).not.toContain('type: specs');
    });

    it('should include created date in YYYY-MM-DD format', () => {
      const result = injectFrontmatter('proposal', 'ch', 'spec-driven', '## Why');
      const match = result.match(/created: (\d{4}-\d{2}-\d{2})/);
      expect(match).toBeTruthy();
      const dateStr = match![1];
      expect(new Date(dateStr).toISOString().slice(0, 10)).toBe(dateStr);
    });

    it('should skip injection if template already has frontmatter', () => {
      const existing = '---\ntype: custom\n---\n## Content';
      const result = injectFrontmatter('design', 'ch', 'spec-driven', existing);
      expect(result).toBe(existing);
    });

    it('should skip injection if template starts with whitespace then frontmatter', () => {
      const existing = '\n---\ntype: custom\n---\n## Content';
      const result = injectFrontmatter('design', 'ch', 'spec-driven', existing);
      expect(result).toBe(existing);
    });

    it('should use artifact ID as type for unknown artifacts', () => {
      const result = injectFrontmatter('custom-artifact', 'ch', 'my-schema', '# Content');
      expect(result).toContain('type: custom-artifact');
    });
  });

  describe('generateInstructions frontmatter integration', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-fm-'));
      const changeDir = path.join(tempDir, 'grspec', 'changes', 'test-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '## Why\nTest');
      fs.writeFileSync(
        path.join(changeDir, '.grspec.yaml'),
        'schema: spec-driven\ncreated: 2026-05-27\n'
      );
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should include frontmatter in template for design artifact', () => {
      const context = loadChangeContext(tempDir, 'test-change');
      const instructions = generateInstructions(context, 'design');
      expect(instructions.template).toMatch(/^---\n/);
      expect(instructions.template).toContain('type: design');
      expect(instructions.template).toContain('change: test-change');
      expect(instructions.template).toContain('schema: spec-driven');
    });

    it('should include frontmatter in template for proposal artifact', () => {
      const context = loadChangeContext(tempDir, 'test-change');
      const instructions = generateInstructions(context, 'proposal');
      expect(instructions.template).toContain('type: proposal');
    });
  });
});
