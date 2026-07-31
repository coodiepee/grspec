---
title: "CLI Archive Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-archive/spec.md
  - src/core/archive.ts
related:
  - "[[delta-specs]]"
  - "[[artifact-gate-enforcement]]"
  - "[[spec-driven-workflow]]"
  - "[[wiki-management]]"
  - "[[grsx-archive-skill]]"
---

# CLI Archive Command

`grspec archive` moves completed changes from the active changes directory to the archive folder, applying delta specs to main specs in the process.

## Usage

```bash
grspec archive [change-name] [--yes|-y] [--force] [--skip-specs] [--skip-wiki]
```

## Key Behaviors

- **Change Selection** — Interactive list when no name provided; direct validation when specified
- **Task Completion Check** — Verifies all checkboxes in `plan.md` and `tasks.md` are complete; blocks archiving if incomplete (bypass with `--force`)
- **Delta Spec Application** — Programmatically applies ADDED/MODIFIED/REMOVED/RENAMED requirements to main specs (see [[delta-specs]])
- **Date-Based Naming** — Moves to `archive/YYYY-MM-DD-<change-name>/`
- **Wiki Delta Merge** — If wiki is enabled, merges wiki deltas, generates source summary page, updates index and log (see [[wiki-management]])
- **Skip Options** — `--skip-specs` skips spec application; `--skip-wiki` skips wiki operations
- **Confirmation** — Asks for confirmation unless `--yes` is passed

## Archive Process Order

1. Validate task/plan completion
2. Apply delta specs to main specs
3. Merge wiki deltas (if enabled)
4. Move change directory to archive
5. Display summary of applied changes
