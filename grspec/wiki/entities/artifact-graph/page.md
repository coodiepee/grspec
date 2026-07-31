---
title: "Artifact Graph (Entity)"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/artifact-graph/spec.md
  - src/core/artifact-graph/graph.ts
  - src/core/artifact-graph/types.ts
related:
  - "[[artifact-gate-enforcement]]"
  - "[[schema-resolution]]"
  - "[[cli-artifact-workflow]]"
---

# Artifact Graph

The `src/core/artifact-graph/` module implements the DAG-based artifact dependency model. See the [[artifact-graph]] concept page for architectural details.

## Module Structure

| File | Purpose |
|------|---------|
| `graph.ts` | Core graph operations (build order, readiness, blocked query) |
| `types.ts` | Zod schemas for `SchemaYaml`, `Artifact`, `ChangeMetadata` |
| `resolver.ts` | Schema directory resolution with precedence chain |
| `schema.ts` | Schema loading and validation |
| `state.ts` | Filesystem-based completion state detection |
| `instruction-loader.ts` | Template loading and enrichment |
| `outputs.ts` | Formatted output for CLI display |
