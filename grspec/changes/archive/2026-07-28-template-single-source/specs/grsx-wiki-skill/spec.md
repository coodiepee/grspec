---
type: spec
change: template-single-source
created: 2026-07-28
schema: spec-driven
---
## Purpose
Delta for wiki skill packaging: each wiki slash subcommand body SHALL load from a dedicated Markdown content file (single-source with the loader), eliminating INLINE command template literals.

## ADDED Requirements

### Requirement: Wiki slash subcommand content files
Each wiki slash subcommand (`wiki-init`, `wiki-ingest`, `wiki-lint`, `wiki-query`, `wiki-sync`, `wiki-status`) SHALL have a corresponding standalone Markdown file under the workflow templates content directory. The command template factory SHALL load that file via `loadWorkflowTemplate` and SHALL NOT embed the full instruction body as a TypeScript template literal.

#### Scenario: Wiki init command loads Markdown
- **WHEN** `getGrsxWikiInitCommandTemplate()` is called
- **THEN** `content` SHALL equal `loadWorkflowTemplate('wiki-init')` (or the agreed content template name for init)
- **AND** the TypeScript module SHALL NOT contain an INLINE full-body string for that command

#### Scenario: All wiki subcommands covered
- **WHEN** wiki command templates are enumerated for generation
- **THEN** each of init, ingest, lint, query, sync, and status SHALL load a dedicated content Markdown file

### Requirement: Wiki hub command shares skill Markdown or dedicated hub file
The hub `/grsx-wiki` command body SHALL load Markdown via `loadWorkflowTemplate` (either the same `wiki` file as `getWikiSkillTemplate().instructions`, or a dedicated hub content file). It SHALL NOT use an INLINE short stub that diverges from a loadable content file.

#### Scenario: Hub command not INLINE
- **WHEN** `getGrsxWikiCommandTemplate()` is called
- **THEN** `content` SHALL be produced by `loadWorkflowTemplate(...)`
- **AND** a parity test SHALL assert identity with the chosen hub Markdown file

## MODIFIED Requirements

### Requirement: Wiki init command
The `/grsx-wiki-init` command SHALL orchestrate full wiki construction from the existing codebase in batched phases with human confirmation. The authoritative agent instructions for this command SHALL live in the wiki-init content Markdown file loaded at runtime.

#### Scenario: Plan phase
- **WHEN** the user invokes `/grsx-wiki-init`
- **THEN** the loaded content SHALL instruct scanning raw sources (src/, grspec/specs/, constitution.md, domain-model.md, changes/archive/)
- **AND** SHALL produce a build plan listing pages to create, organized in batches
- **AND** SHALL present the plan to the user for confirmation before proceeding

#### Scenario: Build phase with batch confirmation
- **WHEN** the user confirms the build plan
- **THEN** the loaded content SHALL instruct processing one batch at a time
- **AND** for each batch: generate pages via writer LLM, validate via verifier LLM, show results (page names + confidence levels) to the user
- **AND** SHALL wait for user confirmation before proceeding to the next batch

#### Scenario: Finalize phase
- **WHEN** all batches are complete
- **THEN** the loaded content SHALL instruct generating `overview.md`, `index.md`, and `log.md`
- **AND** SHALL run a final structural lint
