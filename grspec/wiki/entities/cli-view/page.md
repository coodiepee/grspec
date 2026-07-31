---
title: "CLI View Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-view/spec.md
  - src/core/view.ts
related:
  - "[[cli-list]]"
  - "[[cli-show]]"
---

# CLI View Command

`grspec view` provides a comprehensive dashboard view of the project state, displaying specifications, changes, and progress metrics in a unified format.

## Usage

```bash
grspec view
```

## Key Behaviors

- **Summary Section** — Total specs, requirements, draft/active/completed changes, overall task progress percentage
- **Active Changes** — Visual progress indicators for each in-progress change
- **Completed Changes** — Recent archived changes with completion dates
- **Specifications** — List of all specs with requirement counts
- **Error Handling** — Shows "No grspec directory found" when run outside a grspec project
