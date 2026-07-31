# ui-project-status Specification

## Purpose
Report the current UI project configuration including design system presence, upstream data version, and sync status.
## Requirements
### Requirement: Design system detection
The system SHALL detect whether a persisted design-system exists in the project and display its location, style name, and generation timestamp.

#### Scenario: Design system present
- **WHEN** user runs `grspec ui status` and `design-system/*/MASTER.md` exists relative to cwd
- **THEN** the system displays: location path, project name, style name (extracted from MASTER.md), generation date, and list of page override files

#### Scenario: No design system
- **WHEN** user runs `grspec ui status` and no `design-system/` directory exists
- **THEN** the system displays "No design system found" with a suggestion to run `grspec ui design-system`

### Requirement: Active change UI detection
The system SHALL detect whether any active grspec change involves UI work.

#### Scenario: Active change with UI content
- **WHEN** an active change exists and its proposal or design mentions UI keywords
- **THEN** the system displays the change name, detected UI keywords, and whether a change-level design-system is persisted

#### Scenario: No active changes
- **WHEN** no active changes exist or none involve UI
- **THEN** the system displays "No active UI changes"

### Requirement: Data version display
The system SHALL display the upstream data version and statistics from `UPSTREAM.md`.

#### Scenario: UPSTREAM.md present
- **WHEN** `assets/ui/UPSTREAM.md` exists
- **THEN** the system displays synced version, sync date, and data counts (styles, colors, fonts, UX rules, charts, stacks)

#### Scenario: UPSTREAM.md absent
- **WHEN** `assets/ui/UPSTREAM.md` does not exist
- **THEN** the system displays data statistics computed from CSV file counts with "version: unknown"

### Requirement: JSON output
The system SHALL support `--json` for structured output.

#### Scenario: JSON output
- **WHEN** user runs `grspec ui status --json`
- **THEN** output is valid JSON with `designSystem`, `activeChange`, `dataVersion` fields

