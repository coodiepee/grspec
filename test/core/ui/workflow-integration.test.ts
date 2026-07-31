import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  loadChangeContext,
  generateInstructions,
} from '../../../src/core/artifact-graph/instruction-loader.js';
import { generateApplyInstructions } from '../../../src/commands/workflow/instructions.js';
import { discoverUiContextFiles } from '../../../src/core/ui/ui-context.js';

function writeV1ChangeArtifacts(changeDir: string): void {
  fs.writeFileSync(path.join(changeDir, 'proposal.md'), '## Why\nUI work');
  fs.mkdirSync(path.join(changeDir, 'specs', 'cap'), { recursive: true });
  fs.writeFileSync(path.join(changeDir, 'specs', 'cap', 'spec.md'), '## ADDED');
  fs.writeFileSync(path.join(changeDir, 'design.md'), '## Context');
  fs.writeFileSync(path.join(changeDir, 'plan.md'), '- [ ] 1.1 Do something');
}

describe('UI workflow integration', () => {
  let tempDir: string;
  let changeDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-ui-wf-'));
    changeDir = path.join(tempDir, 'grspec', 'changes', 'ui-feature');
    fs.mkdirSync(changeDir, { recursive: true });
    fs.writeFileSync(
      path.join(changeDir, '.grspec.yaml'),
      'schema: spec-driven\nschemaVersion: 1\ncreated: 2026-05-27\n'
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('design instruction (no enrichment)', () => {
    it('should NOT enrich design instruction when UI keywords are present', () => {
      fs.writeFileSync(
        path.join(changeDir, 'proposal.md'),
        '## Why\nBuild a modern dashboard with dark mode and responsive layout'
      );

      const context = loadChangeContext(tempDir, 'ui-feature');
      const instructions = generateInstructions(context, 'design');

      expect(instructions.instruction).not.toContain('UI Design System Available');
      expect(instructions.instruction).not.toContain('UI Design System Recommendation');
    });
  });

  describe('ui artifact instruction (v2)', () => {
    beforeEach(() => {
      fs.writeFileSync(
        path.join(changeDir, '.grspec.yaml'),
        'schema: spec-driven\nschemaVersion: 2\n'
      );
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '## Why\nDashboard');
      fs.writeFileSync(path.join(changeDir, 'design.md'), '## Context\nTechnical');
    });

    it('should expose ui artifact orchestration for v2 changes', () => {
      const context = loadChangeContext(tempDir, 'ui-feature');
      const instructions = generateInstructions(context, 'ui');

      expect(instructions.instruction).toContain('grspec-ui-init');
      expect(instructions.instruction).toContain('grspec-ui-design-system');
      expect(instructions.instruction).not.toContain('grspec-ui`');
    });
  });

  describe('apply instruction context injection', () => {
    it('should include grspec/ui paths in contextFiles.ui', async () => {
      writeV1ChangeArtifacts(changeDir);

      const projectUiDir = path.join(tempDir, 'grspec', 'ui');
      fs.mkdirSync(path.join(projectUiDir, 'pages'), { recursive: true });
      fs.writeFileSync(path.join(projectUiDir, 'MASTER.md'), '# Project MASTER');
      fs.writeFileSync(path.join(projectUiDir, 'pages', 'shell.md'), '# Shell');

      const changePagesDir = path.join(changeDir, 'ui', 'pages');
      fs.mkdirSync(changePagesDir, { recursive: true });
      fs.writeFileSync(path.join(changePagesDir, 'billing.md'), '# Billing');

      const discovered = discoverUiContextFiles(tempDir, changeDir);
      expect(discovered.some((f) => f.endsWith('grspec/ui/MASTER.md'))).toBe(true);
      expect(discovered.some((f) => f.endsWith('ui/pages/billing.md'))).toBe(true);

      const result = await generateApplyInstructions(tempDir, 'ui-feature');
      expect(result.contextFiles.ui).toBeDefined();
      expect(result.contextFiles.ui?.some((f) => f.endsWith('MASTER.md'))).toBe(true);
      expect(result.contextFiles['design-system']).toBeUndefined();
    });

    it('should append UI context guidance when ui files exist', async () => {
      writeV1ChangeArtifacts(changeDir);
      fs.mkdirSync(path.join(tempDir, 'grspec', 'ui'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'grspec', 'ui', 'MASTER.md'), '# MASTER');

      const result = await generateApplyInstructions(tempDir, 'ui-feature');

      expect(result.instruction).toContain('contextFiles.ui');
      expect(result.instruction).toContain('grspec/ui/MASTER.md');
    });

    it('should embed CRITICAL rules when ui-detected is true on v1 change', async () => {
      fs.writeFileSync(
        path.join(changeDir, '.grspec.yaml'),
        'schema: spec-driven\nschemaVersion: 1\nui-detected: true\n'
      );
      writeV1ChangeArtifacts(changeDir);

      const result = await generateApplyInstructions(tempDir, 'ui-feature');

      expect(result.instruction).toContain('CRITICAL UI/UX Rules (mandatory)');
      expect(result.instruction).toContain('grspec ui review');
    });

    it('should NOT embed CRITICAL rules when ui-detected is not set', async () => {
      writeV1ChangeArtifacts(changeDir);

      const result = await generateApplyInstructions(tempDir, 'ui-feature');

      expect(result.instruction).not.toContain('CRITICAL UI/UX Rules');
    });

    it('should NOT embed CRITICAL rules when v2 ui.md has Status na', async () => {
      fs.writeFileSync(
        path.join(changeDir, '.grspec.yaml'),
        'schema: spec-driven\nschemaVersion: 2\nui:\n  detected: true\n'
      );
      writeV1ChangeArtifacts(changeDir);
      fs.writeFileSync(path.join(changeDir, 'ui.md'), '## Status\nna\n');

      const result = await generateApplyInstructions(tempDir, 'ui-feature');

      expect(result.instruction).not.toContain('CRITICAL UI/UX Rules');
      expect(result.uiArtifactStatus).toBe('na');
      expect(result.effectiveUiActive).toBe(false);
    });

    it('should expose apply JSON fields for v2 changes with ui.md', async () => {
      fs.writeFileSync(
        path.join(changeDir, '.grspec.yaml'),
        'schema: spec-driven\nschemaVersion: 2\n'
      );
      writeV1ChangeArtifacts(changeDir);
      fs.writeFileSync(path.join(changeDir, 'ui.md'), '## Status\nblocked\n');
      fs.mkdirSync(path.join(tempDir, 'grspec', 'ui'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'grspec', 'ui', 'MASTER.md'), '# MASTER');

      const result = await generateApplyInstructions(tempDir, 'ui-feature');

      expect(result.schemaVersion).toBe(2);
      expect(result.uiArtifactStatus).toBe('blocked');
      expect(result.uiFoundationReady).toBe(true);
      expect(result.effectiveUiActive).toBe(true);
      expect(result.instruction).toContain('Do NOT mark tasks under plan ## UI');
    });
  });
});
