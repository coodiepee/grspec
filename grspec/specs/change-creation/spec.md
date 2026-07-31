# change-creation Specification

## Purpose
Provide programmatic utilities for creating and validating grspec change directories.
## Requirements
### Requirement: Change Creation
The system SHALL provide a function to create new change directories programmatically.

#### Scenario: Create change
- **WHEN** `createChange(projectRoot, 'add-auth')` is called
- **THEN** the system creates `grspec/changes/add-auth/` directory

#### Scenario: Duplicate change rejected
- **WHEN** `createChange(projectRoot, 'add-auth')` is called and `grspec/changes/add-auth/` already exists
- **THEN** the system throws an error indicating the change already exists

#### Scenario: Creates parent directories if needed
- **WHEN** `createChange(projectRoot, 'add-auth')` is called and `grspec/changes/` does not exist
- **THEN** the system creates the full path including parent directories

#### Scenario: Invalid change name rejected
- **WHEN** `createChange(projectRoot, 'Add Auth')` is called with an invalid name
- **THEN** the system throws a validation error

### Requirement: Change Name Validation
The system SHALL validate change names follow kebab-case conventions.

#### Scenario: Valid kebab-case name accepted
- **WHEN** a change name like `add-user-auth` is validated
- **THEN** validation returns `{ valid: true }`

#### Scenario: Numeric suffixes accepted
- **WHEN** a change name like `add-feature-2` is validated
- **THEN** validation returns `{ valid: true }`

#### Scenario: Single word accepted
- **WHEN** a change name like `refactor` is validated
- **THEN** validation returns `{ valid: true }`

#### Scenario: Uppercase characters rejected
- **WHEN** a change name like `Add-Auth` is validated
- **THEN** validation returns `{ valid: false, error: "..." }`

#### Scenario: Spaces rejected
- **WHEN** a change name like `add auth` is validated
- **THEN** validation returns `{ valid: false, error: "..." }`

#### Scenario: Underscores rejected
- **WHEN** a change name like `add_auth` is validated
- **THEN** validation returns `{ valid: false, error: "..." }`

#### Scenario: Special characters rejected
- **WHEN** a change name like `add-auth!` is validated
- **THEN** validation returns `{ valid: false, error: "..." }`

#### Scenario: Leading hyphen rejected
- **WHEN** a change name like `-add-auth` is validated
- **THEN** validation returns `{ valid: false, error: "..." }`

#### Scenario: Trailing hyphen rejected
- **WHEN** a change name like `add-auth-` is validated
- **THEN** validation returns `{ valid: false, error: "..." }`

#### Scenario: Consecutive hyphens rejected
- **WHEN** a change name like `add--auth` is validated
- **THEN** validation returns `{ valid: false, error: "..." }`

### Requirement: Stack Metadata Scaffolding
Change creation workflows SHALL support optional dependency metadata for new or split changes.

#### Scenario: Create change with stack metadata
- **WHEN** a change is created with stack metadata inputs
- **THEN** creation SHALL persist metadata fields in change configuration
- **AND** persisted metadata SHALL be validated against change metadata schema rules

#### Scenario: Split-generated child metadata
- **WHEN** child changes are generated from a split workflow
- **THEN** each child SHALL include a `parent` link to the source change
- **AND** SHALL include dependency metadata needed for deterministic sequencing

### Requirement: AI-Inferred Touches at Propose Time
The propose workflow SHALL automatically infer file-level `touches` by analyzing the change intent against the codebase.

#### Scenario: Two-phase inference from intent to files
- **WHEN** a proposal is being generated
- **THEN** the system SHALL first map the intent to domain keywords and candidate directories
- **AND** SHALL then read entry/key files to trace specific file paths that would be impacted
- **AND** SHALL output touches with `path`, `intent`, and `mode` for each inferred file

#### Scenario: Precision over recall in inference
- **WHEN** the AI is uncertain whether a file will be affected
- **THEN** it SHALL omit the file from touches rather than include a low-confidence entry
- **AND** SHALL limit touches to a maximum of 8 files per change

#### Scenario: Git history informs inference accuracy
- **WHEN** git reconnaissance data is available (recent commits, active branches)
- **THEN** the inference SHALL incorporate recent file activity and authorship patterns to improve accuracy
- **AND** SHALL prefer git-evidenced file impact over pure directory-structure speculation

#### Scenario: Overlap detection during propose
- **WHEN** inferred touches overlap with another active change's touches (same file path)
- **THEN** the propose workflow SHALL surface a coordination warning in the generated proposal
- **AND** the warning SHALL include the overlapping change name, author, and their declared intent

### Requirement: Anchors for Large Codebases
The system SHALL support an optional `grspec/anchors.yaml` file mapping domains to entry files for inference assistance.

#### Scenario: Anchors present and relevant
- **WHEN** `grspec/anchors.yaml` exists and contains a domain matching the intent keywords
- **THEN** the inference SHALL use the declared entry files as starting points for file tracing
- **AND** SHALL still validate traced files against actual codebase structure

#### Scenario: Anchors absent or stale
- **WHEN** `grspec/anchors.yaml` does not exist or contains no matching domain
- **THEN** the inference SHALL fall back to directory structure and git history analysis
- **AND** SHALL NOT fail or degrade the proposal generation workflow

