# artifact-graph Specification

## Purpose
Define the artifact graph model, dependency validation, and completion-state logic used by schema-driven workflows.
## Requirements
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

### Requirement: State Detection
The system SHALL detect artifact completion state by scanning the filesystem.

#### Scenario: Simple file exists
- **WHEN** an artifact generates "proposal.md" and the file exists
- **THEN** the artifact is marked as completed

#### Scenario: Simple file missing
- **WHEN** an artifact generates "proposal.md" and the file does not exist
- **THEN** the artifact is not marked as completed

#### Scenario: Glob pattern with files
- **WHEN** an artifact generates "specs/*.md" and the specs/ directory contains .md files
- **THEN** the artifact is marked as completed

#### Scenario: Glob pattern empty
- **WHEN** an artifact generates "specs/*.md" and the specs/ directory is empty or missing
- **THEN** the artifact is not marked as completed

#### Scenario: Missing change directory
- **WHEN** the change directory does not exist
- **THEN** all artifacts are marked as not completed (empty state)

### Requirement: Ready Artifact Query
The system SHALL identify which artifacts are ready to be created based on dependency completion.

#### Scenario: Root artifacts ready initially
- **WHEN** no artifacts are completed
- **THEN** getNextArtifacts() returns artifacts with no dependencies

#### Scenario: Dependent artifact becomes ready
- **WHEN** an artifact's dependencies are all completed
- **THEN** getNextArtifacts() includes that artifact

#### Scenario: Blocked artifacts excluded
- **WHEN** an artifact has uncompleted dependencies
- **THEN** getNextArtifacts() does not include that artifact

### Requirement: Completion Check
The system SHALL determine when all artifacts in a graph are complete.

#### Scenario: All complete
- **WHEN** all artifacts in the graph are in the completed set
- **THEN** isComplete() returns true

#### Scenario: Partially complete
- **WHEN** some artifacts in the graph are not completed
- **THEN** isComplete() returns false

### Requirement: Blocked Query
The system SHALL identify which artifacts are blocked and return all their unmet dependencies.

#### Scenario: Artifact blocked by single dependency
- **WHEN** artifact B requires artifact A and A is not complete
- **THEN** getBlocked() returns `{ B: ['A'] }`

#### Scenario: Artifact blocked by multiple dependencies
- **WHEN** artifact C requires A and B, and only A is complete
- **THEN** getBlocked() returns `{ C: ['B'] }`

#### Scenario: Artifact blocked by all dependencies
- **WHEN** artifact C requires A and B, and neither is complete
- **THEN** getBlocked() returns `{ C: ['A', 'B'] }`

### Requirement: Schema Directory Structure
The system SHALL support self-contained schema directories with co-located templates.

#### Scenario: Schema with templates
- **WHEN** a schema directory contains `schema.yaml` and `templates/` subdirectory
- **THEN** artifacts can reference templates relative to the schema's templates directory

#### Scenario: User schema override
- **WHEN** a schema directory exists at `${XDG_DATA_HOME}/grspec/schemas/<name>/`
- **THEN** the system uses that directory instead of the built-in

#### Scenario: Built-in schema fallback
- **WHEN** no user override exists for a schema
- **THEN** the system uses the package built-in schema directory

#### Scenario: List available schemas
- **WHEN** listing schemas
- **THEN** the system returns schema names from both user and package directories

### Requirement: Plan artifact status tracking

The artifact graph SHALL track `plan` artifact lifecycle status using the same status vocabulary as other tracked artifacts, including at minimum `pending`, `done`, and `blocked` states as applicable to the implementation.

#### Scenario: Plan appears in graph state

- **WHEN** a loaded schema defines a `plan` artifact
- **THEN** graph queries SHALL include `plan` in status and readiness calculations
- **AND** `plan` SHALL report `blocked` while required upstream artifacts remain incomplete

#### Scenario: Plan completion marks done

- **WHEN** completion rules for `plan` are satisfied per schema and filesystem checks
- **THEN** the artifact graph SHALL mark `plan` as `done`

### Requirement: Plan checklist completion for apply readiness

The artifact graph SHALL derive `plan` completion in part from `plan.md` checkbox completion using the same mechanism currently used to track `tasks.md` checkbox completion for task readiness.

#### Scenario: Incomplete plan checklists block plan artifact

- **WHEN** `plan.md` exists and contains incomplete checklist items (e.g., `- [ ]`)
- **THEN** the `plan` artifact SHALL NOT be treated as complete

#### Scenario: Complete plan checklists satisfy plan artifact

- **WHEN** `plan.md` exists and every checklist item is marked complete (e.g., `- [x]`) using the same checkbox patterns as `tasks.md` tracking
- **THEN** the `plan` artifact SHALL be eligible for `done` status according to the schema's completion rules

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

