---
type: spec
change: integrate-ui-into-workflow
created: 2026-06-11
schema: spec-driven
---
## ADDED Requirements

### Requirement: Propose phase UI detection and generation
After the proposal artifact is created during the propose workflow, the system SHALL detect UI content. When ≥3 UI keywords are found, the workflow SHALL:

1. Set `ui-detected: true` in the change's `.grspec.yaml`
2. Generate a design system using `grspec ui design-system` with the `--persist` flag, writing output to `<changeDir>/design-system`
3. Display a summary showing: detection result, matched keywords, generated design system details (style, key tokens)

#### Scenario: UI detected during propose
- **WHEN** a proposal is created with text "Build a responsive analytics dashboard with chart components"
- **THEN** the workflow SHALL detect ≥3 UI keywords (responsive, dashboard, chart, component)
- **AND** SHALL set `ui-detected: true` in `.grspec.yaml`
- **AND** SHALL generate `design-system/MASTER.md` in the change directory
- **AND** SHALL display a summary with the matched keywords and generated token overview

#### Scenario: No UI detected during propose
- **WHEN** a proposal is created with text "Refactor the parser module for better error handling"
- **THEN** the workflow SHALL detect <3 UI keywords
- **AND** SHALL NOT set `ui-detected` in `.grspec.yaml`
- **AND** SHALL NOT generate a `design-system/` directory
- **AND** SHALL NOT display any UI-related output

#### Scenario: Propose continues without interruption
- **WHEN** UI is detected and design-system generation completes
- **THEN** the propose workflow SHALL continue to the next artifact (design) without prompting the user for confirmation

### Requirement: Propose UI opt-out
Users SHALL be able to suppress automatic design-system generation by setting `ui-auto-generate: false` in the change's `.grspec.yaml` or in the project-level `grspec.yaml`.

#### Scenario: Project-level opt-out
- **WHEN** the project's `grspec.yaml` contains `ui-auto-generate: false`
- **AND** a proposal is created with ≥3 UI keywords
- **THEN** the workflow SHALL NOT generate a design system
- **AND** SHALL NOT set `ui-detected`

#### Scenario: Change-level opt-out
- **WHEN** a change's `.grspec.yaml` contains `ui-auto-generate: false`
- **AND** the proposal contains ≥3 UI keywords
- **THEN** the workflow SHALL NOT generate a design system for that change

### Requirement: Manual UI opt-in
Users SHALL be able to force UI integration by manually setting `ui-detected: true` in the change's `.grspec.yaml`, even when fewer than 3 keywords are detected.

#### Scenario: Manual override triggers downstream hooks
- **WHEN** a change's `.grspec.yaml` contains `ui-detected: true`
- **AND** the proposal has fewer than 3 UI keywords
- **THEN** downstream hooks (design enrichment, apply rules, verify checks) SHALL activate as if UI was detected
