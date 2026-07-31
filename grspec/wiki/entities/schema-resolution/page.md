---
title: "Schema Resolution (Entity)"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/schema-resolution/spec.md
  - src/core/artifact-graph/resolver.ts
  - src/core/artifact-graph/schema.ts
related:
  - "[[artifact-graph]]"
  - "[[schema-commands]]"
  - "[[config-loading]]"
---

# Schema Resolution

Implements the schema resolution precedence chain described in the [[schema-resolution]] concept page. The resolver module handles directory lookup, fuzzy error matching, and the `listSchemasWithInfo()` API.

## Key Functions

- `getSchemaDir(name, projectRoot?)` — Resolves schema directory with three-tier precedence
- `getProjectSchemasDir(projectRoot)` — Returns project-local schemas path
- `listSchemas(projectRoot?)` — Lists all available schema names
- `listSchemasWithInfo(projectRoot?)` — Lists schemas with source labels (project/user/package)
