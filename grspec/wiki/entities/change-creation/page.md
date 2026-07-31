---
title: "Change Creation"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/change-creation/spec.md
  - src/utils/change-utils.ts
  - src/utils/change-metadata.ts
related:
  - "[[spec-driven-workflow]]"
  - "[[artifact-graph]]"
  - "[[cli-change]]"
---

# Change Creation

The change creation module provides programmatic utilities for creating and validating grspec change directories.

## Responsibilities

- **Directory Scaffolding** — Creates the change directory structure under `grspec/changes/<name>/`
- **Metadata Generation** — Writes `.grspec.yaml` with schema binding, creation date, and optional stack metadata (`dependsOn`, `provides`, `requires`, `parent`, `touches`)
- **Name Validation** — Enforces hyphenated lowercase naming conventions
- **Duplicate Detection** — Checks for existing changes with the same name

## Change Metadata Schema

```yaml
schema: spec-driven
created: 2026-05-22
dependsOn: []        # Other changes this depends on
provides: []         # Capability markers this change exposes
requires: []         # Capability markers this change needs
parent: null         # Parent change for split work
touches: []          # File-level impact declarations
```

The `touches` field supports both legacy string arrays and structured entries with `{ path, intent, mode }` objects for file-level impact tracking.
