# openspec-conventions (delta)

## ADDED Requirements

### Requirement: Constitution file

The grspec project directory SHALL support an optional `constitution.md` file at `grspec/constitution.md`.

#### Scenario: Optional constitution present

- **WHEN** a grspec project includes `grspec/constitution.md`
- **THEN** tooling and documentation SHALL treat it as an optional project-level constitution artifact
- **AND** the file MAY be absent without invalidating the project layout

### Requirement: Domain model file

The grspec project directory SHALL support an optional `domain-model.md` file at `grspec/domain-model.md`.

#### Scenario: Optional domain model present

- **WHEN** a grspec project includes `grspec/domain-model.md`
- **THEN** tooling and documentation SHALL treat it as an optional domain model artifact
- **AND** the file MAY be absent without invalidating the project layout

### Requirement: Project configuration file naming

The project configuration file for grspec SHALL be named `grspec.yaml`, replacing use of `config.yaml` as the canonical project configuration filename.

#### Scenario: Tooling resolves project config

- **WHEN** tooling loads project-level grspec configuration
- **THEN** it SHALL read `grspec/grspec.yaml` as the primary project configuration file
- **AND** it SHALL NOT require `config.yaml` for that purpose

### Requirement: Bounded context change metadata

Each change's `.grspec.yaml` SHALL support optional `context.bounded-contexts` and `context.depends-on-contexts` fields for documenting bounded-context boundaries and dependencies.

#### Scenario: Change declares bounded contexts

- **WHEN** a change directory contains `.grspec.yaml` with `context.bounded-contexts` and/or `context.depends-on-contexts`
- **THEN** validation SHALL accept those optional fields when present
- **AND** tooling MAY surface them for planning and dependency awareness

#### Scenario: Change omits context fields

- **WHEN** `.grspec.yaml` omits `context.bounded-contexts` and `context.depends-on-contexts`
- **THEN** the change SHALL remain valid
- **AND** tooling SHALL behave as if no bounded-context metadata were declared
