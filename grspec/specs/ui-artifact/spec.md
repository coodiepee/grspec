# ui-artifact Specification

## Purpose
Define the schema v2 ui artifact, status parsing, and foundation readiness checks.
## Requirements
### Requirement: ui artifact in spec-driven v2 schema
The `spec-driven` schema version 2 SHALL define a `ui` artifact with:

- `id`: `ui`
- `generates`: `ui.md`
- `requires`: `[design]`
- `template`: `ui.md`

The `plan` artifact SHALL require `ui` in addition to `specs` and `design`.

#### Scenario: v2 build order includes ui after design
- **WHEN** the v2 schema graph is loaded and no artifacts are complete
- **AND** `proposal`, `specs`, and `design` are all marked complete
- **THEN** `getNextArtifacts()` SHALL include `ui`
- **AND** SHALL NOT include `plan` until `ui` is complete

#### Scenario: ui artifact completion by file existence
- **WHEN** `detectCompleted` scans a v2 change directory containing `ui.md`
- **THEN** the `ui` artifact SHALL be marked complete
- **AND** completion SHALL NOT depend on the `## Status` section value

#### Scenario: ui artifact incomplete when file missing
- **WHEN** `detectCompleted` scans a v2 change directory without `ui.md`
- **THEN** the `ui` artifact SHALL NOT be marked complete

### Requirement: ui artifact frontmatter type
When `injectFrontmatter` is called for artifact id `ui`, the YAML `type` field SHALL be `ui`.

#### Scenario: Frontmatter type mapping
- **WHEN** `generateInstructions` is called with `artifactId = 'ui'`
- **THEN** the injected template frontmatter SHALL include `type: ui`

### Requirement: parseUiArtifactStatus
The system SHALL provide `parseUiArtifactStatus(uiMdPath: string)` returning `na | blocked | done | unknown`.

The function SHALL read the `## Status` section and parse the first non-empty line as the status value (case-insensitive). Missing section, empty value, or unreadable file SHALL return `unknown`.

#### Scenario: Parse status na
- **WHEN** `ui.md` contains `## Status` followed by `na`
- **THEN** `parseUiArtifactStatus` SHALL return `na`

#### Scenario: Parse status blocked
- **WHEN** `ui.md` contains `## Status` followed by `blocked`
- **THEN** `parseUiArtifactStatus` SHALL return `blocked`

#### Scenario: Parse status done
- **WHEN** `ui.md` contains `## Status` followed by `done`
- **THEN** `parseUiArtifactStatus` SHALL return `done`

#### Scenario: Missing status section
- **WHEN** `ui.md` exists but has no `## Status` section
- **THEN** `parseUiArtifactStatus` SHALL return `unknown`

#### Scenario: Unknown status applies conservative gates
- **WHEN** `parseUiArtifactStatus` returns `unknown` for a v2 change
- **THEN** apply and verify workflows SHALL treat UI gates the same as `blocked` (not `na`)

### Requirement: isUiFoundationReady
The system SHALL provide `isUiFoundationReady(projectRoot: string)` returning `true` if and only if `grspec/ui/MASTER.md` exists under `projectRoot`.

#### Scenario: Foundation ready
- **WHEN** `grspec/ui/MASTER.md` exists
- **THEN** `isUiFoundationReady(projectRoot)` SHALL return `true`

#### Scenario: Foundation missing
- **WHEN** `grspec/ui/MASTER.md` does not exist
- **THEN** `isUiFoundationReady(projectRoot)` SHALL return `false`

