---
type: spec
change: template-single-source
created: 2026-07-28
schema: spec-driven
---
## Purpose
Align standard-profile execution-discipline workflows with the CLI: structural `validate` and artifact `verify` (no redundant `verify-gate`).

## MODIFIED Requirements

### Requirement: Four-tier profile system
The profile system SHALL support four named profiles: `minimal`, `standard`, `full`, and `custom`, each defining which workflows are **recommended by default** in documentation and onboarding prompts. All workflows SHALL remain accessible regardless of active profile. The `standard` profile SHALL include execution-discipline workflows `tdd`, `validate`, `verify`, `debug`, and `review` (not `verify-gate`).

#### Scenario: Standard profile includes execution discipline
- **WHEN** the user's global config specifies `profile: standard`
- **THEN** grspec SHALL install the minimal workflows plus execution discipline workflows: `tdd`, `validate`, `verify`, `debug`, `review`

## ADDED Requirements

### Requirement: Validate and verify are distinct workflows
`ALL_WORKFLOWS` SHALL include both `validate` and `verify`. It SHALL NOT include `verify-gate`. `validate` packages the structural CLI/skill/slash surface; `verify` packages artifact verification with evidence gate (skill `grspec-verify`, slash `/grsx:verify`).

#### Scenario: Profile constants exclude verify-gate
- **WHEN** a consumer reads `ALL_WORKFLOWS` / `STANDARD_WORKFLOWS`
- **THEN** the list SHALL contain `validate` and `verify`
- **AND** SHALL NOT contain `verify-gate`
