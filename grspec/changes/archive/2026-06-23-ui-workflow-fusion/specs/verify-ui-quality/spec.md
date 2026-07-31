---
type: spec
change: ui-workflow-fusion
created: 2026-06-23
schema: spec-driven
---
# verify-ui-quality Delta Specification

## Purpose
Add a UI Quality sub-check to the verify content template, using static analysis from `grspec ui review`.

## MODIFIED Requirements

### Requirement: Verify content template includes UI Quality dimension
The verify content template (`content/verify-change.md`) SHALL include a conditional UI Quality check after the Coherence dimension (Step 7).

#### Scenario: UI Quality check activates for UI changes
- **WHEN** the verify workflow runs on a change with `ui-detected: true` in `.grspec.yaml`
- **OR** the change's `touches` include files with UI extensions (`.tsx`, `.jsx`, `.css`, `.scss`, `.vue`, `.svelte`)
- **THEN** the verification report SHALL include a "UI Quality" sub-section

#### Scenario: UI Quality check skipped for non-UI changes
- **WHEN** the verify workflow runs on a change without `ui-detected` set
- **AND** no UI file extensions appear in `touches`
- **THEN** the verification report SHALL NOT include a UI Quality sub-section
- **AND** SHALL note "UI Quality: skipped (no UI content detected)"

### Requirement: Static analysis severity mapping
The UI Quality check SHALL run `grspec ui review <changed-file-paths> --json` and map review findings to verification severity levels.

#### Scenario: Findings mapped to verification severities
- **GIVEN** `grspec ui review` returns findings with severity CRITICAL, HIGH, MEDIUM
- **THEN** CRITICAL review findings SHALL appear as CRITICAL verification issues
- **AND** HIGH review findings SHALL appear as WARNING verification issues
- **AND** MEDIUM review findings SHALL appear as SUGGESTION verification issues

#### Scenario: No findings
- **WHEN** `grspec ui review` returns zero findings for a UI change
- **THEN** the UI Quality sub-section SHALL note "UI Quality: No issues found"

### Requirement: Summary scorecard includes UI Quality
When UI Quality is checked, the verification summary scorecard SHALL include a fourth row.

#### Scenario: Four-dimension scorecard
- **WHEN** UI Quality check runs
- **THEN** the summary table SHALL include:
  ```
  | Dimension      | Status           |
  |----------------|------------------|
  | Completeness   | X/Y tasks, N reqs|
  | Correctness    | M/N reqs covered |
  | Coherence      | Followed/Issues  |
  | UI Quality     | N findings / Pass|
  ```
