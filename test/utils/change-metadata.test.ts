import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import {
  writeChangeMetadata,
  readChangeMetadata,
  resolveSchemaForChange,
  validateSchemaName,
  ChangeMetadataError,
} from '../../src/utils/change-metadata.js';
import { ChangeMetadataSchema, TouchesEntrySchema } from '../../src/core/artifact-graph/types.js';

describe('ChangeMetadataSchema', () => {
  describe('valid metadata', () => {
    it('should accept valid schema with created date', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        created: '2025-01-05',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schema).toBe('spec-driven');
        expect(result.data.created).toBe('2025-01-05');
      }
    });

    it('should accept valid schema without created date', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'custom-schema',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schema).toBe('custom-schema');
        expect(result.data.created).toBeUndefined();
      }
    });
  });

  describe('stack metadata fields', () => {
    it('should accept dependsOn as array of strings', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        dependsOn: ['add-auth', 'add-database'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dependsOn).toEqual(['add-auth', 'add-database']);
      }
    });

    it('should accept provides as array of strings', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        provides: ['auth-middleware', 'session-store'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provides).toEqual(['auth-middleware', 'session-store']);
      }
    });

    it('should accept requires as array of strings', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        requires: ['database-connection'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requires).toEqual(['database-connection']);
      }
    });

    it('should accept parent as a string', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        parent: 'add-full-auth-system',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parent).toBe('add-full-auth-system');
      }
    });

    it('should accept touches as array of file-level entries', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        touches: [
          { path: 'src/api/middleware/index.ts', intent: 'Register rate-limit middleware', mode: 'modify' },
          { path: 'src/config/rate-limits.ts', intent: 'Define rate limit thresholds', mode: 'create' },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.touches).toHaveLength(2);
        expect(result.data.touches![0]).toEqual({
          path: 'src/api/middleware/index.ts',
          intent: 'Register rate-limit middleware',
          mode: 'modify',
        });
      }
    });

    it('should accept all stack fields together', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        created: '2025-01-10',
        dependsOn: ['add-auth'],
        provides: ['rate-limiting'],
        requires: ['auth-middleware'],
        parent: 'add-full-system',
        touches: [
          { path: 'src/middleware.ts', intent: 'Add rate limiter', mode: 'modify' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should default optional stack fields to undefined when not provided', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dependsOn).toBeUndefined();
        expect(result.data.provides).toBeUndefined();
        expect(result.data.requires).toBeUndefined();
        expect(result.data.parent).toBeUndefined();
        expect(result.data.touches).toBeUndefined();
      }
    });

    it('should accept empty arrays for dependsOn/provides/requires', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        dependsOn: [],
        provides: [],
        requires: [],
      });
      expect(result.success).toBe(true);
    });

    it('should reject touches with invalid mode', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        touches: [
          { path: 'src/foo.ts', intent: 'Do something', mode: 'unknown' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject touches missing path field', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        touches: [
          { intent: 'Do something', mode: 'modify' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject touches missing intent field', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        touches: [
          { path: 'src/foo.ts', mode: 'modify' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-string elements in dependsOn', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        dependsOn: [123],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TouchesEntrySchema', () => {
    it('should accept valid touches entry with create mode', () => {
      const result = TouchesEntrySchema.safeParse({
        path: 'src/new-file.ts',
        intent: 'Create new service module',
        mode: 'create',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid touches entry with modify mode', () => {
      const result = TouchesEntrySchema.safeParse({
        path: 'src/existing.ts',
        intent: 'Add new export',
        mode: 'modify',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid touches entry with delete mode', () => {
      const result = TouchesEntrySchema.safeParse({
        path: 'src/deprecated.ts',
        intent: 'Remove deprecated module',
        mode: 'delete',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty path', () => {
      const result = TouchesEntrySchema.safeParse({
        path: '',
        intent: 'Something',
        mode: 'modify',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty intent', () => {
      const result = TouchesEntrySchema.safeParse({
        path: 'src/foo.ts',
        intent: '',
        mode: 'modify',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('backward compatibility', () => {
    it('should still work without any stack metadata fields', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        created: '2025-01-05',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dependsOn).toBeUndefined();
        expect(result.data.provides).toBeUndefined();
        expect(result.data.requires).toBeUndefined();
        expect(result.data.touches).toBeUndefined();
        expect(result.data.parent).toBeUndefined();
      }
    });

    it('should accept legacy capability-level touches (string array) with coercion', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        touches: ['cli-init', 'cli-update'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.touches).toEqual([
          { path: 'cli-init', intent: '(legacy capability reference)', mode: 'modify' },
          { path: 'cli-update', intent: '(legacy capability reference)', mode: 'modify' },
        ]);
      }
    });

    it('should pass through unknown fields without failing (passthrough)', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        unknownField: 'some-value',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ui metadata', () => {
    it('should accept structured ui block with detected and keywords', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        ui: {
          detected: true,
          keywords: ['dashboard', 'chart', 'responsive'],
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.uiDetected).toBe(true);
        expect(result.data.uiKeywords).toEqual(['dashboard', 'chart', 'responsive']);
      }
    });

    it('should reject ui block with autoGenerate field', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        ui: {
          detected: true,
          autoGenerate: false,
        },
      });
      expect(result.success).toBe(false);
    });

    it('should derive uiDetected and empty uiKeywords from legacy ui-detected', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        'ui-detected': true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.uiDetected).toBe(true);
        expect(result.data.uiKeywords).toEqual([]);
      }
    });

    it('should prefer ui block over legacy ui-detected on conflict', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        'ui-detected': false,
        ui: {
          detected: true,
          keywords: ['ui'],
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.uiDetected).toBe(true);
        expect(result.data.uiKeywords).toEqual(['ui']);
      }
    });

    it('should default uiDetected to false when no ui fields present', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.uiDetected).toBe(false);
        expect(result.data.uiKeywords).toEqual([]);
      }
    });
  });

  describe('invalid metadata', () => {
    it('should reject empty schema', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing schema', () => {
      const result = ChangeMetadataSchema.safeParse({
        created: '2025-01-05',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        created: '01/05/2025', // Wrong format
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-ISO date format', () => {
      const result = ChangeMetadataSchema.safeParse({
        schema: 'spec-driven',
        created: '2025-1-5', // Missing leading zeros
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('writeChangeMetadata', () => {
  let testDir: string;
  let changeDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `grspec-test-${randomUUID()}`);
    changeDir = path.join(testDir, 'grspec', 'changes', 'test-change');
    await fs.mkdir(changeDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should write valid YAML metadata file', async () => {
    writeChangeMetadata(changeDir, {
      schema: 'spec-driven',
      created: '2025-01-05',
    });

    const metaPath = path.join(changeDir, '.grspec.yaml');
    const content = await fs.readFile(metaPath, 'utf-8');

    expect(content).toContain('schema: spec-driven');
    expect(content).toContain('created: 2025-01-05');
  });

  it('should throw error for unknown schema', () => {
    expect(() =>
      writeChangeMetadata(changeDir, {
        schema: 'unknown-schema',
        created: '2025-01-05',
      })
    ).toThrow(/Unknown schema 'unknown-schema'/);
  });
});

describe('readChangeMetadata', () => {
  let testDir: string;
  let changeDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `grspec-test-${randomUUID()}`);
    changeDir = path.join(testDir, 'grspec', 'changes', 'test-change');
    await fs.mkdir(changeDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should return null when no metadata file exists', () => {
    const result = readChangeMetadata(changeDir);
    expect(result).toBeNull();
  });

  it('should read valid metadata', async () => {
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(
      metaPath,
      'schema: spec-driven\ncreated: "2025-01-05"\n',
      'utf-8'
    );

    const result = readChangeMetadata(changeDir);
    expect(result).toEqual({
      schema: 'spec-driven',
      created: '2025-01-05',
      uiDetected: false,
      uiKeywords: [],
    });
  });

  it('should resolve ui block into uiDetected and uiKeywords', async () => {
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(
      metaPath,
      'schema: spec-driven\nui:\n  detected: true\n  keywords: [layout, color]\n',
      'utf-8'
    );

    const result = readChangeMetadata(changeDir);
    expect(result?.uiDetected).toBe(true);
    expect(result?.uiKeywords).toEqual(['layout', 'color']);
  });

  it('should throw ChangeMetadataError for invalid YAML', async () => {
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, '{ invalid yaml', 'utf-8');

    expect(() => readChangeMetadata(changeDir)).toThrow(ChangeMetadataError);
  });

  it('should throw ChangeMetadataError for missing schema field', async () => {
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, 'created: "2025-01-05"\n', 'utf-8');

    expect(() => readChangeMetadata(changeDir)).toThrow(ChangeMetadataError);
  });

  it('should throw ChangeMetadataError for unknown schema', async () => {
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, 'schema: unknown-schema\n', 'utf-8');

    expect(() => readChangeMetadata(changeDir)).toThrow(/Unknown schema/);
  });
});

describe('resolveSchemaForChange', () => {
  let testDir: string;
  let changeDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `grspec-test-${randomUUID()}`);
    changeDir = path.join(testDir, 'grspec', 'changes', 'test-change');
    await fs.mkdir(changeDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should return explicit schema when provided', async () => {
    // Even with metadata file, explicit schema wins
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    const result = resolveSchemaForChange(changeDir, 'custom-schema');
    expect(result).toBe('custom-schema');
  });

  it('should return schema from metadata when no explicit schema', async () => {
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('spec-driven');
  });

  it('should return default when no metadata and no explicit schema', () => {
    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('spec-driven');
  });

  it('should return default when metadata read fails', async () => {
    // Create an invalid metadata file
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, '{ invalid yaml', 'utf-8');

    // Should fall back to default, not throw
    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('spec-driven');
  });

  it('should use project config schema when no metadata exists', async () => {
    // Create project config
    const configDir = path.join(testDir, 'grspec');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'grspec.yaml'),
      'schema: custom-schema\n',
      'utf-8'
    );

    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('custom-schema');
  });

  it('should prefer change metadata over project config', async () => {
    // Create project config
    const configDir = path.join(testDir, 'grspec');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'grspec.yaml'),
      'schema: custom-schema\n',
      'utf-8'
    );

    // Create change metadata with different schema
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    const result = resolveSchemaForChange(changeDir);
    expect(result).toBe('spec-driven'); // Change metadata wins
  });

  it('should prefer explicit schema over all config sources', async () => {
    // Create project config
    const configDir = path.join(testDir, 'grspec');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'grspec.yaml'),
      'schema: custom-schema\n',
      'utf-8'
    );

    // Create change metadata
    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    // Explicit schema should win
    const result = resolveSchemaForChange(changeDir, 'custom-schema');
    expect(result).toBe('custom-schema');
  });

  it('should test full precedence order: CLI > metadata > config > default', async () => {
    // Setup all levels
    const configDir = path.join(testDir, 'grspec');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(
      path.join(configDir, 'grspec.yaml'),
      'schema: custom-schema\n',
      'utf-8'
    );

    const metaPath = path.join(changeDir, '.grspec.yaml');
    await fs.writeFile(metaPath, 'schema: spec-driven\n', 'utf-8');

    // Test each level
    expect(resolveSchemaForChange(changeDir, 'custom-schema')).toBe('custom-schema'); // CLI wins
    expect(resolveSchemaForChange(changeDir)).toBe('spec-driven'); // Metadata wins when no CLI

    // Remove metadata, config should win
    await fs.unlink(metaPath);
    expect(resolveSchemaForChange(changeDir)).toBe('custom-schema'); // Config wins

    // Remove config, default should win
    await fs.unlink(path.join(configDir, 'grspec.yaml'));
    expect(resolveSchemaForChange(changeDir)).toBe('spec-driven'); // Default wins
  });
});

describe('validateSchemaName', () => {
  it('should accept valid schema name', () => {
    expect(() => validateSchemaName('spec-driven')).not.toThrow();
  });

  it('should throw for unknown schema', () => {
    expect(() => validateSchemaName('unknown-schema')).toThrow(
      /Unknown schema 'unknown-schema'/
    );
  });
});
