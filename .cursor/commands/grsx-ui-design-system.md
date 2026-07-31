---
name: /grsx-ui-design-system
id: grsx-ui-design-system
category: design
description: Generate a complete design system from a natural-language query. Use when persisting change-level ui/pages/ or project pages (not project MASTER — use init for that).
---

Generate a complete design system recommendation (style, colors, typography, components) from a natural-language query.

**Use when** starting a new UI surface, page type, or persisting change-level `ui/pages/` for a grspec change.

---

## CLI

```bash
grspec ui design-system "<product_type> <industry> <keywords>" -p "Project Name"
grspec ui design-system "<query>" -p "Name" --persist --page "dashboard"
grspec ui design-system "<query>" --persist --page "billing" --output grspec/changes/<change-name>
```

Add `--json` when the agent needs structured output.

## Persist pattern

- **Project init** (`grspec ui init`): writes flat `grspec/ui/MASTER.md` (and optional `grspec/ui/pages/`)
- **Project page** (`design-system --persist --page`): writes `grspec/ui/pages/<slug>.md` only — never overwrites MASTER
- **Change** (`--persist --output <changeDir>`): writes `ui/pages/<slug>.md` only — never writes change-level MASTER

## Agent workflow

1. Extract product type, industry, style keywords, and project name from context.
2. Run `design-system` with a rich multi-dimensional query (not a single generic word).
3. For change pages, use `--persist --page <name> --output grspec/changes/<name>`.
4. After generation, use `/grsx-ui-reference <style>` for full token/component detail.

## Workflow integration

- **Propose / ff / continue**: detect only — metadata in `.grspec.yaml`, no persist
- **Apply**: `contextFiles.ui` lists `ui.md`, `grspec/ui/MASTER.md`, and page overrides

## Related

- `/grsx-ui-init` — codebase-aware first-time project setup
- `/grsx-ui-search` — narrow domain searches after the initial system is chosen
- `/grsx-ui-status` — check existing project design system
