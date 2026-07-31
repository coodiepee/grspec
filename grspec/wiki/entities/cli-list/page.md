---
title: "CLI List Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-list/spec.md
  - src/core/list.ts
related:
  - "[[cli-change]]"
  - "[[cli-spec]]"
  - "[[cli-view]]"
---

# CLI List Command

`grspec list` provides a quick overview of all active changes in the project, showing names and task completion status.

## Usage

```bash
grspec list [--changes] [--specs]
```

## Key Behaviors

- Lists all active changes (excluding archive/) with their names
- Shows task/plan completion percentage for each change
- Supports filtering to show only changes or only specs
- Outputs nothing special when no changes exist (clean empty state)
