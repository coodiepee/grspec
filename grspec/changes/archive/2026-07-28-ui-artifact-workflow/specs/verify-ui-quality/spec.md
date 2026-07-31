---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: UI quality check in verify workflow
When `effectiveUiActive` is true, or when the change's `touches` include UI file extensions (`.tsx`, `.jsx`, `.css`, `.scss`, `.vue`, `.svelte`), the verify workflow SHALL include a UI Quality check.

`effectiveUiActive` for v2 changes SHALL be derived from `parseUiArtifactStatus(ui.md) !== 'na'`. For v1 changes without `ui.md`, it SHALL fall back to `ui.detected` or `ui-detected` metadata.

The UI Quality check SHALL:
1. Run `grspec ui review` on touched UI files
2. Map findings to verification severity levels
3. Include foundation coherence checks using `uiArtifactStatus` and `uiFoundationReady`

#### Scenario: UI quality findings in verify report
- **WHEN** `/grsx:verify` runs on a change with `effectiveUiActive` true
- **AND** `grspec ui review` returns findings
- **THEN** the report SHALL include a UI Quality section with mapped severities

#### Scenario: Non-UI change skips UI quality
- **WHEN** v2 change has `ui.md` with `Status: na`
- **THEN** UI Quality check SHALL be skipped

#### Scenario: Foundation coherence CRITICAL
- **WHEN** `ui.md` has `Status: done`
- **AND** `grspec/ui/MASTER.md` does not exist
- **THEN** verify SHALL report a CRITICAL foundation coherence issue

#### Scenario: Blocked status with completed UI plan tasks
- **WHEN** `uiArtifactStatus` is `blocked` or `unknown`
- **AND** all tasks under plan `## UI` are marked `[x]`
- **THEN** verify SHALL report a CRITICAL inconsistency

#### Scenario: Provisional pages warning
- **WHEN** `ui.md` has `Status: done`
- **AND** a change page file has `provisional: true` in frontmatter
- **THEN** verify SHALL report a WARNING to re-validate the page

#### Scenario: Project UI token note
- **WHEN** `effectiveUiActive` is true
- **AND** `grspec/ui/MASTER.md` exists
- **THEN** the UI Quality section SHALL note project foundation availability for token verification

#### Scenario: Unknown status treated like blocked
- **WHEN** `uiArtifactStatus` is `unknown`
- **AND** all tasks under plan `## UI` are marked `[x]`
- **THEN** verify SHALL report a CRITICAL inconsistency

### Requirement: Verify content template includes UI Quality as standalone step
The verify content template (`content/verify-change.md`) SHALL include a conditional UI Quality check as a standalone step (Step 8) after the Coherence dimension, not as a sub-section within Coherence.

The step SHALL activate when `effectiveUiActive` is true or when touched files include UI extensions. It SHALL NOT gate on `ui-detected` alone for v2 changes with `ui.md`.

#### Scenario: UI Quality as Step 8
- **WHEN** the verify content template defines verification steps
- **THEN** UI Quality SHALL appear as its own numbered step between Coherence (Step 7) and "Generate Verification Report" (Step 9)
- **AND** the step condition SHALL reference `effectiveUiActive` (or apply JSON `uiArtifactStatus`)

### Requirement: Summary scorecard includes conditional UI Quality row
When UI Quality is checked (`effectiveUiActive` true or UI file touches), the verification summary scorecard SHALL include a fourth row for UI Quality. When skipped, the row SHALL be omitted.

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

#### Scenario: Three-dimension scorecard when skipped
- **WHEN** `effectiveUiActive` is false and no UI file extensions are touched
- **THEN** the summary table SHALL omit the UI Quality row
