---
title: "CLI Change Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-change/spec.md
  - src/commands/change.ts
related:
  - "[[cli-list]]"
  - "[[cli-validate]]"
  - "[[spec-driven-workflow]]"
  - "[[change-creation]]"
---

# CLI Change Command

`grspec change` provides subcommands for showing, listing, and validating change proposals and their delta specs.

## Usage

```bash
grspec change show [change-name]
grspec change list
grspec change validate [change-name]
```

## Key Behaviors

- **Show** — Displays change content including proposal, specs, design, tasks/plan with formatted output
- **List** — Lists all active changes with progress metrics (delegates to the same logic as `grspec list --changes`)
- **Validate** — Validates change structure, delta spec format, and requirement header uniqueness

## Relationship to Other Commands

The `change` noun-based command is maintained for backward compatibility. The verb-first equivalents (`grspec show`, `grspec list`, `grspec validate`) are the preferred modern interface per the [[grspec-conventions]] verb-noun CLI structure.
