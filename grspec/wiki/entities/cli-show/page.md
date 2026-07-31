---
title: "CLI Show Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-show/spec.md
  - src/commands/show.ts
related:
  - "[[cli-change]]"
  - "[[cli-spec]]"
---

# CLI Show Command

`grspec show` provides interactive and direct display of change and spec content.

## Usage

```bash
grspec show [name] [--type spec|change]
```

## Key Behaviors

- **Interactive Mode** — When no name given, presents selection of available changes and specs
- **Direct Mode** — Shows content of the named change or spec directly
- **Type Disambiguation** — When a name matches both a change and a spec, `--type` flag resolves ambiguity
- **Formatted Output** — Renders change proposals, specs, design docs, and task lists with syntax highlighting
