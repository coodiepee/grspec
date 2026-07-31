---
title: "Instruction Loader"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/instruction-loader/spec.md
  - src/core/artifact-graph/instruction-loader.ts
related:
  - "[[context-injection]]"
  - "[[rules-injection]]"
  - "[[artifact-graph]]"
  - "[[schema-resolution]]"
---

# Instruction Loader

The instruction loader is the core module that loads instruction templates from schema directories, enriches them with project context and metadata, and produces ready-to-use instructions for AI agents.

## Responsibilities

1. **Template Loading** — Loads markdown templates from `schemas/<name>/templates/<path>` directories
2. **Change Context Loading** — Combines artifact graph state, completion set, schema name, and change info into a unified context object
3. **Template Enrichment** — Injects change-specific metadata into templates:
   - Change name, artifact ID, schema name, output path
   - Dependency status (which artifacts are completed, which are blocked)
   - Project context via `<context>` tags (see [[context-injection]])
   - Per-artifact rules (see [[rules-injection]])
4. **Parameter Substitution** — Replaces template variables with actual values

## Pipeline

```
Schema Directory → Template File → Enrichment → Context Injection → Rules Injection → Final Instructions
```

The instruction loader is consumed by the `grspec instructions` command (see [[cli-artifact-workflow]]) and by skill template generation.
