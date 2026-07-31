import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  parseUiArtifactStatus,
  isUiFoundationReady,
  resolveEffectiveUiActive,
} from '../../../src/core/ui/ui-artifact.js';

describe('ui-artifact', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grspec-ui-artifact-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('parseUiArtifactStatus', () => {
    it('returns na when Status section contains na', () => {
      const uiPath = path.join(tempDir, 'ui.md');
      fs.writeFileSync(
        uiPath,
        '## UI Scope\nDashboard\n\n## Status\nna\n\n## Rationale\nAPI only\n'
      );
      expect(parseUiArtifactStatus(uiPath)).toBe('na');
    });

    it('returns blocked when Status section contains blocked', () => {
      const uiPath = path.join(tempDir, 'ui.md');
      fs.writeFileSync(uiPath, '## Status\nblocked\n');
      expect(parseUiArtifactStatus(uiPath)).toBe('blocked');
    });

    it('returns done when Status section contains done', () => {
      const uiPath = path.join(tempDir, 'ui.md');
      fs.writeFileSync(uiPath, '## Status\ndone\n');
      expect(parseUiArtifactStatus(uiPath)).toBe('done');
    });

    it('returns unknown when Status section is missing', () => {
      const uiPath = path.join(tempDir, 'ui.md');
      fs.writeFileSync(uiPath, '## UI Scope\nBilling page\n');
      expect(parseUiArtifactStatus(uiPath)).toBe('unknown');
    });

    it('returns unknown when Status value is empty', () => {
      const uiPath = path.join(tempDir, 'ui.md');
      fs.writeFileSync(uiPath, '## Status\n\n');
      expect(parseUiArtifactStatus(uiPath)).toBe('unknown');
    });

    it('parses status case-insensitively', () => {
      const uiPath = path.join(tempDir, 'ui.md');
      fs.writeFileSync(uiPath, '## Status\nDONE\n');
      expect(parseUiArtifactStatus(uiPath)).toBe('done');
    });

    it('returns unknown when file does not exist', () => {
      expect(parseUiArtifactStatus(path.join(tempDir, 'missing.md'))).toBe('unknown');
    });
  });

  describe('isUiFoundationReady', () => {
    it('returns true when grspec/ui/MASTER.md exists', () => {
      const masterDir = path.join(tempDir, 'grspec', 'ui');
      fs.mkdirSync(masterDir, { recursive: true });
      fs.writeFileSync(path.join(masterDir, 'MASTER.md'), '# MASTER\n');
      expect(isUiFoundationReady(tempDir)).toBe(true);
    });

    it('returns false when project MASTER is missing', () => {
      expect(isUiFoundationReady(tempDir)).toBe(false);
    });
  });

  describe('resolveEffectiveUiActive', () => {
    it('returns false for v2 change with ui.md Status na', () => {
      const changeDir = path.join(tempDir, 'change');
      fs.mkdirSync(changeDir);
      fs.writeFileSync(
        path.join(changeDir, 'ui.md'),
        '## Status\nna\n'
      );
      expect(
        resolveEffectiveUiActive({
          changeDir,
          schemaVersion: 2,
          uiDetected: true,
        })
      ).toBe(false);
    });

    it('returns true for v2 change with ui.md Status blocked', () => {
      const changeDir = path.join(tempDir, 'change');
      fs.mkdirSync(changeDir);
      fs.writeFileSync(path.join(changeDir, 'ui.md'), '## Status\nblocked\n');
      expect(
        resolveEffectiveUiActive({
          changeDir,
          schemaVersion: 2,
          uiDetected: false,
        })
      ).toBe(true);
    });

    it('returns true for v2 unknown status (conservative gate)', () => {
      const changeDir = path.join(tempDir, 'change');
      fs.mkdirSync(changeDir);
      fs.writeFileSync(path.join(changeDir, 'ui.md'), '## UI Scope\nPage\n');
      expect(
        resolveEffectiveUiActive({
          changeDir,
          schemaVersion: 2,
          uiDetected: false,
        })
      ).toBe(true);
    });

    it('falls back to metadata for v1 without ui.md', () => {
      const changeDir = path.join(tempDir, 'change');
      fs.mkdirSync(changeDir);
      expect(
        resolveEffectiveUiActive({
          changeDir,
          schemaVersion: 1,
          uiDetected: true,
        })
      ).toBe(true);
      expect(
        resolveEffectiveUiActive({
          changeDir,
          schemaVersion: 1,
          uiDetected: false,
        })
      ).toBe(false);
    });
  });
});
