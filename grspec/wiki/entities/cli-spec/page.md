---
title: "CLI Spec Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-spec/spec.md
  - src/commands/spec.ts
related:
  - "[[cli-show]]"
  - "[[cli-validate]]"
  - "[[grspec-conventions]]"
---

# CLI Spec Command

`grspec spec` provides subcommands for listing, showing, and validating source-of-truth specifications.

## Usage

```bash
grspec spec list
grspec spec show [spec-name]
grspec spec validate [spec-name]
```

## Key Behaviors

- **List** — Shows all specs in `grspec/specs/` with requirement counts
- **Show** — Displays spec content with formatted requirement/scenario sections
- **Validate** — Checks spec structure (requirement headers, scenario format, frontmatter)
- Specs are the source of truth for what IS currently built and deployed
