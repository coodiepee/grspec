---
type: spec
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## ADDED Requirements

### Requirement: Structured ui metadata block
The change metadata schema SHALL support an optional `ui` object in `.grspec.yaml` with the following fields:

- `detected` (boolean, required when `ui` is present) — whether the change involves UI work
- `keywords` (string array, optional) — matched UI keywords from detection
- `autoGenerate` (boolean, optional, default `true`) — whether propose/ff workflows MAY auto-generate a change-level design system

#### Scenario: Full ui block written after detection
- **WHEN** `grspec ui detect --change "<name>" --json` returns `detected: true` with `keywords: ["dashboard", "chart", "responsive"]`
- **AND** the agent updates `.grspec.yaml` per workflow template
- **THEN** the file SHALL contain:
  ```yaml
  ui:
    detected: true
    keywords: [dashboard, chart, responsive]
  ```

#### Scenario: Metadata reader returns unified UI state from ui block
- **WHEN** `.grspec.yaml` contains `ui: { detected: true, keywords: [layout, color] }`
- **THEN** the metadata reader SHALL return `uiDetected: true` and `uiKeywords: ["layout", "color"]`

#### Scenario: Legacy ui-detected remains readable
- **WHEN** `.grspec.yaml` contains `ui-detected: true` and no `ui` block
- **THEN** the metadata reader SHALL return `uiDetected: true`
- **AND** `uiKeywords` SHALL be empty or undefined

#### Scenario: ui block takes precedence over legacy field
- **WHEN** `.grspec.yaml` contains both `ui-detected: false` and `ui: { detected: true, keywords: [ui] }`
- **THEN** the metadata reader SHALL return `uiDetected: true` from the `ui` block

### Requirement: autoGenerate opt-out
When `ui.autoGenerate` is `false` on a change, or legacy `ui-auto-generate: false` is set at project or change level, workflows SHALL NOT auto-generate a change-level design system during propose or fast-forward.

#### Scenario: Change-level autoGenerate false
- **WHEN** `.grspec.yaml` contains `ui: { detected: true, autoGenerate: false }`
- **AND** propose workflow detects UI content
- **THEN** the workflow SHALL NOT run `grspec ui design-system --persist` for the change
- **AND** SHALL still persist `ui.detected` and `ui.keywords` if detection ran

#### Scenario: Legacy project opt-out still honored
- **WHEN** project `grspec.yaml` contains `ui-auto-generate: false`
- **AND** a proposal contains ≥3 UI keywords
- **THEN** design-system auto-generation SHALL be suppressed
- **AND** detection metadata MAY still be written if the workflow runs detect
