---
title: "Schema Which Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/schema-which-command/spec.md
  - src/commands/schema.ts
related:
  - "[[schema-commands]]"
  - "[[schema-resolution]]"
---

# Schema Which Command

`grspec schema which [name]` reports the resolved schema source, location, and fallback details. See [[schema-commands]] for the full schema command group.

## Output

Shows whether the active schema comes from:
- **project** — `grspec/schemas/<name>/`
- **user** — `~/.local/share/grspec/schemas/<name>/`
- **package** — Built-in with grspec
