---
type: spec
change: integrate-ui-into-workflow
created: 2026-06-11
schema: spec-driven
---
## ADDED Requirements

### Requirement: UI detect subcommand
The system SHALL provide a `grspec ui detect` subcommand that runs UI content detection on a change's artifacts and outputs the result.

The command SHALL accept:
- `--change <name>` — the change to analyze (required)
- `--json` — output as structured JSON (optional)

The JSON output SHALL include:
- `detected: boolean`
- `keywords: string[]`
- `source: string[]` — list of artifact filenames scanned (e.g., `["proposal.md"]`)
- `score: number` — count of matched keywords

#### Scenario: Detect UI in a change with UI content
- **WHEN** `grspec ui detect --change "add-dashboard" --json` is run
- **AND** the change's `proposal.md` contains "responsive dashboard with charts and dark mode"
- **THEN** the output SHALL include `"detected": true`
- **AND** `keywords` SHALL include the matched keywords
- **AND** `source` SHALL list the scanned files

#### Scenario: Detect no UI in a non-UI change
- **WHEN** `grspec ui detect --change "fix-memory-leak" --json` is run
- **AND** the change's `proposal.md` contains "fix the memory leak in the parser module"
- **THEN** the output SHALL include `"detected": false`
- **AND** `keywords` SHALL be an empty array

#### Scenario: Change does not exist
- **WHEN** `grspec ui detect --change "nonexistent" --json` is run
- **AND** no change directory exists for "nonexistent"
- **THEN** the command SHALL exit with a non-zero code
- **AND** output an error message

#### Scenario: Human-readable output
- **WHEN** `grspec ui detect --change "add-dashboard"` is run without `--json`
- **THEN** the output SHALL display whether UI was detected and which keywords matched in a readable format
