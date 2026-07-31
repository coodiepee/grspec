# cli-init (delta)

## ADDED Requirements

### Requirement: Track parameter

`grspec init` SHALL accept a `--track` parameter with values `new-project` or `existing-project` to determine initialization mode.

#### Scenario: Accepting track values

- **WHEN** the user runs `grspec init --track new-project` or `grspec init --track existing-project` with other required non-interactive options as applicable
- **THEN** the command SHALL use the specified track to select initialization behavior
- **AND** the command SHALL reject invalid `--track` values with a non-zero exit code and an error that lists the allowed values

### Requirement: New project initialization track

When `--track new-project` is specified, `grspec init` SHALL generate `constitution.md` and `domain-model.md` from templates and SHALL generate `grspec.yaml` including a bootstrap section appropriate for greenfield adoption.

#### Scenario: New project track output

- **WHEN** `grspec init` runs with `--track new-project` and completes successfully
- **THEN** the grspec workspace SHALL include template-based `constitution.md` and `domain-model.md`
- **AND** the grspec workspace SHALL include `grspec.yaml` containing a bootstrap section as defined by the init templates

### Requirement: Existing project initialization track

When `--track existing-project` is specified, `grspec init` SHALL generate `constitution.md` and `domain-model.md` as skeletons that include reverse-engineering guidance for documenting an established codebase.

#### Scenario: Existing project track output

- **WHEN** `grspec init` runs with `--track existing-project` and completes successfully
- **THEN** the grspec workspace SHALL include skeleton `constitution.md` and `domain-model.md`
- **AND** those files SHALL include guidance oriented toward reverse-engineering and capturing the current system
