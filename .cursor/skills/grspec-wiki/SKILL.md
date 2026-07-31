---
name: grspec-wiki
description: LLM Wiki management - init, ingest, lint, query, sync, status. Use when the user wants to build, navigate, or maintain the project's wiki knowledge base.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

LLM Wiki — a navigable knowledge base for AI assistants, built alongside your specs.

Each wiki operation has its own slash command:

| Command | Purpose |
|---------|---------|
| `/grsx-wiki-init` | Build wiki from scratch (full build) |
| `/grsx-wiki-ingest` | Generate wiki deltas for the current change |
| `/grsx-wiki-lint` | Run structural + semantic health checks |
| `/grsx-wiki-query` | Navigate wiki to answer a question |
| `/grsx-wiki-sync` | Merge wiki deltas from a change to main |
| `/grsx-wiki-status` | Show wiki overview |

---

## init — Full Wiki Build

Build the entire wiki from the current codebase.

1. Check if wiki already exists (`grspec wiki status`). If yes, confirm overwrite.
2. **Plan phase**: Read the project's constitution, domain model, and all specs. Identify topics for concepts, entities, sources, comparisons.
3. **Batch build**: For each topic, generate a wiki page with proper YAML frontmatter (title, type, created, updated, confidence, sources, related) followed by markdown body with `[[wikilinks]]`.
4. **Finalize**: Generate `index.md`, `log.md`, and `overview.md`.
5. Run `grspec wiki lint --structural` to verify.

## ingest — Generate Wiki Deltas

Create wiki page updates as part of a change workflow.

1. Read `grspec/wiki/index.md` to understand current wiki state.
2. Read the current change's artifacts (proposal, design, specs).
3. Determine which wiki pages need updating.
4. Write wiki delta files to `changes/<name>/wiki/<category>/<topic>/page.md` as whole-page replacements.
5. Verify: check frontmatter is valid, wikilinks resolve.

## lint — Health Checks

1. Run `grspec wiki lint --json` for structural results.
2. Review and auto-fix structural issues.
3. **Semantic analysis** (LLM-driven): check content consistency with source files and related pages.
4. Present consolidated report.

## query — Navigate and Answer

1. Read `grspec/wiki/index.md` for the knowledge map.
2. Navigate to relevant pages via `[[wikilinks]]`.
3. Synthesize an answer grounded in wiki content.
4. If the answer reveals a gap, offer to create/update a wiki page.

**Key**: Navigate via index, don't dump entire wiki into context.

## sync — Merge Deltas

1. Identify the active change.
2. Detect deltas: compare `changes/<name>/wiki/` against `grspec/wiki/`.
3. Preview changes (added, modified, removed).
4. Merge deltas, update index and log, release page locks.

## status — Overview

Run `grspec wiki status` and display the summary.

## Guardrails

- Always read `index.md` first when navigating the wiki.
- Never inject the entire wiki into context — navigate page by page.
- Validate frontmatter before writing any wiki page.
- Use `[[wikilinks]]` to connect related pages.
- One topic per page.
