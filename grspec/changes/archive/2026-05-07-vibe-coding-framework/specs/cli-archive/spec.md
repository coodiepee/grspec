# cli-archive (delta)

## ADDED Requirements

### Requirement: Archive verification gate

Before archiving a change, `grspec archive` SHALL run a full verification check that includes build, test, and lint, and SHALL display the verification results to the user. The archive operation SHALL proceed only if verification succeeds or the user passes `--force` to explicitly continue after failure.

#### Scenario: Verification passes

- **WHEN** the user runs `grspec archive` for a valid change and build, test, and lint all succeed
- **THEN** the command SHALL display verification results showing success
- **AND** the command SHALL proceed with the archive flow

#### Scenario: Verification fails without force

- **WHEN** any of build, test, or lint fails during the verification gate
- **AND** the user does not pass `--force`
- **THEN** the command SHALL display verification results including the failure
- **AND** the command SHALL NOT proceed with archiving

#### Scenario: Verification fails with force

- **WHEN** any of build, test, or lint fails during the verification gate
- **AND** the user runs `grspec archive` with `--force`
- **THEN** the command SHALL display verification results including the failure
- **AND** the command SHALL proceed with the archive flow
