# error-handling-layer Specification

## Purpose
Provide a unified error handler for CLI commands that classifies errors, formats output consistently, and prevents unhandled exceptions from producing raw stack traces.
## Requirements
### Requirement: Unified error handler for CLI commands
The CLI SHALL provide a single error-handling function that all command action handlers use for catching and reporting errors. The handler SHALL classify errors and format output consistently (spinner failure via `ora().fail()` for user-facing commands, `console.error` for programmatic/JSON outputs).

#### Scenario: Command throws a known operational error
- **WHEN** a CLI command action throws an Error with a `.message` property
- **THEN** the error handler displays the message using `ora().fail()` and sets `process.exitCode = 1`

#### Scenario: Command throws an unknown error type
- **WHEN** a CLI command action throws a non-Error value (string, number, or object)
- **THEN** the error handler converts it to a string and displays it, and sets `process.exitCode = 1`

#### Scenario: JSON-mode command encounters an error
- **WHEN** a command running with `--json` flag encounters an error
- **THEN** the error handler outputs a JSON object `{ "error": "<message>" }` to stderr and sets `process.exitCode = 1` without spinner decoration

### Requirement: Consistent exit-code strategy
The CLI SHALL use `process.exitCode` assignment (not `process.exit()`) as the default exit mechanism, allowing graceful cleanup. Direct `process.exit(1)` SHALL only be used when immediate termination is required (e.g., fatal init errors where continuing would corrupt state).

#### Scenario: Normal command failure
- **WHEN** a command fails during regular operation (validation error, missing file, invalid input)
- **THEN** the CLI sets `process.exitCode = 1` and allows the process to exit naturally

#### Scenario: Fatal initialization error
- **WHEN** the CLI encounters a fatal error during startup that prevents any command from functioning
- **THEN** the CLI calls `process.exit(1)` immediately after displaying the error

### Requirement: Error context enrichment
The error handler SHALL accept optional context (command name, change name) and include it in error output to help users identify which operation failed, especially in batch or scripted usage.

#### Scenario: Error includes command context
- **WHEN** the `archive` command fails while archiving change `add-dark-mode`
- **THEN** the error output includes both the command name and change name for debugging context

#### Scenario: Error in non-interactive mode
- **WHEN** a command running with `--no-interactive` flag encounters an error
- **THEN** the error output is machine-parseable (no spinner frames, no ANSI in `--no-color` mode)

