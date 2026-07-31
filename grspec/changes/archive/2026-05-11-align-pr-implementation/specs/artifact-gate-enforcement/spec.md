# artifact-gate-enforcement Specification

## Purpose
Define CLI gate enforcement behavior that blocks artifact creation when upstream dependencies are incomplete and blocks archive when plan checkboxes are incomplete.

## Requirements

### Requirement: Artifact dependency hard block on instructions

`grspec instructions <artifact-id>` SHALL refuse to output instructions when the artifact's upstream dependencies (as defined by the schema's `requires` array) are not satisfied, and SHALL display which dependencies are missing.

#### Scenario: Instructions blocked when dependency incomplete

- **WHEN** the user runs `grspec instructions design --change <name>`
- **AND** the `design` artifact requires `proposal` per the schema
- **AND** `proposal.md` does not exist or is empty
- **THEN** the command SHALL exit with a non-zero exit code
- **AND** SHALL display an error naming the missing dependency (e.g., "proposal is required before design")

#### Scenario: Instructions succeed when dependencies satisfied

- **WHEN** the user runs `grspec instructions design --change <name>`
- **AND** all dependencies listed in the schema's `requires` for `design` are satisfied
- **THEN** the command SHALL output the instructions as normal

#### Scenario: Force flag bypasses dependency check

- **WHEN** the user runs `grspec instructions design --change <name> --force`
- **AND** upstream dependencies are not satisfied
- **THEN** the command SHALL output a warning about missing dependencies
- **AND** SHALL proceed to output the instructions

### Requirement: Plan checkbox completion gate on archive

`grspec archive` SHALL verify that all checkbox items in `plan.md` are marked complete before proceeding with the archive operation, and SHALL block archiving when incomplete items remain.

#### Scenario: Archive blocked with incomplete plan items

- **WHEN** the user runs `grspec archive <change>`
- **AND** `plan.md` exists and contains unchecked items (`- [ ]`)
- **THEN** the command SHALL display the list of incomplete items
- **AND** SHALL NOT proceed with archiving
- **AND** SHALL suggest using `--force` to override

#### Scenario: Archive proceeds with complete plan

- **WHEN** the user runs `grspec archive <change>`
- **AND** `plan.md` exists and every checkbox item is checked (`- [x]`)
- **THEN** the command SHALL proceed with the archive flow

#### Scenario: Archive with force bypasses plan check

- **WHEN** the user runs `grspec archive <change> --force`
- **AND** `plan.md` contains incomplete items
- **THEN** the command SHALL display a warning listing incomplete items
- **AND** SHALL proceed with the archive flow

#### Scenario: Archive without plan.md

- **WHEN** the user runs `grspec archive <change>`
- **AND** no `plan.md` exists in the change directory
- **THEN** the command SHALL proceed with the archive flow without blocking

### Requirement: Workflow gate config consumption

When `grspec.yaml` contains `workflow.gates` configuration, the CLI SHALL read and apply these settings to control gate strictness.

#### Scenario: Gate config enables hard block

- **WHEN** `grspec.yaml` sets `workflow.gates.proposal-review: true`
- **AND** the user runs `grspec instructions design --change <name>`
- **AND** `proposal.md` is missing
- **THEN** the command SHALL hard-block (non-zero exit, no output)

#### Scenario: Gate config absent uses default behavior

- **WHEN** `grspec.yaml` does not contain a `workflow.gates` section
- **THEN** artifact dependency gates SHALL still apply as hard blocks (default behavior)
- **AND** the behavior SHALL be identical to when gates are explicitly enabled

#### Scenario: Cross-platform path handling in gate checks

- **WHEN** the gate logic checks for artifact file existence
- **THEN** it SHALL use `path.join()` for all file path construction
- **AND** SHALL handle both forward-slash and backslash path separators on Windows
