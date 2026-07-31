## Why

GrSpec has contractual knowledge (specs) and procedural knowledge (skills), but lacks a cognitive knowledge layer — an accumulated, structured understanding of the project that compounds over time. Currently, every LLM interaction rediscovers context from scratch. Inspired by Andrej Karpathy's LLM Wiki pattern, this change adds a persistent, LLM-maintained wiki that sits between raw sources (the codebase itself) and the workflow, enabling all GrSpec commands to operate from a shared knowledge base rather than starting cold.

## What Changes

- Add `grspec/wiki/` directory as a new knowledge layer with four page types: `concepts/`, `entities/`, `sources/`, `comparisons/`
- Add `wiki/index.md` (navigation catalog) and `wiki/log.md` (append-only operation log) and `wiki/overview.md` (project-level summary)
- Add `/grsx:wiki` slash command with subcommands: `init`, `ingest`, `lint`, `query`, `sync`, `status`
- Add `grspec wiki lint` CLI command for structural and semantic health checks
- Add wiki delta support: `changes/<name>/wiki/` stores whole-page deltas during development, merged to main wiki on archive/sync
- Add page-level locking via `blocked_by` frontmatter to prevent conflicting parallel edits
- Add wiki configuration section to `grspec.yaml` (`wiki: { enabled, categories, auto_ingest, lint }`)
- Modify archive flow to merge wiki deltas, generate `sources/` summary, update `index.md`, and append `log.md`
- Modify existing skills (`/grsx:explore`, `/grsx:propose`, `/grsx:apply`) to navigate wiki as a cognitive foundation before acting
- Add build-time verification: writer LLM generates wiki content, verifier LLM validates consistency with specs and code

## Capabilities

### New Capabilities

- `wiki-management`: Wiki lifecycle management — page CRUD, whole-page delta merge, page locking (`blocked_by`/`blocked_since` frontmatter), index and log maintenance, YAML frontmatter conventions (title, type, sources, related, created, updated, confidence), four page types (concept, entity, source-summary, comparison)
- `wiki-verification`: Wiki health check system — structural checks (frontmatter validation, wikilink integrity, orphan page detection, source path existence, index coverage, spec capability coverage) and semantic checks (cross-page contradiction detection, wiki-vs-spec consistency, wiki-vs-code alignment, coverage analysis, staleness detection)
- `cli-wiki`: CLI `grspec wiki lint` command with `--structural`, `--semantic`, `--coverage`, `--fix`, `--json` flags
- `grsx-wiki-skill`: `/grsx:wiki` slash command skill orchestrating init (batched full build with human confirmation), ingest (incremental delta generation), lint, query, sync, and status subcommands

### Modified Capabilities

- `cli-archive`: Archive SHALL merge wiki deltas from `changes/<name>/wiki/` to `grspec/wiki/` alongside spec deltas, generate a `sources/` summary page for the archived change, update `wiki/index.md`, append to `wiki/log.md`, and support `--skip-wiki` flag
- `config-loading`: Config loading SHALL parse a `wiki` section from `grspec.yaml` with fields: `enabled` (boolean), `categories` (string array), `auto_ingest` (object with `on_propose`, `on_apply`, `on_archive` booleans), and `lint` (object with `on_archive`, `structural`, `semantic` booleans)

## Domain Context

**Affected Bounded Contexts:**

- **Spec Management** — Extended with wiki delta merge logic (whole-page replacement, simpler than section-level spec merge). New entity: WikiPage, WikiDelta.
- **Artifact Workflow** — Wiki ingest becomes a post-workflow step; wiki navigation becomes a pre-workflow step. Wiki delta files live alongside spec deltas in change directories.
- **Configuration** — New `wiki` section in ProjectConfig schema.
- **CLI Interface** — New `grspec wiki lint` command. Archive command gains wiki-related flags and steps.
- **Template System** — New skill template for `/grsx:wiki`, modified skill templates for wiki-aware navigation in existing skills.

**New Entities:**


| Entity    | Context         | Description                                                                 |
| --------- | --------------- | --------------------------------------------------------------------------- |
| WikiPage  | Spec Management | A markdown file with YAML frontmatter, body, and `[[wikilinks]]`            |
| WikiIndex | Spec Management | Navigation catalog (`index.md`) listing all pages with one-line summaries   |
| WikiLog   | Spec Management | Append-only operation timeline (`log.md`)                                   |
| WikiDelta | Spec Management | A whole-page replacement file in `changes/<name>/wiki/`                     |
| PageLock  | Spec Management | `blocked_by` + `blocked_since` frontmatter fields preventing parallel edits |


## Risk Assessment

- **Scope**: Moderate — touches archive flow, config loading, skill templates, and introduces new CLI command. Core spec management logic (specs-apply) is NOT modified; wiki merge is a separate, simpler code path (file copy/overwrite vs section-level merge).
- **Regression risk**: Low-medium — archive flow changes could affect existing spec merge if poorly integrated. Mitigation: wiki merge step is additive and runs after spec merge; `--skip-wiki` flag provides escape hatch.
- **Performance**: Wiki lint with semantic checks requires LLM calls, which are slow. Mitigation: structural lint is code-only (fast); semantic lint is opt-in via flag; `on_archive` lint is configurable.
- **Adoption risk**: Wiki is entirely opt-in (`wiki.enabled: true` in config). Projects without wiki configuration are unaffected. All existing workflows continue to work identically when wiki is absent.
- **Token cost**: Full wiki init on large codebases could be expensive. Mitigation: batched construction with human confirmation at each batch boundary.
- **Knowledge accuracy**: LLM-generated wiki content may contain errors. Mitigation: build-time verification (separate verifier pass) + periodic lint + `confidence` field in frontmatter + immutable raw sources for traceability.

## Impact

**New files:**

- `src/core/wiki.ts` — Wiki page parsing, delta detection, merge logic, index/log management
- `src/core/wiki-lint.ts` — Structural lint checks (frontmatter, wikilinks, orphans, coverage)
- `src/commands/wiki.ts` — `grspec wiki lint` CLI command
- `schemas/spec-driven/templates/wiki-init.md` — Wiki init instruction template
- `schemas/spec-driven/templates/wiki-ingest.md` — Wiki ingest instruction template
- `.cursor/skills/grspec-wiki/SKILL.md` — `/grsx:wiki` skill
- `.cursor/commands/grsx-wiki.md` — `/grsx:wiki` slash command

**Modified files:**

- `src/core/archive.ts` — Add wiki delta merge step, source summary generation
- `src/core/project-config.ts` — Add `wiki` section to ProjectConfigSchema
- `src/cli/index.ts` — Register `grspec wiki` command group
- `.cursor/skills/grspec-explore/SKILL.md` — Add wiki navigation preamble
- `.cursor/skills/grspec-propose/SKILL.md` — Add wiki navigation + wiki delta generation
- `.cursor/skills/grspec-apply-change/SKILL.md` — Add wiki navigation
- `.cursor/skills/grspec-archive-change/SKILL.md` — Add wiki merge awareness

**Dependencies:** No new npm dependencies expected. Wiki features use existing markdown parsing and filesystem operations.