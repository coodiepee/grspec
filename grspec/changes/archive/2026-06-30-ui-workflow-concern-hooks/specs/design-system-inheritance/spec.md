---
type: spec
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## ADDED Requirements

### Requirement: Project-level design system fallback for apply context
When `generateApplyInstructions` builds `contextFiles`, the system SHALL discover design-system files using this priority:

1. **Change-level**: all `.md` files under `<changeDir>/design-system/` when `MASTER.md` exists
2. **Project-level fallback**: when change-level `MASTER.md` is absent, prefer `detectDesignSystem(projectRoot).path` when found; otherwise the first valid `grspec/design-system/<slug>/MASTER.md` under the project root, plus all `.md` files in that slug directory

When change-level `MASTER.md` exists, project-level paths SHALL NOT be included in `contextFiles`. When change-level override files exist without a local `MASTER.md`, instruction guidance MAY reference the project-level MASTER as the baseline source of truth.

#### Scenario: Change-level design-system discovered
- **WHEN** a change has `design-system/MASTER.md` and `design-system/landing.md`
- **THEN** `contextFiles['design-system']` SHALL include paths to both files
- **AND** project-level design-system SHALL NOT be added to `contextFiles`

#### Scenario: Project-level fallback when change has no design-system
- **WHEN** a change has no `design-system/` directory
- **AND** the project has `grspec/design-system/my-app/MASTER.md`
- **THEN** `contextFiles['design-system']` SHALL include the project MASTER path
- **AND** SHALL include other `.md` files in that slug directory

#### Scenario: No design-system at either level
- **WHEN** neither change nor project has a valid `MASTER.md`
- **THEN** `contextFiles` SHALL NOT contain a `design-system` key

### Requirement: Design instruction references inherited project MASTER
When enriching design artifact instructions, if change-level `design-system/MASTER.md` is absent but project-level MASTER exists, the instruction SHALL reference the project-level design tokens and note the inheritance source.

#### Scenario: Project MASTER referenced in design enrichment
- **WHEN** `generateInstructions` is called for `design`
- **AND** the change has no `design-system/MASTER.md`
- **AND** `grspec/design-system/<slug>/MASTER.md` exists
- **AND** UI content is detected in the proposal (≥3 keywords) or `ui.detected` is true
- **THEN** the instruction SHALL reference the project-level MASTER path
- **AND** SHALL include key token values extracted from that file
