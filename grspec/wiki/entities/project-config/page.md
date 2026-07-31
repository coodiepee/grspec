---
title: "Project Config"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - src/core/project-config.ts
  - src/core/config-schema.ts
related:
  - "[[config-loading]]"
  - "[[global-config]]"
  - "[[context-injection]]"
---

# Project Config

The project config module (`src/core/project-config.ts`) manages project-level configuration stored in `grspec/grspec.yaml`. It provides the typed interface for reading and writing config values.

## Config Schema

Defined in `src/core/config-schema.ts` using Zod, the schema supports:

- `schema` — Default workflow schema name (e.g., `spec-driven`, `tdd`)
- `context` — Project context string for AI instruction injection
- `rules` — Per-artifact behavioral rules for AI agents
- `wiki` — Wiki feature configuration (enabled, categories, auto-ingest settings, lint settings)
- `workflow.gates` — Gate enforcement settings

## Relationship to Global Config

Project config is per-project (`grspec/grspec.yaml`), while [[global-config]] is per-user (`~/.config/grspec/config.json`). Project config takes precedence for project-specific settings like schema defaults, while global config handles user preferences like profile tier and delivery format.
