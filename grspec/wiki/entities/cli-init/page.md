---
title: "CLI Init Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-init/spec.md
  - src/core/init.ts
  - src/commands/workflow/new-change.ts
related:
  - "[[template-system]]"
  - "[[ai-tool-paths]]"
  - "[[project-config]]"
  - "[[legacy-cleanup]]"
  - "[[project-bootstrap]]"
---

# CLI Init Command

`grspec init` creates a complete grspec directory structure in any project, enabling immediate adoption with support for 25+ AI coding assistants.

## Usage

```bash
grspec init [options]
```

## Key Behaviors

- **Welcome Screen** — Displays animated ASCII logo and project branding
- **AI Tool Selection** — Searchable multi-select for choosing which AI tools to configure; already-configured tools are marked and sorted first
- **Directory Creation** — Creates `grspec/`, `grspec/specs/`, `grspec/changes/`, `grspec/changes/archive/`
- **Config File** — Generates `grspec/grspec.yaml` with project context
- **Skill/Command Generation** — Installs workflow skills and commands for selected AI tools using the [[template-system]]
- **Progress Indicators** — Ora spinners for each initialization step
- **Non-Interactive Mode** — `--tools` flag for CI/automation, `--all-tools` for selecting everything
- **Track Support** — `--track new|existing` for [[project-bootstrap]] with constitution and domain model scaffolding
- **Legacy Cleanup** — Detects and removes legacy grspec artifacts (see [[legacy-cleanup]])

## Idempotency

Running `init` on an already-initialized project refreshes skills/commands without overwriting existing specs or changes. Configured tools are pre-selected for easy update.
