---
title: "CLI Update Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-update/spec.md
  - src/core/update.ts
related:
  - "[[cli-init]]"
  - "[[template-system]]"
  - "[[profile-tiers]]"
---

# CLI Update Command

`grspec update` refreshes AI tool instructions in a project when new grspec versions are released.

## Usage

```bash
grspec update [--tools tool1,tool2] [--all-tools]
```

## Key Behaviors

- **Skill/Command Refresh** — Regenerates workflow skills and commands for configured AI tools using current templates
- **Tool Selection** — Interactive multi-select for choosing which tools to update; supports `--tools` and `--all-tools` for non-interactive mode
- **Version-Aware** — Updates reflect the latest template improvements from the installed grspec version
- **Non-Destructive** — Only updates generated files; never modifies specs, changes, or user content
- **Legacy Cleanup** — Removes outdated artifacts from previous versions (see [[legacy-cleanup]])
