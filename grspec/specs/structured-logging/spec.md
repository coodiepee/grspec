# structured-logging Specification

## Purpose
Provide a logger abstraction with leveled output (debug/info/warn/error), routing to appropriate streams and supporting verbose mode for debugging.
## Requirements
### Requirement: Logger abstraction with log levels
The project SHALL provide a logger module that supports at minimum four log levels: `debug`, `info`, `warn`, `error`. Each log call SHALL route to the appropriate output stream (`stdout` for info/debug, `stderr` for warn/error).

#### Scenario: Default log level filters debug messages
- **WHEN** the logger is created with default settings
- **THEN** `debug()` calls produce no output, while `info()`, `warn()`, and `error()` calls produce output

#### Scenario: Verbose mode enables debug output
- **WHEN** the environment variable `GRSPEC_VERBOSE=1` is set or the CLI `--verbose` flag is passed
- **THEN** `debug()` calls produce output to stdout

### Requirement: Color-aware output
The logger SHALL respect the `--no-color` flag and the `NO_COLOR` environment variable. When color is disabled, the logger SHALL strip ANSI codes from all output.

#### Scenario: No-color flag suppresses ANSI codes
- **WHEN** the user passes `--no-color` or sets `NO_COLOR=1`
- **THEN** all logger output is plain text without ANSI escape sequences

#### Scenario: Color enabled by default in TTY
- **WHEN** stdout is a TTY and no color-suppression flag is set
- **THEN** logger output uses chalk-formatted colors

### Requirement: Test-friendly silent mode
The logger SHALL support a `silent` mode where all output is suppressed. This mode SHALL be activatable programmatically for test environments.

#### Scenario: Tests suppress logger output
- **WHEN** a test sets the logger to silent mode
- **THEN** no output is written to stdout or stderr during the test

#### Scenario: Tests can capture log output
- **WHEN** a test registers a log capture handler
- **THEN** all log calls are collected in an array accessible to the test assertions

### Requirement: Gradual migration path
The logger SHALL be adopted incrementally. Existing `console.log/error/warn` calls SHALL continue to function during the migration period. The logger module SHALL export a default instance that can be imported as a drop-in replacement.

#### Scenario: Drop-in replacement for console.log
- **WHEN** a module replaces `console.log(msg)` with `logger.info(msg)`
- **THEN** the visible output to the user is identical in content (formatting may differ by log-level prefix)

