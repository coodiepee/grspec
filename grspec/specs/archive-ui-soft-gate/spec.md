# archive-ui-soft-gate Specification

## Purpose
Define the non-blocking archive soft gate that recommends verify when UI is active for a change.
## Requirements
### Requirement: Archive soft gate when UI active
The archive content template (`content/archive-change.md`) SHALL suggest running `/grsx:verify` before archiving when `effectiveUiActive` is true for the change.

The gate SHALL be non-blocking — the user MAY proceed with archive after acknowledging the warning.

`effectiveUiActive` SHALL follow ui-metadata-schema rules (v2: `parseUiArtifactStatus(ui.md) !== 'na'`; v1: metadata dual-read).

#### Scenario: UI active v2 change warns before archive
- **WHEN** user invokes archive on a v2 change with `ui.md` Status `done`
- **AND** `effectiveUiActive` is true
- **THEN** the archive template SHALL instruct suggesting `/grsx:verify` before proceeding

#### Scenario: Blocked UI still triggers soft gate
- **WHEN** `ui.md` has `Status: blocked`
- **THEN** `effectiveUiActive` SHALL be true
- **AND** archive SHALL still suggest verify before proceeding

#### Scenario: na status skips soft gate
- **WHEN** v2 change has `ui.md` with `Status: na`
- **THEN** `effectiveUiActive` SHALL be false
- **AND** archive SHALL NOT include UI-specific verify suggestion

#### Scenario: Soft gate does not block archive
- **WHEN** user confirms archive despite the warning
- **THEN** archive SHALL complete without requiring verify to have run

