---
title: "Schema Management Commands"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/schema-init-command/spec.md
  - grspec/specs/schema-validate-command/spec.md
  - grspec/specs/schema-fork-command/spec.md
  - grspec/specs/schema-which-command/spec.md
  - src/commands/schema.ts
related:
  - "[[schema-resolution]]"
  - "[[artifact-graph]]"
---

# Schema Management Commands

The `grspec schema` command group manages workflow schemas — the YAML definitions that control artifact dependencies and change lifecycle.

## Subcommands

### `grspec schema init`

Creates a project-local schema skeleton in `grspec/schemas/<name>/`. Supports interactive and non-interactive modes for naming and initial artifact configuration.

### `grspec schema validate [name]`

Validates schema syntax, structure, templates, and dependency graphs. Checks for cyclic dependencies, missing template references, and invalid artifact configurations.

### `grspec schema fork <source> [target]`

Clones an existing schema (built-in or user) into the project-local schemas directory with safe overwrite controls. Useful for customizing the `spec-driven` schema for team-specific workflows.

### `grspec schema which [name]`

Reports the resolved schema source, location, and fallback details. Shows whether the active schema comes from project-local, user override, or package built-in sources (see [[schema-resolution]]).

## Schema Directory Structure

```
grspec/schemas/<name>/
├── schema.yaml       # Artifact definitions, dependencies, apply phase config
└── templates/        # Instruction templates for each artifact
    ├── proposal.md
    ├── design.md
    ├── specs.md
    └── plan.md
```
