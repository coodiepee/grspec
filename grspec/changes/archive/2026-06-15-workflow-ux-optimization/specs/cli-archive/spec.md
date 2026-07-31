---
type: spec
change: workflow-ux-optimization
created: 2026-06-15
schema: spec-driven
---
## ADDED Requirements

### Requirement: Automatic lightweight verify on archive

When archiving a change, grspec SHALL run a lightweight verification pass and include the results in the archive output. This check is informational and SHALL NOT block the archive operation.

#### Scenario: Verify summary shown during archive

- **WHEN** a change is archived
- **AND** the change has delta specs and a plan
- **THEN** the archive output SHALL include a compact verify summary showing:
  - Task completion count (e.g., "12/12 tasks")
  - Spec coverage status (requirements with detectable implementation vs total)

#### Scenario: Verify summary with gaps detected

- **WHEN** the lightweight verify detects uncovered requirements or incomplete tasks
- **THEN** the archive output SHALL display a non-blocking warning (e.g., "1 requirement without detectable implementation")
- **AND** SHALL suggest running `/grsx:verify` for a detailed report
- **AND** SHALL proceed with the archive without user intervention

#### Scenario: Archive without verifiable artifacts

- **WHEN** a change has no delta specs or no plan
- **THEN** the archive SHALL skip the lightweight verify pass
- **AND** SHALL proceed normally without warnings

#### Scenario: Verify disabled via flag

- **WHEN** the user runs `grspec archive <change> --skip-verify`
- **THEN** the lightweight verify pass SHALL be skipped entirely
