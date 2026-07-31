---
title: "Config Loading"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/config-loading/spec.md
  - src/core/project-config.ts
  - src/core/config.ts
related:
  - "[[project-config]]"
  - "[[context-injection]]"
  - "[[schema-resolution]]"
---

# Config Loading

Config loading discovers, parses, validates, and exposes the project configuration file (`grspec/grspec.yaml`) with safe fallbacks.

## Discovery

The system checks for the config file at `grspec/grspec.yaml` (preferred) or `grspec/grspec.yml` (alias). When both exist, `.yaml` takes precedence. If neither exists, the system returns null without error.

## Resilient Parsing

Config fields are parsed independently using Zod validation. Invalid fields are logged as warnings and excluded, while valid fields are retained. This field-by-field approach ensures that a typo in one field doesn't break the entire config.

### Supported Fields

| Field | Type | Purpose |
|-------|------|---------|
| `schema` | string | Default workflow schema name |
| `context` | string (≤50KB) | Project context injected into instructions |
| `rules` | object | Per-artifact rules (specs, tasks, design) |
| `wiki` | object | Wiki configuration (enabled, categories, auto-ingest) |

## Error Handling

- **Invalid YAML syntax** — Warning logged, returns null
- **Schema validation failure** — Warning with details, returns null
- **Context exceeds 50KB** — Warning with size info, context field excluded
- **Invalid rules structure** — Per-field warnings, valid rules retained
- **Parse failure during commands** — Command continues with defaults (e.g., `spec-driven` schema)

## Deferred Validation

Artifact IDs in the `rules` section are not validated at config load time. Validation occurs during instruction loading when the active schema is known.
