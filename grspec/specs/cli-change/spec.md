# cli-change Specification

## Purpose
Define `grspec change` command behavior for showing, listing, and validating change proposals and deltas.
## Requirements

### Requirement: Stack Planning Commands
The change CLI SHALL provide commands for dependency-aware sequencing of active changes.

#### Scenario: Show dependency graph
- **WHEN** a user runs `grspec change graph`
- **THEN** the CLI SHALL display dependency relationships for active changes
- **AND** SHALL include a deterministic recommended order for execution

#### Scenario: Show next unblocked changes
- **WHEN** a user runs `grspec change next`
- **THEN** the CLI SHALL list changes that are not blocked by unresolved dependencies
- **AND** SHALL use deterministic tie-breaking when multiple options are available

### Requirement: Split Large Change Scaffolding
The change CLI SHALL support scaffolding child slices from an existing large change.

#### Scenario: Split command scaffolds child changes
- **WHEN** a user runs `grspec change split <change-id>`
- **THEN** the CLI SHALL create child change directories with proposal/tasks stubs
- **AND** generated metadata SHALL include `parent` and dependency links back to the source change

#### Scenario: Re-running split on an already-split change
- **WHEN** a user runs `grspec change split <change-id>` for a parent whose generated child directories already exist
- **THEN** the CLI SHALL fail with a deterministic, actionable error
- **AND** SHALL NOT mutate existing child change content unless an explicit overwrite mode is requested

### Requirement: Activity Query Commands
The change CLI SHALL provide commands for querying structured git activity data.

#### Scenario: Query recent activity
- **WHEN** a user runs `grspec activity --since=<duration> --json`
- **THEN** the CLI SHALL return aggregated change activity from structured commits within the time window
- **AND** output SHALL include change names, authors, module classifications, intents, and hot files

#### Scenario: Query file-specific activity
- **WHEN** a user runs `grspec activity --file <path>`
- **THEN** the CLI SHALL return all changes that have touched the specified file with their intents
- **AND** SHALL include both active (grspec-managed) and branch-only (git-detected) activity

#### Scenario: Query hot files
- **WHEN** a user runs `grspec activity --hot`
- **THEN** the CLI SHALL return contested files ranked by change frequency and author count
- **AND** output SHALL indicate which active changes currently declare touches on each file

#### Scenario: Query change-specific activity
- **WHEN** a user runs `grspec activity --change <name>`
- **THEN** the CLI SHALL return the module-level summary of that change's structured commits
- **AND** SHALL include task group breakdown and per-file intents

### Requirement: Overlap Visibility Commands
The change CLI SHALL provide commands for inspecting file-level overlaps across active changes.

#### Scenario: Show overlap matrix
- **WHEN** a user runs `grspec change overlap`
- **THEN** the CLI SHALL display all file-path overlaps across active changes
- **AND** SHALL include each change's declared intent for overlapping files

#### Scenario: Show overlap for specific file
- **WHEN** a user runs `grspec change overlap --file <path>`
- **THEN** the CLI SHALL list all active changes that declare touches on the specified file
- **AND** SHALL include their intents and current task completion status

