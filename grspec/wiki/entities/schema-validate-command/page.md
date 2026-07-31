---
title: "Schema Validate Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/schema-validate-command/spec.md
  - src/commands/schema.ts
related:
  - "[[schema-commands]]"
  - "[[schema-resolution]]"
---

# Schema Validate Command

`grspec schema validate [name]` validates schema syntax, structure, templates, and dependency graphs. See [[schema-commands]] for the full schema command group.

## Checks

- YAML syntax validation
- Required fields presence (name, version, artifacts)
- Dependency graph acyclicity
- Template file existence
- Artifact ID uniqueness
