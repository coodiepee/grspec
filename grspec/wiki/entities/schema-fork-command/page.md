---
title: "Schema Fork Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/schema-fork-command/spec.md
  - src/commands/schema.ts
related:
  - "[[schema-commands]]"
  - "[[schema-resolution]]"
---

# Schema Fork Command

`grspec schema fork <source> [target]` clones an existing schema into the project-local schemas directory. See [[schema-commands]] for the full schema command group.

## Behavior

- Copies schema directory from source (built-in or user) to `grspec/schemas/<target>/`
- Safe overwrite controls prevent accidental replacement
- Useful for customizing the default `spec-driven` schema for team-specific workflows
