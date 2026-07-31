---
type: spec
change: workflow-ux-optimization
created: 2026-06-15
schema: spec-driven
---
## ADDED Requirements

### Requirement: Compact verify summary variant

The verify skill SHALL support producing a compact summary suitable for embedding in other command outputs (e.g., archive).

#### Scenario: Compact summary format

- **WHEN** verify is invoked in compact mode (programmatically by the archive flow)
- **THEN** the output SHALL be a single block of no more than 5 lines
- **AND** SHALL include: task completion ratio, requirement coverage ratio, and critical issue count

#### Scenario: Compact summary with no issues

- **WHEN** compact verify finds no critical issues
- **THEN** the output SHALL be a single success line (e.g., "Verify: 12/12 tasks, 5/5 requirements covered")

#### Scenario: Compact summary with issues

- **WHEN** compact verify finds critical issues
- **THEN** the output SHALL include the issue count and a hint to run full verify
- **AND** SHALL NOT include the full issue details
