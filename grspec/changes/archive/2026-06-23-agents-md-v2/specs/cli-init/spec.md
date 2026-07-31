---
type: spec
change: agents-md-v2
created: 2026-06-15
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Success Output

The command SHALL provide clear, actionable next steps upon successful initialization.

#### Scenario: Displaying success message

- **WHEN** initialization completes successfully
- **THEN** display categorized summary:
  - "Created: <tools>" for newly configured tools
  - "Refreshed: <tools>" for already-configured tools that were updated
  - Count of skills and commands generated
- **AND** display AGENTS.md generation status (created, exists, or skipped)
- **AND** display pointer file status for each generated tool-specific file (CLAUDE.md, GEMINI.md)
- **AND** display getting started section with:
  - `/grsx:new` - Start a new change
  - `/grsx:continue` - Create the next artifact
  - `/grsx:apply` - Implement tasks
- **AND** display links to documentation and feedback

#### Scenario: Displaying restart instruction

- **WHEN** initialization completes successfully and tools were created or refreshed
- **THEN** display instruction to restart IDE for slash commands to take effect

## ADDED Requirements

### Requirement: Pointer file generation in init

`grspec init` SHALL generate tool-specific pointer files alongside AGENTS.md based on the selected tools.

#### Scenario: Generating CLAUDE.md for claude tool

- **WHEN** `grspec init` runs with `--tools claude` or `--tools all`
- **THEN** the system SHALL generate CLAUDE.md at the project root
- **AND** the file SHALL reference AGENTS.md for shared context
- **AND** the success output SHALL include CLAUDE.md status

#### Scenario: Generating GEMINI.md for gemini tool

- **WHEN** `grspec init` runs with `--tools gemini` or `--tools all`
- **THEN** the system SHALL generate GEMINI.md at the project root
- **AND** the success output SHALL include GEMINI.md status

#### Scenario: Pointer file exists without force

- **WHEN** a pointer file already exists and `--force` is not specified
- **THEN** the system SHALL skip that pointer file
- **AND** SHALL log that it was skipped

#### Scenario: Force regeneration of pointer files

- **WHEN** `grspec init --force` runs and pointer files exist
- **THEN** the system SHALL regenerate all applicable pointer files
