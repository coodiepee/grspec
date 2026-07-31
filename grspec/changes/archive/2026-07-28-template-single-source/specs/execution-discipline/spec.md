---
type: spec
change: template-single-source
created: 2026-07-28
schema: spec-driven
---
## Purpose
Collapse redundant verify packaging: one `grspec-verify` skill + `/grsx:verify` for artifact+evidence verification; add `grspec-validate` + `/grsx:validate` aligned with `grspec validate` CLI.

## MODIFIED Requirements

### Requirement: Verification skill template (grspec-verify)
Grspec SHALL provide a `grspec-verify` skill template (paired with `/grsx:verify`) that verifies implementation against change artifacts and requires running project verification commands (build, tests, linters) with captured evidence before claiming ready for archive or completion.

#### Scenario: Verify skill mandates commands before completion claims
- **WHEN** a user or agent follows the `grspec-verify` skill to complete work
- **THEN** the skill SHALL instruct that verification commands MUST run with evidence of results
- **AND** SHALL forbid marking tasks or archive completion without successful verification per project conventions
- **AND** the skill directory name SHALL be `grspec-verify` (not a separate `grspec-verify-change` or `verify-gate` skill)

## ADDED Requirements

### Requirement: Validate skill and slash align with CLI
Grspec SHALL ship skill `grspec-validate` and slash `/grsx:validate` whose body instructs agents to run `grspec validate` for structural change/spec checks. That surface SHALL NOT claim to assess implementation completeness (that is `grspec-verify`).

#### Scenario: Validate skill points at CLI validate
- **WHEN** an agent follows `grspec-validate` or `/grsx:validate`
- **THEN** the instructions SHALL direct use of `grspec validate` (with documented flags)
- **AND** SHALL NOT invent a `grspec verify` CLI command
- **AND** SHALL distinguish structural validate from `/grsx:verify` artifact verification

### Requirement: Legacy verify-change skill dir removal
`grspec update` and `grspec init` SHALL remove the legacy skill directory `grspec-verify-change` when regenerating skills for a tool.

#### Scenario: Update removes grspec-verify-change
- **WHEN** the user runs `grspec update` for a tool that still has `grspec-verify-change/`
- **THEN** that directory SHALL be removed
- **AND** `grspec-verify/` SHALL be present when the verify workflow is in the active profile
