---
title: "Plan Artifact"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/plan-artifact/spec.md
related:
  - "[[artifact-graph]]"
  - "[[artifact-gate-enforcement]]"
  - "[[spec-driven-workflow]]"
---

# Plan Artifact

The `plan` artifact is the implementation checklist in the spec-driven schema. It sits between design/specs and the apply phase, providing a checkbox-based task list for implementation tracking.

## Dependency Chain

```
proposal → design ─┐
                    ├── plan → apply
proposal → specs  ─┘
```

The plan requires both `design` and `specs` artifacts to be complete before it can be created. The apply phase requires plan completion (all checkboxes checked).

## Completion Tracking

Plan completion is determined by checkbox analysis in `plan.md`:

- `- [ ]` (unchecked) → Incomplete item, blocks plan completion
- `- [x]` (checked) → Complete item

This uses the same checkbox parsing mechanism as the legacy `tasks.md` tracking. When all items are checked, the plan artifact is marked as `done` in the [[artifact-graph]].

## Template Format

The plan template generates a structured markdown file with implementation tasks organized by area, each as a checkbox item. Tasks are derived from the design and specs artifacts.
