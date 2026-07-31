# Implementation Plan: Add LLM Wiki Support

## Strategy

Implementation follows a bottom-up approach: core data model first, then CLI commands, then archive integration, then skill templates. Each phase is independently testable.

---

## Phase 1: Core Wiki Module [foundation]

### 1.1 Wiki page parser and frontmatter schema
- [x] Create `src/core/wiki.ts` with Zod schema for wiki page frontmatter (title, type, sources, related, created, updated, confidence, blocked_by, blocked_since, deleted, deleted_reason)
- [x] Implement `parseWikiPage(filePath)` — reads file, extracts YAML frontmatter and markdown body
- [x] Implement `validateWikiPage(page)` — validates frontmatter against Zod schema, returns errors
- [x] Add unit tests for frontmatter parsing (valid, missing fields, optional fields, deleted marker)

### 1.2 Wiki directory scanner
- [x] Implement `scanWikiDirectory(wikiDir)` — walks `grspec/wiki/` recursively, returns all page paths grouped by category (concepts, entities, sources, comparisons)
- [x] Implement `isWikiInitialized(grspecDir)` — checks if `grspec/wiki/index.md` exists
- [x] Add unit tests for directory scanning (empty, populated, missing wiki dir)

### 1.3 Wiki delta detection
- [x] Implement `detectWikiDeltas(changeWikiDir, mainWikiDir)` — scans `changes/<name>/wiki/`, classifies each file as ADDED (not in main), MODIFIED (exists in main, no deleted flag), or REMOVED (deleted: true in frontmatter)
- [x] Return typed array of `WikiDelta { path, type: 'added' | 'modified' | 'removed', sourcePath, targetPath }`
- [x] Add unit tests for delta detection (all three types, mixed, empty)

### 1.4 Wiki delta merge
- [x] Implement `mergeWikiDeltas(deltas, mainWikiDir)` — applies deltas: copy for ADDED/MODIFIED, delete for REMOVED
- [x] Create parent directories for new pages if needed
- [x] Return merge report: `{ added: string[], modified: string[], removed: string[] }`
- [x] Add unit tests for merge (ADDED creates file, MODIFIED overwrites, REMOVED deletes, idempotency)

### 1.5 Index and log management
- [x] Implement `generateWikiIndex(wikiDir)` — scans all pages, generates `index.md` content grouped by type with `[[wikilinks]]` and one-line summaries extracted from first paragraph
- [x] Implement `appendWikiLog(wikiDir, operation, description, affectedPages)` — appends `## [date] operation | description` entry to `log.md`
- [x] Add unit tests for index generation and log appending

### 1.6 Page locking
- [x] Implement `lockPage(pagePath, changeName)` — adds `blocked_by` and `blocked_since` to frontmatter
- [x] Implement `unlockPages(wikiDir, changeName)` — removes `blocked_by`/`blocked_since` from all pages locked by given change
- [x] Implement `isPageLocked(pagePath)` — reads frontmatter, returns lock info or null
- [x] Add unit tests for lock/unlock lifecycle

---

## Phase 2: Wiki Lint [verification]

### 2.1 Structural lint engine
- [x] Create `src/core/wiki-lint.ts`
- [x] Implement frontmatter validation check — scan all pages, report missing/invalid required fields
- [x] Implement wikilink integrity check — extract all `[[wikilinks]]`, resolve against page paths, report dead links
- [x] Implement orphan page detection — find pages with no incoming wikilinks (excluding index.md, log.md, overview.md)
- [x] Implement source path existence check — verify `sources` frontmatter paths exist in repo
- [x] Implement index completeness check — verify every wiki page appears in `index.md`
- [x] Implement spec capability coverage check — verify every `grspec/specs/<cap>/` has corresponding `wiki/entities/<cap>/`
- [x] Implement locked page reporting — list all pages with `blocked_by` set, including duration
- [x] Add unit tests for each structural check

### 2.2 Lint result model
- [x] Define `WikiLintResult` type: `{ structural: LintIssue[], semantic: LintIssue[], summary: { total, errors, warnings } }`
- [x] Define `LintIssue` type: `{ level: 'error' | 'warning', check: string, page: string, message: string }`
- [x] Implement JSON serialization for `--json` output

---

## Phase 3: CLI Commands [interface]

### 3.1 Wiki lint command
- [x] Create `src/commands/wiki.ts`
- [x] Register `grspec wiki lint` in `src/cli/index.ts` under a `wiki` command group
- [x] Implement flag parsing: `--structural`, `--semantic`, `--coverage`, `--fix`, `--json`
- [x] Wire to `wiki-lint.ts` structural checks
- [x] Format output: grouped by check type, colored pass/fail, summary line
- [x] Handle wiki-not-initialized case with helpful error message
- [x] Add integration tests for CLI command

### 3.2 Wiki status command
- [x] Register `grspec wiki status` in CLI
- [x] Implement: scan wiki dir, count pages by type, list blocked pages, list pending deltas in active changes
- [x] Format output as summary table

---

## Phase 4: Config Integration [configuration]

### 4.1 Wiki config schema
- [x] Add `wiki` section to `ProjectConfigSchema` in `src/core/project-config.ts`
- [x] Define Zod schema: `enabled` (boolean), `categories` (string array), `auto_ingest` (object), `lint` (object)
- [x] Implement resilient parsing with defaults (enabled: false, categories: default four, auto_ingest defaults, lint defaults)
- [x] Add config validation warnings for unknown wiki sub-fields
- [x] Add unit tests for wiki config parsing (present, absent, partial, invalid)

---

## Phase 5: Archive Integration [workflow]

### 5.1 Wiki merge in archive flow
- [x] Modify `src/core/archive.ts` to call wiki delta detection and merge after spec merge
- [x] Gate on `wiki.enabled` config — skip entirely if wiki is disabled or `grspec/wiki/` doesn't exist
- [x] Add `--skip-wiki` flag to archive command
- [x] Display wiki merge results alongside spec merge output (+ added, ~ modified, - removed)
- [x] Update index.md and append log.md after wiki merge
- [x] Release page locks for the archived change
- [x] Add integration tests for archive with wiki deltas

### 5.2 Source summary generation
- [x] Implement `generateSourceSummary(changeName, changeDir, wikiDir)` — reads change proposal/design/specs, generates `wiki/sources/YYYY-MM-DD-<change-name>.md` with type `source-summary`
- [x] Wire into archive flow after wiki merge
- [x] Add unit test for source summary generation

---

## Phase 6: Skill Templates [agent interface]

### 6.1 Wiki skill
- [x] Create `.cursor/skills/grspec-wiki/SKILL.md` with subcommand routing: init, ingest, lint, query, sync, status
- [x] Write init instructions: plan phase → batch build → finalize
- [x] Write ingest instructions: read index → read change artifacts → generate wiki deltas → verify → write
- [x] Write lint instructions: run `grspec wiki lint --json` → semantic analysis → consolidated report
- [x] Write query instructions: read index → navigate → synthesize → offer to save
- [x] Write sync instructions: identify deltas → merge → update index/log → release locks
- [x] Write status instructions: run `grspec wiki status`

### 6.2 Wiki slash command
- [x] Create `.cursor/commands/grsx-wiki.md` slash command template
- [x] Add to command generation pipeline in `src/core/command-generation/`

### 6.3 Existing skill modifications
- [x] Modify `.cursor/skills/grspec-explore/SKILL.md` — add wiki navigation preamble
- [x] Modify `.cursor/skills/grspec-propose/SKILL.md` — add wiki navigation + wiki delta generation step
- [x] Modify `.cursor/skills/grspec-apply-change/SKILL.md` — add wiki navigation preamble
- [x] Modify `.cursor/skills/grspec-archive-change/SKILL.md` — add wiki merge awareness
- [x] Modify `.cursor/skills/grspec-verify-change/SKILL.md` — add wiki as verification baseline

### 6.4 Schema template files
- [x] Create `schemas/spec-driven/templates/wiki-init.md` — instruction template for wiki init artifact (handled by /grsx:wiki skill, not schema artifact)
- [x] Create `schemas/spec-driven/templates/wiki-ingest.md` — instruction template for wiki ingest (handled by /grsx:wiki skill, not schema artifact)

---

## Phase 7: Documentation [docs]

- [x] Update `docs/concepts.md` — add Wiki knowledge layer to conceptual overview
- [x] Update `docs/commands.md` — add `grspec wiki lint`, `grspec wiki status`
- [x] Update `docs/workflows.md` — add wiki-aware workflow diagrams
- [x] Update `docs/customization.md` — add wiki configuration section
- [x] Update `README.md` — mention wiki feature in feature list
