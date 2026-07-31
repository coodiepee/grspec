---
title: "Artifact Gate Enforcement (Entity)"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/artifact-gate-enforcement/spec.md
  - src/core/artifact-graph/state.ts
related:
  - "[[artifact-graph]]"
  - "[[cli-artifact-workflow]]"
  - "[[plan-artifact]]"
---

# Artifact Gate Enforcement

Implements the dependency and completion gate checks described in the [[artifact-gate-enforcement]] concept page. The gate logic lives in the artifact graph state module and is consumed by the `grspec instructions` and `grspec archive` commands.

## Two Gate Types

1. **Artifact dependency gate** — Blocks `grspec instructions` when upstream artifacts are incomplete
2. **Plan completion gate** — Blocks `grspec archive` when `plan.md` has unchecked items

Both gates support `--force` bypass and configurable strictness via `grspec.yaml` workflow gates.
