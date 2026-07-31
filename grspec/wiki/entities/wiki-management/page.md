---
title: "Wiki Management"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - src/core/wiki.ts
  - src/core/wiki-lint.ts
  - src/commands/wiki.ts
  - docs/wiki.md
related:
  - "[[llm-wiki]]"
  - "[[cli-archive]]"
  - "[[config-loading]]"
---

# Wiki Management

The wiki management module handles the operational aspects of the LLM wiki: CLI commands, linting, delta merging, and page lifecycle.

## CLI Commands

| Command | Purpose |
|---------|---------|
| `grspec wiki lint` | Structural health checks (frontmatter, wikilinks, orphans) |
| `grspec wiki lint --coverage` | Spec coverage analysis |
| `grspec wiki lint --fix` | Auto-fix structural issues |
| `grspec wiki status` | Wiki overview (page counts, recently updated, locked pages) |
| `grspec wiki init` | Directs to `/grsx-wiki-init` agent skill |

## Structural Lint Checks

- Frontmatter format validation (required fields, valid types)
- Wikilink integrity (do referenced pages exist?)
- Orphan page detection (pages not in `index.md`)
- Source path existence (do referenced files exist?)
- Index completeness
- Spec coverage (does every spec have an entity page?)

## Wiki Delta Lifecycle

1. **Ingest** — Create delta pages in `changes/<name>/wiki/` during a change
2. **Lock** — Add `blocked_by` frontmatter to main wiki pages being modified
3. **Merge** — During archive or manual sync, apply deltas to main wiki
4. **Release** — Remove `blocked_by` locks after merge

## Configuration

Enabled via `wiki.enabled: true` in `grspec.yaml`. When disabled, all wiki features are silently skipped.
