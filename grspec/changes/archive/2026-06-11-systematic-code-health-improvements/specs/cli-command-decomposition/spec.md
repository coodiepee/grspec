---
type: spec
change: systematic-code-health-improvements
created: 2026-06-11
schema: spec-driven
---
## ADDED Requirements

### Requirement: Self-contained command modules
Each CLI command group SHALL be defined in its own module file that exports a registration function. The registration function SHALL accept a Commander `program` instance and attach its command(s) to it.

#### Scenario: Command module registers itself
- **WHEN** the CLI entry point imports a command module and calls its registration function
- **THEN** the command and all its subcommands, options, and action handlers are available on the program

#### Scenario: Adding a new command
- **WHEN** a developer creates a new command module following the registration pattern
- **THEN** they only need to add one import and one registration call to the entry file

### Requirement: CLI entry file under 150 lines
The main CLI entry file (`src/cli/index.ts`) SHALL contain only program-level setup (name, version, global options, telemetry hooks) and command registration calls. It SHALL NOT contain individual command action handlers or option definitions inline.

#### Scenario: Entry file delegates all command logic
- **WHEN** the CLI entry file is loaded
- **THEN** it imports command registration functions and calls them, with no inline `.action()` handlers exceeding 5 lines

### Requirement: Consistent command error boundary
Each command registration module SHALL use the unified error handler from the error-handling-layer capability. The error handler call SHALL be the only error-handling code in the action handler.

#### Scenario: Command module uses error handler
- **WHEN** an action handler wraps its logic in a try/catch
- **THEN** the catch block delegates to the unified error handler with the command name as context

### Requirement: File size guidelines for source modules
Source files in `src/` SHALL target a maximum of 500 lines. Files exceeding 500 lines SHALL be candidates for decomposition into focused sub-modules grouped in a directory. This guideline applies to new code; existing files are migrated incrementally.

#### Scenario: Large file decomposition
- **WHEN** a source file exceeds 500 lines during development
- **THEN** the file is split into a directory with an `index.ts` re-exporting public API, preserving import paths for consumers

#### Scenario: Cross-platform path handling in decomposed modules
- **WHEN** a module is split into sub-modules in a directory
- **THEN** all internal imports use `path.join()` patterns and work on Windows, macOS, and Linux
