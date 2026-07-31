# ui-platform-export Specification

## Purpose
Export the grspec-ui skill to other AI coding assistant platforms (Windsurf, Copilot, Claude, etc.) by generating platform-specific instruction files from shared templates.
## Requirements
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

### Requirement: Include full rules option
The system SHALL support `--with-rules` to include the complete Quick Reference rules in the exported skill.

#### Scenario: Export with rules
- **WHEN** user runs `grspec ui install --platform cursor --with-rules`
- **THEN** the generated SKILL.md includes the full Quick Reference section (100+ rules)

#### Scenario: Export without rules (default)
- **WHEN** user runs `grspec ui install --platform cursor` without `--with-rules`
- **THEN** the generated SKILL.md includes the compact priority table (current default)

### Requirement: Platform template validation
The system SHALL validate that a template exists for the requested platform and report an error with available options if not found.

#### Scenario: Invalid platform
- **WHEN** user runs `grspec ui install --platform unknown-platform`
- **THEN** the system displays an error listing all valid platform names

### Requirement: Overwrite protection
The system SHALL warn before overwriting an existing file at the target path.

#### Scenario: File already exists
- **WHEN** the target output path already contains a file
- **THEN** the system displays a warning with the existing file path and asks for confirmation (in interactive mode) or requires `--force` (in non-interactive mode)

