import { promises as fs } from 'fs';
import path from 'path';
import * as yaml from 'yaml';

export class SplitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SplitError';
  }
}

export interface SplitOptions {
  children: string[];
  overwrite?: boolean;
}

export interface SplitResult {
  parent: string;
  children: string[];
}

export async function splitChange(
  changesPath: string,
  sourceChangeId: string,
  options: SplitOptions
): Promise<SplitResult> {
  const sourceDir = path.join(changesPath, sourceChangeId);

  try {
    await fs.access(sourceDir);
  } catch {
    throw new SplitError(`Source change "${sourceChangeId}" not found at ${sourceDir}`);
  }

  // Read source metadata for schema
  let sourceSchema = 'spec-driven';
  const sourceMetaPath = path.join(sourceDir, '.grspec.yaml');
  try {
    const metaContent = await fs.readFile(sourceMetaPath, 'utf-8');
    const parsed = yaml.parse(metaContent);
    if (parsed?.schema) sourceSchema = parsed.schema;
  } catch {
    // Use default
  }

  // Check for existing children (unless overwrite)
  if (!options.overwrite) {
    for (const childName of options.children) {
      const childDir = path.join(changesPath, childName);
      try {
        await fs.access(childDir);
        throw new SplitError(
          `Child change "${childName}" already exists. Use --overwrite / --force to regenerate.`
        );
      } catch (err) {
        if (err instanceof SplitError) throw err;
      }
    }
  }

  // Create child changes
  for (let i = 0; i < options.children.length; i++) {
    const childName = options.children[i];
    const childDir = path.join(changesPath, childName);

    if (options.overwrite) {
      await fs.rm(childDir, { recursive: true, force: true });
    }

    await fs.mkdir(childDir, { recursive: true });

    // Build metadata
    const childMeta: Record<string, unknown> = {
      schema: sourceSchema,
      created: new Date().toISOString().split('T')[0],
      parent: sourceChangeId,
    };

    if (i > 0) {
      childMeta.dependsOn = [options.children[i - 1]];
    }

    await fs.writeFile(
      path.join(childDir, '.grspec.yaml'),
      yaml.stringify(childMeta),
      'utf-8'
    );

    // Generate stub proposal
    const proposalContent = `## Why

Split from parent change \`${sourceChangeId}\` (slice ${i + 1}/${options.children.length}).

## What Changes

<!-- TODO: Describe what this slice implements -->

## Capabilities

### Modified Capabilities

<!-- TODO: List capabilities modified by this slice -->
`;

    await fs.writeFile(path.join(childDir, 'proposal.md'), proposalContent, 'utf-8');

    const planContent = `## 1. Implementation

- [ ] 1.1 Define implementation tasks for ${childName} [manual]
`;

    await fs.writeFile(path.join(childDir, 'plan.md'), planContent, 'utf-8');
  }

  // Mark source as split parent
  try {
    const metaContent = await fs.readFile(sourceMetaPath, 'utf-8');
    const parsed = yaml.parse(metaContent) ?? {};
    parsed.split = true;
    await fs.writeFile(sourceMetaPath, yaml.stringify(parsed), 'utf-8');
  } catch {
    await fs.writeFile(
      sourceMetaPath,
      yaml.stringify({ schema: sourceSchema, split: true }),
      'utf-8'
    );
  }

  return {
    parent: sourceChangeId,
    children: options.children,
  };
}
