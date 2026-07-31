---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Schema Loading
The system SHALL load artifact graph definitions from YAML schema files within schema directories.

For `spec-driven`, version 2 SHALL be the default in `schemas/spec-driven/schema.yaml`. Version 1 SHALL remain available as a frozen copy at `schemas/spec-driven/v1/schema.yaml`.

#### Scenario: Valid schema loaded
- **WHEN** a schema directory contains a valid `schema.yaml` file
- **THEN** the system returns an ArtifactGraph with all artifacts and dependencies

#### Scenario: v2 schema has five artifacts
- **WHEN** the active `spec-driven` schema version 2 is loaded
- **THEN** the artifact list SHALL contain `proposal`, `specs`, `design`, `ui`, and `plan`

#### Scenario: v1 frozen schema has four artifacts
- **WHEN** `schemas/spec-driven/v1/schema.yaml` is loaded
- **THEN** the artifact list SHALL contain exactly `proposal`, `specs`, `design`, and `plan`
- **AND** SHALL NOT contain `ui`

### Requirement: Build Order Calculation
The system SHALL compute a valid topological build order for artifacts.

#### Scenario: v2 diamond with ui
- **WHEN** the v2 schema is loaded
- **THEN** `getBuildOrder()` SHALL place `ui` after `design`
- **AND** SHALL place `plan` after `specs`, `design`, and `ui`

### Requirement: Dual schema version resolution
`resolveSchema` SHALL select v1 or v2 YAML based on change metadata `schemaVersion`. When `schemaVersion` is omitted, the system SHALL treat the change as version 1. `grspec new change` SHALL write `schemaVersion: 2` to `.grspec.yaml`.

`grspec status --json` SHALL include `schemaVersion` in its output.

#### Scenario: New change uses v2
- **WHEN** user runs `grspec new change "my-feature"`
- **THEN** `.grspec.yaml` SHALL contain `schemaVersion: 2`
- **AND** `grspec status --change my-feature --json` SHALL report `schemaVersion: 2`

#### Scenario: Legacy change defaults to v1
- **WHEN** a change `.grspec.yaml` has no `schemaVersion` field
- **THEN** `resolveSchema` SHALL load the v1 graph
- **AND** `plan` SHALL NOT require `ui`

#### Scenario: Explicit v1 pin
- **WHEN** `.grspec.yaml` contains `schemaVersion: 1`
- **THEN** the v1 four-artifact graph SHALL be used
