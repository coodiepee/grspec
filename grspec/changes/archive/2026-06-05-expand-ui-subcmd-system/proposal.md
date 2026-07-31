---
type: proposal
change: expand-ui-subcmd-system
created: 2026-06-05
schema: spec-driven
---
## Why

The current `grspec ui` module has a functional core (BM25 search, design-system generation) but lacks the subcommand breadth needed to deliver a complete UI/UX workflow. Over 250 lines of actionable Quick Reference rules were lost during integration from ui-ux-pro-max-skill, the `design.csv` (1775 rows of complete style specs) is unreachable, there's no review capability, no multi-platform export, no upstream sync, and no project status view. Users must fall back to the original Python scripts or manual inspection for these workflows.

## What Changes

- **NEW** `grspec ui rules [category]` — structured rule query engine (100+ rules from Apple HIG, Material Design, WCAG) with platform/severity filtering
- **NEW** `grspec ui reference [style]` — full design-system specification viewer for all 67 styles (exposing `design.csv`)
- **NEW** `grspec ui review [path]` — static + agent-driven UX quality audit against the rule set
- **NEW** `grspec ui status` — project UI configuration state (design-system presence, style, data version, active change detection)
- **NEW** `grspec ui install --platform <name>` — export grspec-ui skill to 18 AI platforms (Windsurf, Copilot, Kiro, Roocode, Claude, Codex, etc.)
- **NEW** `grspec ui sync` — upstream data synchronization with version tracking
- **ENHANCED** `grspec-ui` Skill — restore full Quick Reference (100+ rules with [App]/[Web]/[Both] scope markers)
- **NEW** `grspec-ui-review` Skill — dedicated agent skill for UX quality reviews
- **NEW** Command templates for all new subcommands (`/grsx-ui-rules`, `/grsx-ui-reference`, `/grsx-ui-review`, `/grsx-ui-status`, `/grsx-ui-install`, `/grsx-ui-sync`)
- **NEW** `assets/ui/data/rules.csv` — structured rule database extracted from Quick Reference
- **NEW** `assets/ui/templates/` — multi-platform output templates
- **NEW** `assets/ui/UPSTREAM.md` — upstream version tracking metadata
- Remove `assets/ui/data/draft.csv` (confirmed backup duplicate of `design.csv`)

## Capabilities

### New Capabilities
- `ui-rules-query`: Structured UI/UX rule database with BM25 search, platform filtering (app/web/both), severity levels, and checklist output
- `ui-reference-viewer`: Full design specification viewer exposing design.csv data (philosophy, tokens, components, code) per style
- `ui-review`: Static code analysis + agent-driven UX quality audit against the rule set
- `ui-project-status`: Project UI configuration detection and reporting
- `ui-platform-export`: Multi-platform skill export (18 platforms with format templates)
- `ui-upstream-sync`: Upstream data version tracking and synchronization

### Modified Capabilities
- `apply-ui-context`: Enhanced to include rules context when applying UI tasks (existing spec references keyword detection; adding rules injection)
- `design-phase-ui-hook`: Enhanced to suggest `grspec ui reference` after design-system generation

## Domain Context

This change primarily affects:

- **CLI Interface** — Adds 6 new subcommands under `grspec ui`, extending the command parser and registration in `src/commands/ui.ts`
- **Template System** — Adds 6 new `CommandTemplate` exports and expands the existing `SkillTemplate` in `src/core/templates/workflows/ui.ts`
- **Artifact Workflow** — Modifies instruction enrichment in `src/core/artifact-graph/instruction-loader.ts` (design-phase and apply-phase hooks)

Core entities involved: Command, SkillTemplate, CommandTemplate, Artifact (instruction enrichment)

## Risk Assessment

- **Impact scope**: New modules (`src/core/ui/rules.ts`, `reference.ts`, `review.ts`, `status.ts`, `installer.ts`, `sync.ts`) are additive — no changes to existing search/design-system logic
- **Regression risk**: Low — existing `grspec ui search` and `grspec ui design-system` commands are untouched. The only modification to existing files is extending `src/commands/ui.ts` (register new subcommands) and `src/core/templates/workflows/ui.ts` (add command templates)
- **Performance implications**: `rules.csv` is small (~100 rows), BM25 is fast. `design.csv` (1775 lines) is loaded on-demand per `reference` call, not at startup. No hot-path concerns.
- **Platform risk**: `install` command generates static files — no runtime dependency on target platforms. Template accuracy needs validation per platform.
- **Data risk**: `sync` writes to `assets/ui/data/` — existing CSV files could be overwritten. Mitigated by `--check` dry-run and confirmation prompt.

## Impact

- **Code**: `src/core/ui/` (6 new files), `src/commands/ui.ts` (extended), `src/core/templates/workflows/ui.ts` (extended + new templates), `src/core/templates/skill-templates.ts` (new exports)
- **Assets**: `assets/ui/data/rules.csv` (new), `assets/ui/templates/*.json` (new, ~18 files), `assets/ui/UPSTREAM.md` (new), `assets/ui/data/draft.csv` (removed)
- **Skills**: `.cursor/skills/grspec-ui/SKILL.md` (major update), `.cursor/skills/grspec-ui-review/SKILL.md` (new)
- **Tests**: `test/core/ui/` (6 new test files)
- **Dependencies**: None — all new functionality uses existing internal modules (BM25, csv-loader, fs)
