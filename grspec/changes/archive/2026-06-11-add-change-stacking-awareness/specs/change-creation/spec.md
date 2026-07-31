## ADDED Requirements

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

