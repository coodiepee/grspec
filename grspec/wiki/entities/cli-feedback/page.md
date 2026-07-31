---
title: "CLI Feedback Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-feedback/spec.md
  - src/commands/feedback.ts
related:
  - "[[cli-init]]"
---

# CLI Feedback Command

`grspec feedback` creates GitHub issues safely via the `gh` CLI, with a manual fallback when automation is unavailable.

## Usage

```bash
grspec feedback [message]
```

## Key Behaviors

- **GitHub CLI Integration** — Uses `gh issue create` to file issues on the grspec repository
- **Manual Fallback** — When `gh` is not installed or not authenticated, provides a URL and formatted template for manual issue creation
- **Context Capture** — Automatically includes grspec version, OS, and Node.js version in the issue
