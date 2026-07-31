---
type: spec
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: UI quality check in verify workflow
When the verify workflow runs on a change with UI active in metadata (`ui.detected: true` or legacy `ui-detected: true`), or when the change's `touches` include files with UI extensions (`.tsx`, `.jsx`, `.css`, `.scss`, `.vue`, `.svelte`), the verification process SHALL include a UI Quality check.

The UI Quality check SHALL:
1. Run `grspec ui review` on touched UI files or the change directory
2. Map review findings to verification severity levels: CRITICAL → CRITICAL, HIGH → WARNING, MEDIUM → SUGGESTION
3. Include findings in the verification report

#### Scenario: UI quality findings in verify report
- **WHEN** verify is run on a change with `ui: { detected: true }` or `ui-detected: true`
- **AND** `grspec ui review` returns findings (e.g., missing cursor-pointer, emoji as icon)
- **THEN** the verification report SHALL include a "UI Quality" section
- **AND** CRITICAL review findings SHALL appear as CRITICAL verification issues
- **AND** HIGH review findings SHALL appear as WARNING verification issues

#### Scenario: No UI quality issues
- **WHEN** verify is run on a change with UI active in metadata
- **AND** `grspec ui review` returns zero findings
- **THEN** the report SHALL note "UI Quality: ✓ No issues found"

#### Scenario: Non-UI change skips UI quality check
- **WHEN** verify is run on a change without UI metadata
- **AND** the change's `touches` do not include UI file extensions
- **THEN** the verification report SHALL NOT include a UI Quality section

#### Scenario: Design-system token coverage note
- **WHEN** verify is run on a change with UI active in metadata
- **AND** design-system context is available (change-level or project-level MASTER)
- **THEN** the UI Quality section SHALL include a note about design-system availability for token verification

### Requirement: Verify content template includes UI Quality as standalone step
The verify content template (`content/verify-change.md`) SHALL include a conditional UI Quality check as a standalone step (Step 8) after the Coherence dimension, not as a sub-section within Coherence.

The corresponding command template (`workflows/verify-change.ts`) and deployed command (`.cursor/commands/grsx-verify.md`) SHALL include the same step.

#### Scenario: UI Quality as Step 8 in skill and command
- **WHEN** the verify content template defines verification steps
- **THEN** UI Quality SHALL appear as its own numbered step between Coherence (Step 7) and "Generate Verification Report" (Step 9)
- **AND** `grsx-verify.md` SHALL contain an equivalent step

### Requirement: Summary scorecard includes conditional UI Quality row
When UI Quality is checked, the verification summary scorecard SHALL include a fourth row for UI Quality. When skipped, the row SHALL be omitted.

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
- **WHEN** UI Quality check is skipped
- **THEN** the summary table SHALL omit the UI Quality row

## ADDED Requirements

### Requirement: Archive soft gate for UI changes
When the archive workflow runs on a change with UI active in metadata, it SHALL display a recommendation to run verify (including UI Quality) before archiving, unless the user has already confirmed proceed.

#### Scenario: Archive warns UI change without verify
- **WHEN** archive is invoked on a change with `ui: { detected: true }` or `ui-detected: true`
- **THEN** the archive workflow SHALL suggest running `/grsx:verify` before proceeding
- **AND** SHALL allow the user to confirm and proceed without blocking

#### Scenario: Non-UI change archive unchanged
- **WHEN** archive is invoked on a change without UI metadata
- **THEN** the archive workflow SHALL NOT display UI-specific verify guidance
