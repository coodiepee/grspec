---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Multi-platform skill export
The system SHALL export UI sub-skills (not a monolithic `grspec-ui` hub) when the user runs `grspec ui install --platform <name>`.

By default, the installer SHALL export a bundle of three skills:

- `grspec-ui-init`
- `grspec-ui-design-system`
- `grspec-ui-review`

With `--all`, the installer SHALL export all ten `grspec-ui-*` sub-skills.

Platform template JSON files SHALL include a `skills: string[]` array listing skill directory names to export.

#### Scenario: Default bundle export
- **WHEN** user runs `grspec ui install --platform cursor`
- **THEN** the system SHALL generate skill files for init, design-system, and review sub-skills
- **AND** SHALL NOT generate a monolithic `grspec-ui` hub skill

#### Scenario: Full export with --all
- **WHEN** user runs `grspec ui install --platform cursor --all`
- **THEN** the system SHALL export all ten UI sub-skills

#### Scenario: Custom output directory
- **WHEN** user runs `grspec ui install --platform windsurf --output ./my-project/`
- **THEN** generated files SHALL be written relative to `./my-project/`

### Requirement: List supported platforms
The system SHALL display all supported platforms when `--list` is passed.

#### Scenario: List platforms
- **WHEN** user runs `grspec ui install --list`
- **THEN** the system displays supported platform names
