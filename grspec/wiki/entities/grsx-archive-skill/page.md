---
title: "GRSX Archive Skill"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/grsx-archive-skill/spec.md
  - src/core/templates/workflows/archive-change.ts
related:
  - "[[cli-archive]]"
  - "[[spec-driven-workflow]]"
  - "[[specs-sync-skill]]"
  - "[[artifact-graph]]"
---

# GRSX Archive Skill

The `/grsx:archive` skill guides AI agents through the archive workflow — checking readiness, prompting for spec sync, executing the archive, and reporting results.

## Workflow

1. **Change Selection** — Prompt user to select from active changes (or accept named change)
2. **Artifact Completion Check** — Verify all schema artifacts are complete via [[artifact-graph]]
3. **Task Completion Check** — Verify all plan/task checkboxes are checked
4. **Spec Sync Prompt** — Ask user if they want to sync delta specs to main specs (see [[specs-sync-skill]])
5. **Archive Execution** — Move change to `archive/YYYY-MM-DD-<name>/`
6. **Wiki Delta Merge** — Merge wiki deltas if wiki is enabled
7. **Success Report** — Display archived location and summary

## Readiness Blocks

- Incomplete artifacts block archive (suggests completing missing artifacts)
- Incomplete tasks block archive (lists incomplete items, suggests `--force`)
- Missing spec sync is warned about but doesn't block
