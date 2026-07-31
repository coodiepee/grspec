import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadChangeContext } from '../../../src/core/artifact-graph/instruction-loader.js';
import { resolveSchema, resolveSchemaFilePath, getSchemaDir } from '../../../src/core/artifact-graph/resolver.js';
import { resolveChangeSchemaVersion } from '../../../src/utils/change-metadata.js';

describe('schema version resolution', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-ver-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads v1 graph when change metadata omits schemaVersion', () => {
    const changeDir = path.join(tempDir, 'grspec', 'changes', 'legacy');
    fs.mkdirSync(changeDir, { recursive: true });
    fs.writeFileSync(path.join(changeDir, '.grspec.yaml'), 'schema: spec-driven\n');

    const schemaDir = getSchemaDir('spec-driven', tempDir)!;
    expect(fs.existsSync(resolveSchemaFilePath(schemaDir, 1))).toBe(true);
    expect(resolveChangeSchemaVersion(changeDir, tempDir)).toBe(1);

    const context = loadChangeContext(tempDir, 'legacy');
    expect(context.schemaVersion).toBe(1);
    expect(context.graph.getAllArtifacts().map((a) => a.id)).toEqual([
      'proposal',
      'specs',
      'design',
      'plan',
    ]);
  });

  it('loads v2 graph when change metadata has schemaVersion 2', () => {
    const changeDir = path.join(tempDir, 'grspec', 'changes', 'modern');
    fs.mkdirSync(changeDir, { recursive: true });
    fs.writeFileSync(
      path.join(changeDir, '.grspec.yaml'),
      'schema: spec-driven\nschemaVersion: 2\n'
    );

    const context = loadChangeContext(tempDir, 'modern');
    expect(context.schemaVersion).toBe(2);
    expect(context.graph.getAllArtifacts().map((a) => a.id)).toContain('ui');
  });

  it('resolveSchema without version returns v2 main schema', () => {
    const schema = resolveSchema('spec-driven');
    expect(schema.version).toBe(2);
    expect(schema.artifacts.some((a) => a.id === 'ui')).toBe(true);
  });

  it('resolveSchema with version 1 returns frozen v1 schema', () => {
    const schema = resolveSchema('spec-driven', undefined, 1);
    expect(schema.version).toBe(1);
    expect(schema.artifacts.some((a) => a.id === 'ui')).toBe(false);
  });
});
