---
title: "CLI Artifact Workflow"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-artifact-workflow/spec.md
  - src/commands/workflow/index.ts
  - src/commands/workflow/instructions.ts
  - src/commands/workflow/status.ts
related:
  - "[[artifact-graph]]"
  - "[[artifact-gate-enforcement]]"
  - "[[spec-driven-workflow]]"
  - "[[instruction-loader]]"
---

# CLI Artifact Workflow

The artifact workflow CLI provides subcommands for managing schema-driven change workflows: `status`, `instructions`, `templates`, and setup flows.

## Key Subcommands

- **`grspec status [change]`** — Shows artifact completion state for a change (which artifacts exist, which are blocked, what's next)
- **`grspec instructions <artifact-id> --change <name>`** — Outputs the instruction template for an artifact, with dependency gate enforcement (see [[artifact-gate-enforcement]])
- **`grspec templates`** — Lists available instruction templates for the active schema

## Dependency Enforcement

The `instructions` command checks the [[artifact-graph]] before emitting instructions. If upstream dependencies are incomplete, it exits with an error naming the missing dependency. The `--force` flag bypasses this check with a warning.

## Schema Awareness

All workflow subcommands resolve the active schema using the [[schema-resolution]] precedence chain (CLI flag → change metadata → project config → default).
