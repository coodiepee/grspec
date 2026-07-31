import { z } from 'zod';

// Artifact definition schema
export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: 'Artifact ID is required' }),
  generates: z.string().min(1, { error: 'generates field is required' }),
  description: z.string(),
  template: z.string().min(1, { error: 'template field is required' }),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});

// Apply phase configuration for schema-aware apply instructions
export const ApplyPhaseSchema = z.object({
  // Artifact IDs that must exist before apply is available
  requires: z.array(z.string()).min(1, { error: 'At least one required artifact' }),
  // Path to file with checkboxes for progress (relative to change dir), or null if no tracking
  tracks: z.string().nullable().optional(),
  // Custom guidance for the apply phase
  instruction: z.string().optional(),
});

// Full schema YAML structure
export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: 'Schema name is required' }),
  version: z.number().int().positive({ error: 'Version must be a positive integer' }),
  description: z.string().optional(),
  artifacts: z.array(ArtifactSchema).min(1, { error: 'At least one artifact required' }),
  // Optional apply phase configuration (for schema-aware apply instructions)
  apply: ApplyPhaseSchema.optional(),
});

// Derived TypeScript types
export type Artifact = z.infer<typeof ArtifactSchema>;
export type ApplyPhase = z.infer<typeof ApplyPhaseSchema>;
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;

// File-level impact declaration with semantic intent
export const TouchesEntrySchema = z.object({
  path: z.string().min(1, { message: 'path is required' }),
  intent: z.string().min(1, { message: 'intent is required' }),
  mode: z.enum(['create', 'modify', 'delete'], {
    message: 'mode must be create, modify, or delete',
  }),
});

export type TouchesEntry = z.infer<typeof TouchesEntrySchema>;

export const UiMetadataSchema = z.object({
  detected: z.boolean(),
  keywords: z.array(z.string()).default([]),
}).strict();

export type UiMetadata = z.infer<typeof UiMetadataSchema>;

// Per-change metadata schema
// Note: schema field is validated at parse time against available schemas
// using a lazy import to avoid circular dependencies
export const ChangeMetadataSchema = z
  .object({
    // Required: which workflow schema this change uses
    schema: z.string().min(1, { message: 'schema is required' }),

    // Optional: creation timestamp (ISO date string)
    created: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'created must be YYYY-MM-DD format',
      })
      .optional(),

    // Stack metadata: dependency ordering
    dependsOn: z.array(z.string()).optional(),

    // Stack metadata: capability markers this change exposes
    provides: z.array(z.string()).optional(),

    // Stack metadata: capability markers this change needs
    requires: z.array(z.string()).optional(),

    // Stack metadata: parent change for split work
    parent: z.string().optional(),

    // Stack metadata: file-level impact declarations (accepts legacy string arrays)
    touches: z
      .array(z.union([TouchesEntrySchema, z.string()]))
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        return val.map((entry) => {
          if (typeof entry === 'string') {
            return { path: entry, intent: '(legacy capability reference)', mode: 'modify' as const };
          }
          return entry;
        });
      }),

    // UI workflow integration: set when UI content is detected in the change
    'ui-detected': z.boolean().optional(),

    // Structured UI workflow metadata (preferred over ui-detected)
    ui: UiMetadataSchema.optional(),

    // Schema graph version: 2 for new changes; omitted defaults to 1 at resolution time
    schemaVersion: z.number().int().positive().optional(),
  })
  .passthrough()
  .transform((data) => {
    const uiDetected =
      data.ui !== undefined ? data.ui.detected : data['ui-detected'] === true;
    const uiKeywords = data.ui?.keywords ?? [];

    return {
      ...data,
      uiDetected,
      uiKeywords,
    };
  });

export type ChangeMetadata = z.input<typeof ChangeMetadataSchema>;
export type ChangeMetadataParsed = z.output<typeof ChangeMetadataSchema>;

// Runtime state types (not Zod - internal only)

// Slice 1: Simple completion tracking via filesystem
export type CompletedSet = Set<string>;

// Return type for blocked query
export interface BlockedArtifacts {
  [artifactId: string]: string[];
}

