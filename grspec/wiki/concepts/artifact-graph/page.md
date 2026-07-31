---
title: "Artifact Graph"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/artifact-graph/spec.md
  - src/core/artifact-graph/graph.ts
  - src/core/artifact-graph/types.ts
  - src/core/artifact-graph/resolver.ts
related:
  - "[[schema-resolution]]"
  - "[[artifact-gate-enforcement]]"
  - "[[spec-driven-workflow]]"
  - "[[plan-artifact]]"
---

# Artifact Graph

The artifact graph is a directed acyclic graph (DAG) that models dependencies between artifacts in a schema-driven workflow. It is the engine that determines build order, readiness, and completion state for changes.

## How It Works

Each workflow schema (e.g., `spec-driven`) defines a set of artifacts with dependency relationships. The artifact graph loads these definitions from `schema.yaml` files and provides:

- **Schema Loading** — Parses YAML schema files, validates required fields, detects cyclic dependencies and duplicate IDs
- **Build Order Calculation** — Computes topological sort for artifact creation order (handles linear chains, diamond patterns, and independent artifacts)
- **State Detection** — Scans the filesystem to determine which artifacts are completed (supports simple file existence and glob patterns like `specs/*.md`)
- **Ready Artifact Query** — Identifies which artifacts can be created next based on dependency completion
- **Blocked Query** — Reports which artifacts are blocked and lists their unmet dependencies
- **Completion Check** — Determines when all artifacts in the graph are complete

## Schema Directory Structure

Schemas are self-contained directories with co-located templates:

```
schemas/<name>/
├── schema.yaml       # Artifact definitions and dependencies
└── templates/        # Instruction templates for each artifact
```

Resolution follows a three-tier precedence: project-local → user override → package built-in (see [[schema-resolution]]).

## Plan Artifact Lifecycle

The `plan` artifact has special lifecycle tracking. Its completion depends on checkbox completion in `plan.md` — all `- [ ]` items must be checked before the artifact is considered done. This gates the apply phase (see [[artifact-gate-enforcement]]).

## Key Types

- `SchemaYaml` — Full schema definition with name, version, and artifacts array
- `Artifact` — Single artifact with id, generates pattern, template, and requires array
- `ApplyPhase` — Configuration for when apply becomes available
- `ChangeMetadata` — Per-change metadata including schema binding and stack information
