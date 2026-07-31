---
type: spec
change: workflow-ux-optimization
created: 2026-06-15
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Four-tier profile system

The profile system SHALL support four named profiles: `minimal`, `standard`, `full`, and `custom`, each defining which workflows are **recommended by default** in documentation and onboarding prompts. All workflows SHALL remain accessible regardless of active profile.

#### Scenario: Minimal profile installs core workflows only

- **WHEN** the user's global config specifies `profile: minimal`
- **THEN** grspec SHALL install only the base workflows: `propose`, `explore`, `apply`, `sync`, `archive`

#### Scenario: Standard profile includes execution discipline

- **WHEN** the user's global config specifies `profile: standard`
- **THEN** grspec SHALL install the minimal workflows plus execution discipline workflows: `tdd`, `verify-gate`, `debug`, `review`

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

### Requirement: Backward compatibility with core profile

To avoid breaking existing users, the profile system SHALL treat the legacy `core` value as an alias for `standard` during a transition period.

#### Scenario: Core alias resolves to standard

- **WHEN** the user's global config contains `profile: core`
- **THEN** grspec SHALL treat it as `profile: standard`
- **AND** SHALL display a deprecation warning suggesting migration to `standard`

#### Scenario: Invalid profile value rejected

- **WHEN** the user's global config contains a profile value that is not one of `minimal`, `standard`, `full`, `custom`, or `core`
- **THEN** grspec SHALL display an error listing valid profile values
- **AND** SHALL fall back to the `standard` profile

### Requirement: Profile workflow constants

Each named profile SHALL have its workflow set defined as a constant, ensuring deterministic and testable behavior.

#### Scenario: Workflow lists are exhaustive

- **WHEN** the profile system resolves workflows for any named profile
- **THEN** the returned list SHALL contain exactly the workflows assigned to that tier
- **AND** SHALL not include workflows from higher tiers unless explicitly configured
