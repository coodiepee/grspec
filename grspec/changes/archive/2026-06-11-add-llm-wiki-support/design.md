# Design: Add LLM Wiki Support

## Architecture Overview

The LLM Wiki integrates as a new knowledge layer in the GrSpec stack, following Karpathy's three-layer architecture adapted for software development workflows.

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

### Three-Layer Mapping


| Karpathy Layer               | GrSpec Mapping                                                                                         | Description                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Raw Sources** (`raw/`)     | The codebase itself: `src/`, `grspec/specs/`, `constitution.md`, `domain-model.md`, `changes/archive/` | Immutable inputs. Wiki builds knowledge on top of these without modifying them.        |
| **The Wiki** (`wiki/`)       | `grspec/wiki/`                                                                                         | LLM-generated and maintained markdown pages with YAML frontmatter and `[[wikilinks]]`. |
| **The Schema** (`CLAUDE.md`) | `grspec.yaml` wiki config + `/grsx:wiki` skill + schema templates                                      | Rules governing wiki structure, conventions, and operations.                           |


### Three Operations Mapping


| Karpathy Operation | GrSpec Mapping                                                                       |
| ------------------ | ------------------------------------------------------------------------------------ |
| **Ingest**         | `/grsx:wiki init` (full build) and `/grsx:wiki ingest` (incremental during workflow) |
| **Query**          | `/grsx:wiki query` (explicit) and wiki navigation preamble in all skills (implicit)  |
| **Lint**           | `/grsx:wiki lint` and `grspec wiki lint` CLI command                                 |


## Key Design Decisions

### 1. Wiki pages use natural markdown (no forced section structure)

**Decision**: Wiki pages are free-form markdown with YAML frontmatter. No `### Section:` structure is imposed.

**Rationale**: Wiki content is cognitive/narrative text, not structured contracts like specs. Forcing section-level structure would make pages unnatural to write and read. Since wiki deltas use whole-page replacement (see decision #2), section-level identity keys are unnecessary.

**Trade-off**: Cannot do partial page merge — a MODIFIED delta replaces the entire page. Acceptable because wiki pages are typically short (a few hundred lines) and LLMs can regenerate entire pages cheaply.

### 2. Wiki deltas use whole-page replacement (not section-level merge)

**Decision**: Wiki delta files in `changes/<name>/wiki/` are complete page files. Delta detection is by file existence:


| Condition                                 | Operation                             |
| ----------------------------------------- | ------------------------------------- |
| File exists in delta AND in main wiki     | MODIFIED — whole page replaced        |
| File exists in delta AND NOT in main wiki | ADDED — new page created              |
| File has `deleted: true` in frontmatter   | REMOVED — page deleted from main wiki |


**Rationale**: Spec deltas need section-level merge because requirements are precise contractual units with strict identity. Wiki pages are free-form knowledge — partial merge would be fragile and error-prone. Whole-page replacement is simple, predictable, and sufficient.

**Code implication**: Wiki merge does NOT reuse `specs-apply.ts` section parser. It's a simpler code path: detect delta type → copy/overwrite/delete file → update index.

### 3. Constitution and domain-model remain independent (not absorbed into wiki)

**Decision**: `constitution.md` and `domain-model.md` stay as top-level GrSpec artifacts. Wiki references them via `sources` frontmatter but does not contain or replace them.

**Rationale**:

- Different change frequency: constitution is near-immutable, domain-model changes slowly, wiki changes constantly
- Different authorship: constitution/domain-model are human-authored, wiki is LLM-maintained
- Different authority: constitution is "law" (prescriptive), wiki is "encyclopedia" (descriptive)
- Existing workflow dependencies: `grspec init --track` generates them, validation checks their existence — these flows should not be entangled with wiki

**Integration**: `wiki/overview.md` explicitly references both. Wiki lint checks consistency between wiki content and constitution/domain-model content.

### 4. LLM navigates wiki via index.md (not injected via instruction-loader)

**Decision**: Wiki content is NOT injected into the `<project_context>` or any new instruction block. Instead, skills instruct the LLM to read `wiki/index.md` as a first step, then navigate to relevant pages.

**Rationale**: The core insight of Karpathy's LLM Wiki is that knowledge should be navigated, not dumped. Injecting wiki into instructions would recreate the RAG problem (context overflow, relevance noise). Index-based navigation is token-efficient and mirrors how human memory works — you know the structure, you retrieve what you need.

**Skill modification pattern**: Each skill gains a preamble:

```
IF grspec/wiki/index.md exists:
  1. Read wiki/index.md
  2. Identify wiki pages relevant to the current task
  3. Read those pages
  4. Use as cognitive foundation
```

This is a soft dependency — if wiki doesn't exist, the skill works exactly as before.

### 5. Page-level locking for parallel changes

**Decision**: When a change creates a wiki delta for a page, the main wiki page's frontmatter gains `blocked_by: <change-name>` and `blocked_since: <date>`. Other changes cannot create deltas for blocked pages.

**Lock lifecycle**:

1. **Lock**: wiki ingest detects affected pages → writes `blocked_by` to main page frontmatter
2. **Blocked**: other changes' ingest sees `blocked_by` → skips page, logs warning
3. **Release**: archive or sync merges delta → removes `blocked_by` from frontmatter
4. **Resume**: previously blocked changes can now modify the page

**Granularity**: Page-level (not section-level). Simpler to implement and reason about. Can be refined later if hot-page contention becomes a real problem.

**Trade-off**: A frequently-referenced concept page (e.g., `context-injection`) could become a bottleneck. Mitigation: wiki lint reports long-held locks; humans can manually release locks if needed.

### 6. Build-time verification (writer + verifier pattern)

**Decision**: Every wiki write operation (init batch, ingest) uses two LLM passes:

1. **Writer**: generates/updates wiki page content
2. **Verifier**: checks consistency (vs specs, vs code references, vs other wiki pages, frontmatter format, wikilink validity)

On failure, verifier returns feedback to writer for correction (max N retries, then flag for human review).

**Rationale**: Neither humans nor LLMs can guarantee knowledge accuracy. A separate verification pass with a different prompt/role catches errors the writer's context bias would miss. This mirrors GrSpec's existing `/grsx:verify` pattern.

### 7. Batched full build with human confirmation

**Decision**: `/grsx:wiki init` works in phases:

1. **Plan phase**: LLM scans raw sources, proposes a build plan (N pages in M batches), shows to user
2. **Build phase**: per batch — writer generates pages → verifier validates → shows results to user → user confirms next batch
3. **Finalize phase**: generate `index.md`, `log.md`, `overview.md` → final lint

**Rationale**: Full wiki construction for a non-trivial codebase can touch dozens of files and cost significant tokens. Batching with human checkpoints provides control over quality and cost, and lets the user course-correct early.

### 8. Lint: structural (code) + semantic (LLM) separation

**Decision**: `grspec wiki lint` has two distinct check layers:


| Layer      | Requires LLM | Checks                                                                                                                   |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Structural | No           | Frontmatter format, wikilink validity, orphan pages, source path existence, index completeness, spec capability coverage |
| Semantic   | Yes          | Cross-page contradictions, wiki-vs-spec consistency, wiki-vs-code alignment, staleness, coverage density                 |


Both run by default. `--structural` or `--semantic` flags run only one layer.

**Rationale**: Structural checks are fast, deterministic, and can run in CI. Semantic checks are expensive and non-deterministic — separating them gives users control.

## Wiki Page Format

Following the Karpathy standard — YAML frontmatter + markdown body + `[[wikilinks]]`:

```markdown
---
title: "Page Title"
type: concept | entity | source-summary | comparison
sources:
  - path/to/raw/source/file
  - another/source
related:
  - "[[related-page]]"
  - "[[another-page]]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high | medium | low
---

# Page Title

Free-form markdown content with [[wikilinks]] for cross-references.
```

### Page Type Semantics


| Type             | Purpose                                                         | GrSpec Examples                                             |
| ---------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `concept`        | Architecture concepts, design patterns, technical paradigms     | `artifact-graph.md`, `delta-specs.md`, `spec-driven-dev.md` |
| `entity`         | Modules, commands, services, key classes, external dependencies | `cli-init.md`, `instruction-loader.md`, `zod.md`            |
| `source-summary` | Knowledge extracted from a completed change                     | `2025-08-19-add-change-commands.md`                         |
| `comparison`     | Technology/approach tradeoff analyses                           | `programmatic-vs-agent-merge.md`                            |


### Structural Files


| File          | Role                                                                                                    | Update Frequency                 |
| ------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `overview.md` | Project-level summary (like a book preface). References constitution and domain-model.                  | Low — major architecture changes |
| `index.md`    | Navigation catalog. One line per page with `[[wikilink]]` and summary. LLM reads this first.            | High — every ingest              |
| `log.md`      | Append-only operation timeline. Format: `## [YYYY-MM-DD] operation | description`. Parseable with grep. | High — every operation           |


## Wiki Delta Format

```
changes/<name>/wiki/
├── concepts/
│   └── new-concept/page.md        # main wiki has no such page → ADDED
├── entities/
│   └── cli-init/page.md           # main wiki has this page → MODIFIED (whole replace)
└── entities/
    └── old-module/page.md         # frontmatter: deleted: true → REMOVED
```

### Deletion marker

```yaml
---
title: "Old Module"
type: entity
deleted: true
deleted_reason: "Module removed during refactoring"
---
```

### Archive merge sequence

Within the existing archive flow, after spec merge:

1. Discover `changes/<name>/wiki/**/*.md`
2. For each delta file:
  - If `deleted: true` → delete main wiki page
  - If page exists in main wiki → overwrite (MODIFIED)
  - If page does not exist → create (ADDED)
3. Update `wiki/index.md` — add/remove entries
4. Generate `wiki/sources/YYYY-MM-DD-<change-name>.md` — automatic change summary
5. Append to `wiki/log.md`
6. Remove `blocked_by` from any pages this change had locked

## Workflow Integration

### Skill navigation preamble (all wiki-aware skills)

```
IF file exists grspec/wiki/index.md:
  Read grspec/wiki/index.md
  Based on current task context, identify relevant wiki pages
  Read those pages for cognitive context
  Proceed with task using wiki knowledge as foundation
ELSE:
  Proceed normally (wiki is optional)
```

### Per-skill wiki behavior


| Skill           | Reads Wiki                      | Writes Wiki Delta                                                    |
| --------------- | ------------------------------- | -------------------------------------------------------------------- |
| `/grsx:explore` | concepts, entities, comparisons | No (explore doesn't produce artifacts). May suggest writing to wiki. |
| `/grsx:propose` | concepts, entities, comparisons | Yes — new concepts, entities, comparisons                            |
| `/grsx:apply`   | entities, patterns              | Yes — new patterns, corrections to entities                          |
| `/grsx:verify`  | As verification baseline        | No (read-only)                                                       |
| `/grsx:archive` | Wiki deltas for merge           | Merges deltas to main wiki                                           |
| `/grsx:sync`    | Wiki deltas                     | Merges deltas to main wiki (without archive)                         |


### grspec.yaml configuration

```yaml
wiki:
  enabled: true
  categories:
    - concepts
    - entities
    - sources
    - comparisons
  auto_ingest:
    on_propose: true
    on_apply: false
    on_archive: true
  lint:
    on_archive: true
    structural: true
    semantic: true
```

All wiki features are gated on `wiki.enabled`. When `false` or absent, all wiki-related skill preambles and archive steps are skipped.

## Module Breakdown


| Module                                  | Responsibility                                                                                                                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/wiki.ts`                      | Page parsing (frontmatter + body), delta detection (scan change wiki dir, classify ADDED/MODIFIED/REMOVED), merge (copy/overwrite/delete), index generation, log appending, lock management (read/write `blocked_by`) |
| `src/core/wiki-lint.ts`                 | Structural checks (all code-based, no LLM needed): frontmatter schema validation, wikilink resolution, orphan detection, source path existence, index completeness, spec coverage                                     |
| `src/commands/wiki.ts`                  | `grspec wiki lint` command — parse flags, invoke lint, format output (text/json)                                                                                                                                      |
| `src/core/archive.ts` (modified)        | After spec merge: call wiki merge, generate source summary, update index/log                                                                                                                                          |
| `src/core/project-config.ts` (modified) | Add `wiki` section to Zod schema, parsing, validation                                                                                                                                                                 |


## Not In Scope

- **RAG / vector embeddings**: Wiki replaces the need for RAG at project scale. No embedding infrastructure.
- **CI integration for wiki lint**: Can be added later. Focus on local developer workflow first.
- **Section-level wiki merge**: Whole-page replacement only. Section-level can be added if needed.
- **Wiki search engine (QMD)**: Index-based navigation is sufficient at project scale (~50-200 pages). Search can be added later.
- **Multi-repo wiki**: Single-repo wiki only. Cross-workspace wiki coordination deferred.

