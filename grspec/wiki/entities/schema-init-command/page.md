---
title: "Schema Init Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/schema-init-command/spec.md
  - src/commands/schema.ts
related:
  - "[[schema-commands]]"
  - "[[schema-resolution]]"
---

# Schema Init Command

`grspec schema init` creates a project-local schema skeleton. See [[schema-commands]] for the full schema command group.

## Modes

- **Interactive** — Prompts for schema name and initial artifact configuration
- **Non-interactive** — Accepts name via argument, uses defaults for structure
