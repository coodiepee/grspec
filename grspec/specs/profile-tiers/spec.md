# profile-tiers Specification

## Purpose
Define a four-tier profile system (minimal, standard, full, custom) that replaces the binary core/custom system, making execution discipline workflows part of the default install.
## Requirements

### Requirement: Four-tier profile system
The profile system SHALL support four named profiles: `minimal`, `standard`, `full`, and `custom`, each defining which workflows are **recommended by default** in documentation and onboarding prompts. All workflows SHALL remain accessible regardless of active profile. The `standard` profile SHALL include execution-discipline workflows `tdd`, `validate`, `verify`, `debug`, and `review` (not `verify-gate`).

#### Scenario: Minimal profile installs core workflows only

- **WHEN** the user's global config specifies `profile: minimal`
- **THEN** grspec SHALL install only the base workflows: `propose`, `explore`, `apply`, `sync`, `archive`

#### Scenario: Standard profile includes execution discipline
- **WHEN** the user's global config specifies `profile: standard`
- **THEN** grspec SHALL install the minimal workflows plus execution discipline workflows: `tdd`, `validate`, `verify`, `debug`, `review`

#### Scenario: Full profile includes collaboration workflows

- **WHEN** the user's global config specifies `profile: full`
- **THEN** grspec SHALL install the standard workflows plus collaboration workflows: `parallel`, `subagent`

#### Scenario: Custom profile uses explicit workflow list

- **WHEN** the user's global config specifies `profile: custom` with a `workflows` array
- **THEN** grspec SHALL install exactly the workflows listed in the array

#### Scenario: Non-installed workflows remain accessible via CLI

- **WHEN** a user invokes a grspec CLI command that corresponds to a workflow not installed in their profile
- **THEN** the command SHALL execute normally
- **AND** the CLI SHALL display a one-time hint suggesting the user add the workflow to their profile for skill-file generation

#### Scenario: Non-installed workflows accessible via slash commands

- **WHEN** a user invokes a slash command (e.g., `/grsx:verify`) whose skill file is not installed
- **THEN** the AI agent MAY not recognize the command due to missing skill file
- **AND** the documentation SHALL note that adding the workflow to the profile enables AI-assisted invocation

### Requirement: Standard profile as default

When no profile is explicitly configured, grspec SHALL default to the `standard` profile so that execution discipline workflows are available out of the box.

#### Scenario: No profile configured uses standard

- **WHEN** the user has not set a profile in global config
- **THEN** grspec SHALL behave as if `profile: standard` were configured
- **AND** SHALL install the standard set of workflows

#### Scenario: Explicit minimal overrides default

- **WHEN** the user explicitly sets `profile: minimal`
- **THEN** grspec SHALL respect the explicit choice and install only minimal workflows

### Requirement: Profile workflow constants

Each named profile SHALL have its workflow set defined as a constant, ensuring deterministic and testable behavior.

#### Scenario: Workflow lists are exhaustive

- **WHEN** the profile system resolves workflows for any named profile
- **THEN** the returned list SHALL contain exactly the workflows assigned to that tier
- **AND** SHALL not include workflows from higher tiers unless explicitly configured

### Requirement: Validate and verify are distinct workflows
`ALL_WORKFLOWS` SHALL include both `validate` and `verify`. It SHALL NOT include `verify-gate`. `validate` packages the structural CLI/skill/slash surface; `verify` packages artifact verification with evidence gate (skill `grspec-verify`, slash `/grsx:verify`).

#### Scenario: Profile constants exclude verify-gate
- **WHEN** a consumer reads `ALL_WORKFLOWS` / `STANDARD_WORKFLOWS`
- **THEN** the list SHALL contain `validate` and `verify`
- **AND** SHALL NOT contain `verify-gate`

### Requirement: Invalid profile rejected without core alias

Profile resolution SHALL accept only `minimal`, `standard`, `full`, and `custom`. The value `core` SHALL be treated as invalid.

#### Scenario: Unknown profile value rejected
- **WHEN** the user's global config contains a profile value that is not one of `minimal`, `standard`, `full`, or `custom`
- **THEN** grspec SHALL display an error listing valid profile values
- **AND** SHALL fall back to the `standard` profile

#### Scenario: core is not a valid profile
- **WHEN** the user's global config contains `profile: core`
- **THEN** grspec SHALL treat `core` as an invalid profile value
- **AND** SHALL follow the same error and fallback behavior as other unknown values
