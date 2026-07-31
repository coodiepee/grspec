---
title: "Schema Resolution"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/schema-resolution/spec.md
  - src/core/artifact-graph/resolver.ts
  - src/core/artifact-graph/schema.ts
related:
  - "[[artifact-graph]]"
  - "[[config-loading]]"
  - "[[schema-commands]]"
---

# Schema Resolution

Schema resolution determines which workflow schema a change uses. It follows a multi-tier precedence system for both schema selection (which schema name) and schema directory lookup (where to find it).

## Schema Name Precedence

When resolving which schema to use for a change:

1. **CLI flag** (`--schema custom`) — Highest priority
2. **Change metadata** (`.grspec.yaml` → `schema: bound`) — Per-change binding
3. **Project config** (`grspec/grspec.yaml` → `schema: tdd`) — Project default
4. **Hardcoded default** (`spec-driven`) — Fallback

## Directory Lookup Precedence

When resolving where to find a schema's files:

1. **Project-local** (`./grspec/schemas/<name>/schema.yaml`) — Team-specific schemas
2. **User override** (`~/.local/share/grspec/schemas/<name>/schema.yaml`) — Personal customizations
3. **Package built-in** (bundled with grspec) — Default schemas

## Error Handling

When a schema name cannot be resolved:

- **Typo detection** — Fuzzy matching suggests close alternatives (e.g., "spce-driven" → "Did you mean: spec-driven?")
- **Available schemas list** — Displays all valid schemas with source labels (project, user, package)
- **Fix instructions** — Tells the user how to update their config

## Built-in Schemas

grspec ships with the `spec-driven` schema, which defines the standard artifact workflow: proposal → design → specs → plan → apply → archive.

## Backward Compatibility

Changes created before the config feature continue to work. Calling `getSchemaDir()` without `projectRoot` skips the project-local tier and only checks user override and package built-in.
