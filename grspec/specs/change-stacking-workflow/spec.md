# change-stacking-workflow Specification

## Purpose
Support optional metadata on active changes to express sequencing and decomposition relationships (`dependsOn`, `provides`, `requires`, `touches`), enabling overlap detection and dependency-aware workflows.
## Requirements
### Requirement: Stack Metadata Model
The system SHALL support optional metadata on active changes to express sequencing and decomposition relationships.

#### Scenario: Optional stack metadata is present
- **WHEN** a change includes stack metadata fields
- **THEN** the system SHALL parse and expose `dependsOn`, `provides`, `requires`, `touches`, and `parent`
- **AND** validation SHALL enforce normalized field shapes and value types (`dependsOn`/`provides`/`requires`/`touches` as string arrays, `parent` as string when present)

#### Scenario: Backward compatibility without stack metadata
- **WHEN** a change does not include stack metadata
- **THEN** existing behavior SHALL continue without migration steps
- **AND** validation SHALL not fail solely because stack metadata is absent

### Requirement: Change Dependency Graph
The system SHALL provide dependency-aware ordering for active changes.

#### Scenario: Build dependency order
- **WHEN** users request stack planning output
- **THEN** the system SHALL compute a dependency graph across active changes
- **AND** SHALL return a deterministic topological order for unblocked changes

#### Scenario: Tie-breaking within the same dependency depth
- **WHEN** multiple unblocked changes share the same topological dependency depth
- **THEN** ordering SHALL break ties lexicographically by change ID
- **AND** repeated runs over the same input SHALL return the same order

#### Scenario: Dependency cycle detection
- **WHEN** active changes contain a dependency cycle
- **THEN** validation SHALL fail with cycle details before archive or sequencing actions proceed
- **AND** output SHALL include actionable guidance to break the cycle

### Requirement: Capability marker and overlap semantics
The system SHALL treat capability markers as validation contracts and `touches` as advisory overlap signals.

#### Scenario: Required capability provided by an active change
- **WHEN** change B declares `requires` marker `X`
- **AND** active change A declares `provides` marker `X`
- **THEN** validation SHALL require B to declare an explicit ordering edge in `dependsOn` to at least one active provider of `X`
- **AND** validation SHALL fail if no explicit dependency is declared

#### Scenario: Requires marker without active provider
- **WHEN** a change declares a `requires` marker
- **AND** no active change declares the corresponding `provides` marker
- **THEN** validation SHALL NOT infer an implicit dependency edge
- **AND** ordering SHALL continue to be determined solely by explicit `dependsOn` relationships

#### Scenario: Requires marker satisfied by archived history
- **WHEN** a change declares a `requires` marker
- **AND** no active change provides that marker
- **AND** at least one archived change in history provides that marker
- **THEN** validation SHALL NOT warn solely about missing provider
- **AND** SHALL continue to use explicit `dependsOn` for active ordering

#### Scenario: Requires marker missing in full history
- **WHEN** a change declares a `requires` marker
- **AND** no active or archived change in history provides that marker
- **THEN** validation SHALL emit a non-blocking warning naming the change and missing marker
- **AND** SHALL NOT infer an implicit dependency edge

#### Scenario: Overlap warning for shared touches
- **WHEN** multiple active changes declare overlapping `touches` values (matching file paths)
- **THEN** validation SHALL emit a warning listing the overlapping changes, file paths, and their declared intents
- **AND** validation SHALL NOT fail solely on overlap

### Requirement: File-Level Touches with Intent
The system SHALL support file-level impact declarations with semantic intent as the `touches` metadata format.

#### Scenario: Touches declares file path, intent, and mode
- **WHEN** a change includes `touches` metadata
- **THEN** each entry SHALL contain `path` (string), `intent` (verb-first sentence), and `mode` (create | modify | delete)
- **AND** validation SHALL enforce these field shapes

#### Scenario: Overlap detection across active changes at file level
- **WHEN** two or more active changes declare `touches` entries with the same `path` value
- **THEN** the system SHALL emit an overlap warning including both changes' names and their respective `intent` values for the shared path
- **AND** SHALL surface the warning during propose and validation phases

#### Scenario: Touches limited to 8 entries
- **WHEN** a change declares more than 8 `touches` entries
- **THEN** validation SHALL emit a non-blocking warning suggesting the change be split into smaller scopes

### Requirement: Overlap Coordination Modes
The system SHALL support coordination modes when applying changes with file-level overlap.

#### Scenario: Extend mode (overlapping change already implemented)
- **WHEN** an overlapping change's related tasks are complete
- **AND** the overlapping branch has been merged or the file reflects their changes
- **THEN** the apply workflow SHALL read the current file state and build upon it

#### Scenario: Prepare mode (overlapping change not yet implemented)
- **WHEN** an overlapping change's related tasks are not yet complete
- **AND** the overlapping branch has not been merged
- **THEN** the apply workflow SHALL write code that leaves extension points compatible with the other change's declared intent

#### Scenario: Negotiate mode (structurally incompatible intents)
- **WHEN** the intents of two overlapping changes are architecturally incompatible
- **THEN** the apply workflow SHALL present 2-3 resolution options with trade-offs
- **AND** SHALL allow the user to select a suggestion or provide custom input
- **AND** SHALL record the chosen resolution in `design.md` as a coordination decision

