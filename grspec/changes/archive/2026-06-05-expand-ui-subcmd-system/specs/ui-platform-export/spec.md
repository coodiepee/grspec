---
type: spec
change: expand-ui-subcmd-system
created: 2026-06-05
schema: spec-driven
---
## ADDED Requirements

### Requirement: Multi-platform skill export
The system SHALL generate a platform-specific UI/UX skill file when the user runs `grspec ui install --platform <name>`. The generated file contains the grspec-ui instructions adapted to the target platform's conventions.

#### Scenario: Export to Windsurf
- **WHEN** user runs `grspec ui install --platform windsurf`
- **THEN** the system generates a file at `.windsurf/rules/grspec-ui.md` (or the platform's convention path) with content adapted to Windsurf's rule format

#### Scenario: Export to Copilot
- **WHEN** user runs `grspec ui install --platform copilot`
- **THEN** the system generates or appends to `.github/copilot-instructions.md` with grspec-ui content

#### Scenario: Custom output directory
- **WHEN** user runs `grspec ui install --platform windsurf --output ./my-project/`
- **THEN** the generated file is written relative to `./my-project/` instead of cwd

### Requirement: List supported platforms
The system SHALL display all supported platforms when `--list` is passed.

#### Scenario: List platforms
- **WHEN** user runs `grspec ui install --list`
- **THEN** the system displays all supported platform names with their output path convention

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
