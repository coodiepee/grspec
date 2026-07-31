# schema-resolution (delta)

## ADDED Requirements

### Requirement: Plan artifact ID support

The schema resolution system SHALL recognize `plan` as a valid artifact identifier in schema definitions and related workflows.

#### Scenario: Plan referenced in schema

- **WHEN** a workflow schema declares an artifact with id `plan`
- **THEN** the system SHALL accept `plan` as a valid artifact ID
- **AND** the system SHALL include `plan` in schema validation and resolution the same as other defined artifact IDs

### Requirement: Plan dependency chain for spec-driven schema

When resolving the spec-driven schema, the system SHALL enforce `plan.requires = [design, specs]` so that `plan` cannot complete until both `design` and `specs` artifacts are complete.

#### Scenario: Plan requires design and specs

- **WHEN** the active schema is spec-driven and includes artifacts `design`, `specs`, and `plan`
- **THEN** the resolved dependency graph SHALL set `plan.requires` to `[design, specs]`
- **AND** `plan` SHALL remain blocked until `design` and `specs` are done

### Requirement: Apply phase requires plan completion

The apply phase SHALL require completion of the `plan` artifact before apply work is considered unblocked, replacing a previous requirement that apply readiness depend on `tasks` artifact completion where those semantics conflict.

#### Scenario: Apply waits for plan

- **WHEN** the user or tooling advances to the apply phase
- **AND** the `plan` artifact is not complete
- **THEN** the system SHALL treat apply as blocked pending `plan` completion

#### Scenario: Apply proceeds after plan completes

- **WHEN** the `plan` artifact is complete and other schema prerequisites for apply are satisfied
- **THEN** the system SHALL treat the apply phase as eligible to proceed
