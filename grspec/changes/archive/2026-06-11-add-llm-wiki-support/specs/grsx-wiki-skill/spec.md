## ADDED Requirements

### Requirement: Wiki init command

The `/grsx-wiki-init` command SHALL orchestrate full wiki construction from the existing codebase in batched phases with human confirmation.

#### Scenario: Plan phase

- **WHEN** the user invokes `/grsx-wiki-init`
- **THEN** the skill SHALL scan raw sources (src/, grspec/specs/, constitution.md, domain-model.md, changes/archive/)
- **AND** SHALL produce a build plan listing pages to create, organized in batches
- **AND** SHALL present the plan to the user for confirmation before proceeding

#### Scenario: Build phase with batch confirmation

- **WHEN** the user confirms the build plan
- **THEN** the skill SHALL process one batch at a time
- **AND** for each batch: generate pages via writer LLM, validate via verifier LLM, show results (page names + confidence levels) to the user
- **AND** SHALL wait for user confirmation before proceeding to the next batch

#### Scenario: Finalize phase

- **WHEN** all batches are complete
- **THEN** the skill SHALL generate `overview.md`, `index.md`, and `log.md`
- **AND** SHALL run a final structural lint

### Requirement: Wiki ingest command

The `/grsx-wiki-ingest` command SHALL perform incremental wiki updates based on the current change context.

#### Scenario: Ingest from active change

- **WHEN** the user invokes `/grsx-wiki-ingest` with an active change
- **THEN** the skill SHALL read the change's artifacts (proposal, design, specs, new code)
- **AND** SHALL read `wiki/index.md` to understand existing knowledge
- **AND** SHALL generate wiki delta files in `changes/<name>/wiki/`
- **AND** SHALL respect page locks (skip pages with `blocked_by` set by other changes)

#### Scenario: Build-time verification during ingest

- **WHEN** generating wiki delta pages
- **THEN** each page SHALL be verified before writing
- **AND** verification SHALL check consistency with specs and existing wiki content

### Requirement: Wiki lint command

The `/grsx-wiki-lint` command SHALL orchestrate wiki health checks and present results.

#### Scenario: Run lint and report

- **WHEN** the user invokes `/grsx-wiki-lint`
- **THEN** the skill SHALL run structural checks (via `grspec wiki lint --structural --json`)
- **AND** SHALL run semantic checks (LLM-based analysis)
- **AND** SHALL present a consolidated report with actionable findings

### Requirement: Wiki query command

The `/grsx-wiki-query` command SHALL answer questions by navigating the wiki.

#### Scenario: Navigate and answer

- **WHEN** the user invokes `/grsx-wiki-query "<question>"`
- **THEN** the skill SHALL read `wiki/index.md` to identify relevant pages
- **AND** SHALL read those pages and synthesize an answer with `[[wikilink]]` citations
- **AND** if the answer produces novel knowledge, SHALL offer to write it back as a new wiki page

### Requirement: Wiki sync command

The `/grsx-wiki-sync` command SHALL merge wiki deltas from a change to the main wiki without archiving.

#### Scenario: Sync wiki deltas

- **WHEN** the user invokes `/grsx-wiki-sync`
- **THEN** the skill SHALL identify wiki deltas in the active change
- **AND** SHALL merge them to `grspec/wiki/` (ADDED → create, MODIFIED → overwrite, REMOVED → delete)
- **AND** SHALL update `index.md` and append to `log.md`
- **AND** SHALL release page locks held by this change

### Requirement: Wiki status command

The `/grsx-wiki-status` command SHALL display wiki health overview.

#### Scenario: Show status

- **WHEN** the user invokes `/grsx-wiki-status`
- **THEN** the skill SHALL display total pages, pages by type, blocked pages, pending deltas, and recent log entries

### Requirement: Wiki navigation preamble in existing skills

All wiki-aware skills (`/grsx:explore`, `/grsx:propose`, `/grsx:apply`, `/grsx:verify`) SHALL include a wiki navigation preamble that reads `wiki/index.md` and relevant pages before performing their primary function.

#### Scenario: Wiki exists — navigate before acting

- **WHEN** a wiki-aware skill is invoked and `grspec/wiki/index.md` exists
- **THEN** the skill SHALL read `wiki/index.md`
- **AND** SHALL identify and read wiki pages relevant to the current task
- **AND** SHALL use wiki knowledge as cognitive foundation for the task

#### Scenario: Wiki absent — proceed normally

- **WHEN** a wiki-aware skill is invoked and `grspec/wiki/index.md` does not exist
- **THEN** the skill SHALL proceed with its normal workflow without wiki navigation
