# cli-wiki Specification

## Purpose
Provide `grspec wiki` CLI subcommands for wiki health checks (lint), content queries, and status reporting.
## Requirements
### Requirement: Wiki lint command

The CLI SHALL provide a `grspec wiki lint` command that runs wiki health checks and reports results.

#### Scenario: Default lint (structural checks)

- **WHEN** the user runs `grspec wiki lint`
- **THEN** the system SHALL run structural checks
- **AND** SHALL display results grouped by check type

#### Scenario: Structural-only lint

- **WHEN** the user runs `grspec wiki lint --structural`
- **THEN** the system SHALL run only structural checks (no LLM required)

#### Scenario: Semantic-only lint (agent required)

- **WHEN** the user runs `grspec wiki lint --semantic`
- **THEN** the system SHALL display an error indicating semantic checks require an LLM agent
- **AND** SHALL suggest using `/grsx-wiki-lint` in the editor

#### Scenario: Coverage analysis

- **WHEN** the user runs `grspec wiki lint --coverage`
- **THEN** the system SHALL report spec capability coverage and index completeness

#### Scenario: Auto-fix mode

- **WHEN** the user runs `grspec wiki lint --fix`
- **THEN** the system SHALL automatically fix structural issues (regenerate index.md for missing entries)
- **AND** SHALL report what was fixed
- **AND** SHALL re-run lint after fixes to show remaining issues

#### Scenario: JSON output

- **WHEN** the user runs `grspec wiki lint --json`
- **THEN** the system SHALL output results in JSON format for programmatic consumption

#### Scenario: Wiki not initialized

- **WHEN** the user runs `grspec wiki lint` and `grspec/wiki/` does not exist
- **THEN** the system SHALL display an error suggesting `/grsx-wiki-init`

### Requirement: Wiki status command

The CLI SHALL provide a `grspec wiki status` command that shows wiki overview information.

#### Scenario: Display wiki status

- **WHEN** the user runs `grspec wiki status`
- **THEN** the system SHALL display: total page count, page count by type, most recently updated pages, blocked pages with lock details, and pending wiki deltas in active changes

### Requirement: Agent-only command stubs

The CLI SHALL provide stub commands for `grspec wiki init`, `grspec wiki ingest`, `grspec wiki query`, and `grspec wiki sync` that direct users to the corresponding editor slash commands.

#### Scenario: Running agent-only command in terminal

- **WHEN** the user runs `grspec wiki init` (or ingest, query, sync)
- **THEN** the system SHALL display a message indicating the command is agent-driven
- **AND** SHALL suggest the corresponding slash command (e.g., `/grsx-wiki-init`)
- **AND** SHALL exit with code 1

