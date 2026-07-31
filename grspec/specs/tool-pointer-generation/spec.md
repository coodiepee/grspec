# tool-pointer-generation Specification

## Purpose

Generate tool-specific pointer files (CLAUDE.md, GEMINI.md) that reference the shared AGENTS.md and include tool-specific behavioral hints.

## Requirements

### Requirement: CLAUDE.md pointer file generation

The system SHALL generate a CLAUDE.md file that references AGENTS.md for shared project context and includes Claude Code-specific behavioral hints.

#### Scenario: CLAUDE.md content structure

- **WHEN** generating CLAUDE.md for a project
- **THEN** the file SHALL contain a project name heading
- **AND** SHALL include `Read @AGENTS.md for project context, commands, and conventions.` using Claude Code's `@` import syntax
- **AND** SHALL include a "Claude-specific" section with behavioral tips
- **AND** the total file SHALL be under 20 lines

#### Scenario: CLAUDE.md Claude-specific hints

- **WHEN** generating the Claude-specific section
- **THEN** it SHALL include guidance for context management (e.g., use `/compact` when context grows large)
- **AND** SHALL include guidance for task planning (e.g., use `TodoWrite` for multi-step tasks)
- **AND** SHALL include the read-before-edit rule

### Requirement: GEMINI.md pointer file generation

The system SHALL generate a GEMINI.md file that references AGENTS.md and includes Gemini-specific notes.

#### Scenario: GEMINI.md content structure

- **WHEN** generating GEMINI.md for a project
- **THEN** the file SHALL contain a project name heading
- **AND** SHALL include a reference to read AGENTS.md for shared context
- **AND** SHALL include a "Gemini-specific" section
- **AND** the total file SHALL be under 20 lines

### Requirement: Pointer file generation during init

The system SHALL generate tool-specific pointer files during `grspec init` based on the `--tools` selection.

#### Scenario: Claude tool selected

- **WHEN** `grspec init` runs with `--tools claude` or `--tools all`
- **THEN** the system SHALL generate CLAUDE.md at the project root
- **AND** SHALL follow the same exists/force/skip behavior as AGENTS.md

#### Scenario: Gemini tool selected

- **WHEN** `grspec init` runs with `--tools gemini` or `--tools all`
- **THEN** the system SHALL generate GEMINI.md at the project root

#### Scenario: Tool not selected

- **WHEN** `grspec init` runs with `--tools cursor` (no claude/gemini)
- **THEN** the system SHALL NOT generate CLAUDE.md or GEMINI.md

#### Scenario: Existing pointer file without force flag

- **WHEN** a pointer file (CLAUDE.md or GEMINI.md) already exists and `--force` is not specified
- **THEN** the system SHALL skip generation for that file
- **AND** SHALL log that the file was skipped

#### Scenario: Cross-platform path handling

- **WHEN** generating pointer file paths on any platform
- **THEN** the system SHALL use `path.join()` for all file path construction
