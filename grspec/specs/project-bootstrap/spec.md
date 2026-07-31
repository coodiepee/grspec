# project-bootstrap Specification

## Purpose
Define ordered bootstrap phase sequences for new and existing project tracks, bootstrap state tracking in `grspec.yaml`, and completion gating behavior that transitions to the standard change workflow.

## Requirements
### Requirement: New project bootstrap track sequence
When the user runs `grspec init --track new-project`, grspec SHALL create a bootstrap sequence whose ordered phases are: domain modeling, then architecture, then schema bootstrap, then skeleton generation (final naming MAY follow `grspec.yaml` conventions but the sequence MUST be preserved).

#### Scenario: New-project init records ordered bootstrap phases
- **WHEN** the user runs `grspec init --track new-project`
- **THEN** grspec SHALL initialize bootstrap state that lists domain modeling as the first phase
- **AND** SHALL list architecture as following domain modeling
- **AND** SHALL list schema bootstrap after architecture
- **AND** SHALL list skeleton generation as the final bootstrap phase

### Requirement: Existing project bootstrap track sequence
When the user runs `grspec init --track existing-project`, grspec SHALL create a reverse-engineering-oriented bootstrap sequence: constitution extraction, then domain model extraction, then incremental spec building.

#### Scenario: Existing-project init records reverse-engineering phases
- **WHEN** the user runs `grspec init --track existing-project`
- **THEN** grspec SHALL initialize bootstrap state with constitution extraction as an early phase
- **AND** SHALL follow with domain model extraction
- **AND** SHALL conclude the bootstrap definition with incremental spec building guidance or placeholders

### Requirement: Bootstrap section in grspec.yaml
The project `grspec.yaml` configuration SHALL include a `bootstrap` section that tracks completion status of each bootstrap phase for the active track until the project is fully initialized.

#### Scenario: Config persists per-phase completion flags
- **WHEN** grspec initializes or updates bootstrap tracking
- **THEN** `grspec.yaml` SHALL contain a `bootstrap` key
- **AND** the value SHALL record completion for each phase relevant to the selected track
- **AND** grspec SHALL update this section as phases complete

### Requirement: Bootstrap completion gates standard workflow
When all bootstrap phases for the current track are marked done, grspec SHALL treat the project as fully initialized and SHALL route subsequent work through the standard change workflow without requiring bootstrap-only commands.

#### Scenario: All phases done enables normal change flow
- **WHEN** every bootstrap phase in `grspec.yaml` for the active track is marked complete
- **AND** the user initiates a standard change-oriented command (for example creating or listing changes)
- **THEN** grspec SHALL NOT require incomplete-bootstrap blocking for those commands
- **AND** SHALL apply standard change workflow rules

#### Scenario: Incomplete bootstrap surfaces next phase
- **WHEN** at least one bootstrap phase remains incomplete
- **AND** the user runs a command that assumes full initialization
- **THEN** grspec SHALL surface which bootstrap phase is next or incomplete
- **AND** SHALL guide completion before treating the project as fully initialized
