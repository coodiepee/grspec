---
title: "LLM Wiki"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - docs/wiki.md
  - src/core/wiki.ts
  - src/core/wiki-lint.ts
related:
  - "[[wiki-management]]"
  - "[[grspec-conventions]]"
  - "[[spec-driven-workflow]]"
---

# LLM Wiki

The LLM Wiki is an optional, navigable knowledge base for AI assistants. It sits as a cognitive layer between the raw codebase and behavioral specs, providing structured memory that compounds over time.

## Three-Layer Architecture

```
┌─────────────────────┐  ┌─────────────────────┐
│  constitution.md    │  │  domain-model.md    │   Anchor layer
│  "What we believe"  │  │  "How we're shaped" │   (rarely changes)
└─────────┬───────────┘  └─────────┬───────────┘
          └────────┬───────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  grspec/wiki/                                │   Cognitive layer
│  concepts/ entities/ sources/ comparisons/   │   (evolves with dev)
└──────────────────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  grspec/specs/                               │   Contractual layer
│  (behavioral requirements)                   │   (existing)
└──────────────────────────────────────────────┘
```

## Page Types

| Type | Purpose | Directory |
|------|---------|-----------|
| **concept** | Architecture concepts, design patterns | `concepts/` |
| **entity** | Modules, commands, services | `entities/` |
| **source-summary** | Knowledge from completed changes | `sources/` |
| **comparison** | Tradeoff analyses | `comparisons/` |

## Navigation Model

LLMs navigate the wiki via `index.md` then follow wikilink references to related pages. The entire wiki is never loaded into context at once. Each page uses YAML frontmatter for metadata and double-bracket wikilink syntax for cross-references.

## Lifecycle

1. **Init** — Full build from existing codebase (`/grsx-wiki-init`)
2. **Ingest** — Incremental updates during changes (`/grsx-wiki-ingest`)
3. **Query** — Navigate and answer questions (`/grsx-wiki-query`)
4. **Lint** — Structural and semantic health checks
5. **Sync/Archive** — Merge wiki deltas to main wiki

## Page Locking

Parallel changes use page-level locking (`blocked_by` frontmatter) to prevent conflicts. Locks are released on archive or sync.
