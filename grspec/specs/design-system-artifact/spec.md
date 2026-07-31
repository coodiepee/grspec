# design-system-artifact Specification

## Purpose
Define the `design-system/` directory convention for persisting UI design-system output within a change, including structure requirements and metadata signaling.
## Requirements
### Requirement: ui-detected metadata field
The `.grspec.yaml` change metadata file SHALL support an optional `ui-detected: boolean` field. When present and `true`, downstream workflow skills MAY include UI-specific guidance without re-scanning the proposal.

#### Scenario: Metadata with ui-detected
- **WHEN** `.grspec.yaml` contains `ui-detected: true`
- **THEN** the metadata reader SHALL parse and return `uiDetected: true`

#### Scenario: Metadata without ui-detected
- **WHEN** `.grspec.yaml` does not contain a `ui-detected` field
- **THEN** the metadata reader SHALL return `uiDetected` as `undefined` or `false`

#### Scenario: ui-detected does not affect artifact completion
- **WHEN** `detectCompleted` evaluates change artifacts
- **THEN** the `ui-detected` field SHALL have no effect on completion status

