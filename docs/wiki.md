# Wiki Knowledge Base

The wiki (`grspec/wiki/`) is an optional, navigable knowledge base for AI assistants. Inspired by Andrej Karpathy's knowledge management philosophy, it provides structured memory that compounds over time — a cognitive layer between your raw codebase and your behavioral specs.

For configuration options, see [Customization](customization.md#wiki-configuration). For CLI commands, see [CLI](cli.md).

## Architecture

grspec organizes project knowledge into three layers:

```
┌────────────────────┐  ┌────────────────────┐
│  constitution.md   │  │  domain-model.md   │   Anchor layer (rarely changes)
│  "What we believe" │  │  "How we're shaped" │   Human-written, wiki references
└────────┬───────────┘  └────────┬───────────┘
         └────────┬──────────────┘
                  │ referenced by
                  ▼
┌──────────────────────────────────────────────┐
│  grspec/wiki/                                │  Cognitive layer (evolves with dev)
│  ├── overview.md   (project summary)         │  LLM-maintained, human-reviewed
│  ├── index.md      (navigation catalog)      │
│  ├── log.md        (operation timeline)      │
│  ├── concepts/     (architecture concepts)   │
│  ├── entities/     (modules, commands, deps) │
│  ├── sources/      (change summaries)        │
│  └── comparisons/  (tradeoff analyses)       │
└──────────────────────────────────────────────┘
                  │ consumed & produced by
                  ▼
┌──────────────────────────────────────────────┐
│  grspec/specs/                               │  Contractual layer (existing)
│  (behavioral requirements)                   │
└──────────────────────────────────────────────┘
```

- **Anchor** — `constitution.md` and `domain-model.md` are human-written and near-immutable.
- **Cognitive** — `grspec/wiki/` is LLM-maintained and human-reviewed. It evolves with every change.
- **Contractual** — `grspec/specs/` holds behavioral requirements (the existing grspec layer).

The wiki does not absorb or replace constitution or domain-model. It references them via `sources` frontmatter and builds knowledge on top of the raw codebase.

## Enabling the Wiki

Add a `wiki` section to `grspec/grspec.yaml`:

```yaml
wiki:
  enabled: true
  categories: [concepts, entities, sources, comparisons]
  auto-ingest:
    on-propose: true
    on-apply: false
    on-archive: true
  lint:
    on-archive: true
    structural: true
    semantic: true
```

When `wiki.enabled` is `false` or absent, all wiki features are silently skipped — skills proceed with their normal workflow, and archive ignores wiki deltas.

See [Customization > Wiki Configuration](customization.md#wiki-configuration) for field details.

## Wiki Page Format

Every wiki page is plain markdown with YAML frontmatter and `[[wikilinks]]` for cross-references:

```markdown
---
title: "Context Injection"
type: concept
sources:
  - src/core/instruction-loader.ts
  - grspec/specs/config-loading/spec.md
related:
  - "[[instruction-loader]]"
  - "[[project-config]]"
created: 2025-08-20
updated: 2025-09-15
confidence: high
---

# Context Injection

Free-form markdown content explaining the concept.

The [[instruction-loader]] reads project context and rules from
`grspec.yaml` and injects them into AI prompts. This is related
to the [[project-config]] entity which defines the schema.
```

### Required Frontmatter Fields


| Field        | Type   | Description                                                |
| ------------ | ------ | ---------------------------------------------------------- |
| `title`      | string | Human-readable page title                                  |
| `type`       | enum   | One of `concept`, `entity`, `source-summary`, `comparison` |
| `created`    | date   | When the page was first created (YYYY-MM-DD)               |
| `updated`    | date   | When the page was last modified (YYYY-MM-DD)               |
| `confidence` | enum   | One of `high`, `medium`, `low`                             |


### Optional Frontmatter Fields


| Field            | Type     | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `sources`        | string[] | File paths this page is based on           |
| `related`        | string[] | `[[wikilink]]` references to related pages |
| `blocked_by`     | string   | Change name holding a lock on this page    |
| `blocked_since`  | date     | When the lock was acquired                 |
| `deleted`        | boolean  | Marks a page for deletion (used in deltas) |
| `deleted_reason` | string   | Why the page was deleted                   |


### Page Types


| Type             | Purpose                                                     | Examples                               |
| ---------------- | ----------------------------------------------------------- | -------------------------------------- |
| `concept`        | Architecture concepts, design patterns, technical paradigms | `artifact-graph.md`, `delta-specs.md`  |
| `entity`         | Modules, commands, services, key classes, dependencies      | `cli-init.md`, `instruction-loader.md` |
| `source-summary` | Knowledge extracted from a completed change                 | `2025-08-19-add-change-commands.md`    |
| `comparison`     | Technology or approach tradeoff analyses                    | `programmatic-vs-agent-merge.md`       |


### Structural Files


| File          | Role                                                                                         | Update Frequency                 |
| ------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| `overview.md` | Project-level summary (like a book preface). References constitution and domain-model.       | Low — major architecture changes |
| `index.md`    | Navigation catalog. One line per page with `[[wikilink]]` and summary. LLMs read this first. | High — every ingest              |
| `log.md`      | Append-only operation timeline. Format: `## [YYYY-MM-DD] operation                           | description`.                    |


## Usage Workflow

### Step 1: Initialize — `/grsx-wiki-init`

One-time full build from the existing codebase.

```
You: /grsx-wiki-init

AI:  Scanning codebase for wiki topics...
     Found 24 topics across 4 categories.

     Batch 1/3 (8 pages):
       concepts/artifact-graph.md      confidence: high
       concepts/delta-specs.md         confidence: high
       entities/cli-init.md            confidence: high
       ...

     Proceed with batch 1?

You: Yes

AI:  ✓ Generated 8 pages
     ✓ Verified by checker LLM
     ...
     ✓ Generated overview.md, index.md, log.md
     ✓ Structural lint: 0 issues

     Wiki initialized with 24 pages.
```

What it does:

1. Scans `src/`, `grspec/specs/`, `constitution.md`, `domain-model.md`, `changes/archive/`
2. Proposes a build plan (N pages in M batches), waits for confirmation
3. Per batch: writer LLM generates pages, verifier LLM validates, shows results
4. Generates structural files: `overview.md`, `index.md`, `log.md`
5. Runs `grspec wiki lint --structural` as final check

### Step 2: Daily Development — Wiki-Aware Skills

Once the wiki is initialized, all wiki-aware skills automatically read it before acting:

```
IF grspec/wiki/index.md exists:
  1. Read wiki/index.md
  2. Identify wiki pages relevant to the current task
  3. Read those pages
  4. Use as cognitive foundation
ELSE:
  Proceed normally (wiki is optional)
```


| Skill           | How It Uses Wiki                                                |
| --------------- | --------------------------------------------------------------- |
| `/grsx:explore` | Reads concepts, entities, comparisons for investigation context |
| `/grsx:propose` | Reads wiki for grounding; plans wiki deltas for new concepts    |
| `/grsx:apply`   | Reads entities and patterns to ground implementation decisions  |
| `/grsx:verify`  | Uses wiki as verification baseline (read-only)                  |


**Key principle:** LLMs read `index.md` first, then navigate page-by-page via `[[wikilinks]]`. The entire wiki is never loaded into context at once.

### Step 3: Incremental Updates — `/grsx-wiki-ingest`

During a change, update wiki knowledge incrementally.

```
You: /grsx-wiki-ingest

AI:  Reading wiki/index.md (24 pages)...
     Reading change artifacts for add-wiki-support...

     Wiki updates needed:
       + entities/wiki-management.md       (new)
       + concepts/llm-wiki.md              (new)
       ~ entities/cli-archive.md           (modified)

     Generating deltas...
     ✓ 3 delta pages written to changes/add-wiki-support/wiki/
```

What it does:

1. Reads current `wiki/index.md` to understand existing knowledge
2. Reads the current change's artifacts (proposal, design, specs)
3. Determines which pages need updating:
  - New spec capabilities &rarr; new `entities/` pages
  - New architectural concepts &rarr; new `concepts/` pages
  - Modified specs &rarr; updated entity pages
4. Writes deltas to `changes/<name>/wiki/<category>/<topic>/page.md`
5. Validates each delta (frontmatter, wikilinks)
6. Locks affected pages (`blocked_by` frontmatter) to prevent parallel conflicts

Deltas use **whole-page replacement** — each delta file is a complete page, not a diff.

### Step 4: Query the Wiki — `/grsx-wiki-query`

Ask questions and get answers grounded in wiki knowledge.

```
You: /grsx-wiki-query "How does the archive process work?"

AI:  Reading wiki/index.md...
     Navigating to [[cli-archive]] → [[delta-specs]] → [[spec-merge]]

     The archive process follows these steps:
     1. Merge delta specs into main specs (see [[delta-specs]])
     2. Merge wiki deltas if wiki is enabled (see [[wiki-management]])
     3. Generate a source summary page
     4. Move the change folder to archive/

     Source: wiki/entities/cli-archive.md (confidence: high)
```

What it does:

1. Reads `wiki/index.md` to identify relevant pages
2. Follows `[[wikilinks]]` for deeper context
3. Synthesizes an answer with wiki citations
4. If the answer reveals a gap, offers to create a new page

### Step 5: Health Checks — `/grsx-wiki-lint`

Two layers of health checks:

**Structural** (code-based, fast, deterministic):

- Frontmatter format validation
- Wikilink integrity (do linked pages exist?)
- Orphan page detection (pages not linked from `index.md`)
- Source path existence (do referenced files exist?)
- Index completeness
- Spec coverage (does every spec have an entity page?)

**Semantic** (LLM-based, expensive):

- Cross-page contradictions
- Wiki-vs-spec consistency
- Wiki-vs-code alignment
- Staleness detection
- Coverage density

```bash
grspec wiki lint                  # All structural checks
grspec wiki lint --structural     # Structural checks only
grspec wiki lint --coverage       # Coverage analysis
grspec wiki lint --fix            # Auto-fix structural issues
grspec wiki lint --json           # Machine-readable output
```

Semantic checks (contradiction detection, wiki-vs-spec consistency, staleness) require an LLM agent. Use `/grsx-wiki-lint` in your editor for full analysis.

### Step 6: Archive — Automatic Wiki Merge

When archiving a change via `/grsx:archive` or `grspec archive`, the wiki is updated automatically:

1. Validate wiki delta files (frontmatter, structure)
2. Merge deltas to `grspec/wiki/`:
  - **ADDED** (file in delta, not in main) &rarr; create page
  - **MODIFIED** (file in delta and in main) &rarr; overwrite page
  - **REMOVED** (`deleted: true` in frontmatter) &rarr; delete page
3. Generate `wiki/sources/YYYY-MM-DD-<change-name>.md` (source summary)
4. Update `wiki/index.md` with new/removed entries
5. Append to `wiki/log.md`
6. Release page locks held by this change

Use `grspec archive <change> --skip-wiki` to skip all wiki operations.

### Step 7: Manual Sync — `/grsx-wiki-sync`

Merge wiki deltas to the main wiki *without* archiving the change. Useful for long-running changes that want their wiki updates visible early.

```
You: /grsx-wiki-sync

AI:  Wiki deltas for add-wiki-support:
       + entities/wiki-management.md    (ADDED)
       ~ entities/cli-archive.md        (MODIFIED)

     Merge to main wiki?

You: Yes

AI:  ✓ 2 pages merged
     ✓ index.md updated
     ✓ log.md appended
     ✓ Page locks released
```

### Step 8: Status — `/grsx-wiki-status`

Quick overview of wiki health:

```bash
grspec wiki status
```

Shows total pages, pages by type, recently updated pages, blocked pages, and pending wiki deltas in active changes.

## Page Locking

When multiple changes run in parallel, the wiki uses page-level locking to prevent conflicts:

1. **Lock** — When `/grsx-wiki-ingest` generates a delta for a page, the main wiki page's frontmatter gains `blocked_by: <change-name>` and `blocked_since: <date>`.
2. **Block** — Other changes' ingest detects the lock and skips the page with a warning.
3. **Release** — Archive or sync removes `blocked_by` from all pages locked by that change.
4. **Resume** — Previously blocked changes can now modify the page.

`grspec wiki lint` reports long-held locks as warnings.

## Wiki Deltas

Wiki deltas live in `changes/<name>/wiki/` and mirror the main wiki's category structure:

```
changes/add-wiki-support/wiki/
├── concepts/
│   └── llm-wiki/page.md              # New page → ADDED
├── entities/
│   └── cli-archive/page.md           # Existing page → MODIFIED (whole replace)
└── entities/
    └── old-module/page.md            # deleted: true → REMOVED
```

### Deletion Marker

To remove a page, create a delta with `deleted: true` in frontmatter:

```yaml
---
title: "Old Module"
type: entity
deleted: true
deleted_reason: "Module removed during refactoring"
---
```

## Complete Lifecycle

```
/grsx-wiki-init ──► (wiki ready)
       │
       ▼
/grsx:propose ──► /grsx-wiki-ingest ──► /grsx:apply ──► /grsx:archive
  reads wiki          writes deltas       reads wiki      merges deltas
                                                          generates source summary
                                                          releases locks
       │
       └──────────────────────────────────────────────── (wiki updated, cycle repeats)
```

## Commands Summary

### Slash Commands (via AI assistant)


| Command                        | Purpose                                 |
| ------------------------------ | --------------------------------------- |
| `/grsx-wiki-init`              | Full build from codebase                |
| `/grsx-wiki-ingest`            | Generate wiki deltas for current change |
| `/grsx-wiki-query "..."`       | Navigate wiki to answer questions       |
| `/grsx-wiki-lint`              | Structural + semantic health checks     |
| `/grsx-wiki-sync`              | Merge deltas without archiving          |
| `/grsx-wiki-status`            | Overview dashboard                      |


### CLI Commands (terminal)


| Command                         | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `grspec wiki lint`              | Run structural wiki health checks                           |
| `grspec wiki lint --structural` | Structural checks only                                      |
| `grspec wiki lint --coverage`   | Coverage analysis (spec coverage, index completeness)       |
| `grspec wiki lint --fix`        | Auto-fix structural issues (e.g., regenerate index)         |
| `grspec wiki lint --json`       | Machine-readable output                                     |
| `grspec wiki status`            | Show wiki overview                                          |
| `grspec wiki init`              | Agent-only: directs to `/grsx-wiki-init`                    |
| `grspec wiki ingest`            | Agent-only: directs to `/grsx-wiki-ingest`                  |
| `grspec wiki query`             | Agent-only: directs to `/grsx-wiki-query`                   |
| `grspec wiki sync`              | Agent-only: directs to `/grsx-wiki-sync`                    |
| `grspec archive --skip-wiki`    | Archive without wiki operations                             |


## Next Steps

- [Concepts](concepts.md#wiki-knowledge-layer) — How the wiki fits into grspec's knowledge layer
- [Customization](customization.md#wiki-configuration) — Configure wiki behavior in `grspec.yaml`
- [Workflows](workflows.md) — How wiki integrates with the development workflow
- [Commands](commands.md) — Full command reference

