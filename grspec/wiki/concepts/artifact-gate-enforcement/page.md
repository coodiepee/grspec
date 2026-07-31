---
title: "Artifact Gate Enforcement"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/artifact-gate-enforcement/spec.md
  - src/core/artifact-graph/state.ts
related:
  - "[[artifact-graph]]"
  - "[[spec-driven-workflow]]"
  - "[[plan-artifact]]"
  - "[[cli-artifact-workflow]]"
---

# Artifact Gate Enforcement

Gate enforcement ensures that artifacts are created in the correct order and that changes are only archived when implementation is complete. It provides hard blocks at two levels: artifact dependencies and plan completion.

## Artifact Dependency Gates

The `grspec instructions <artifact-id>` command checks that all upstream dependencies (defined by the schema's `requires` array) are satisfied before outputting instructions.

- **Hard block** — Command exits with non-zero code and names the missing dependency
- **Force bypass** — `--force` flag outputs a warning but proceeds anyway
- Cross-platform: all path checks use `path.join()` for Windows compatibility

## Plan Completion Gate

The `grspec archive` command verifies that all checkbox items in `plan.md` are marked complete (`- [x]`) before proceeding.

- **Incomplete items** — Displays the list of unchecked items, suggests `--force`
- **No plan.md** — Proceeds without blocking (plan is optional per schema)
- **Force bypass** — `--force` proceeds with a warning

## Configuration

Gate behavior can be configured in `grspec.yaml`:

```yaml
workflow:
  gates:
    proposal-review: true   # Hard-block design until proposal exists
```

When the `workflow.gates` section is absent, gates apply as hard blocks by default. This default-on behavior ensures workflow discipline without requiring explicit opt-in.
