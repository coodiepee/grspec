---
type: spec
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Propose phase UI detection and generation
After the artifact creation loop completes during the propose workflow (proposal and any subsequent artifacts in the same run), the system SHALL detect UI content. When ≥3 UI keywords are found, the workflow SHALL:

1. Write structured UI metadata to the change's `.grspec.yaml`:
   ```yaml
   ui:
     detected: true
     keywords: [<matched-keywords>]
   ```
2. Generate a design system using `grspec ui design-system` with the `--persist` flag, writing output to `<changeDir>/design-system`, unless `ui.autoGenerate` is `false` or legacy `ui-auto-generate: false` applies
3. Display a summary showing: detection result, matched keywords, generated design system details (style, key tokens)

#### Scenario: UI detected during propose
- **WHEN** a proposal is created with text "Build a responsive analytics dashboard with chart components"
- **THEN** the workflow SHALL detect ≥3 UI keywords (responsive, dashboard, chart, component)
- **AND** SHALL write `ui: { detected: true, keywords: [responsive, dashboard, chart, component] }` to `.grspec.yaml`
- **AND** SHALL generate `design-system/MASTER.md` in the change directory
- **AND** SHALL display a summary with the matched keywords and generated token overview

#### Scenario: No UI detected during propose
- **WHEN** a proposal is created with text "Refactor the parser module for better error handling"
- **THEN** the workflow SHALL detect <3 UI keywords
- **AND** SHALL NOT write a `ui` block or `ui-detected` to `.grspec.yaml`
- **AND** SHALL NOT generate a `design-system/` directory
- **AND** SHALL NOT display any UI-related output

#### Scenario: Propose continues without interruption
- **WHEN** UI is detected and design-system generation completes
- **THEN** the propose workflow SHALL continue to the next artifact (design) without prompting the user for confirmation

### Requirement: Propose UI opt-out
Users SHALL be able to suppress automatic design-system generation by setting `ui.autoGenerate: false` in the change's `ui` block, or legacy `ui-auto-generate: false` in the change's `.grspec.yaml` or project-level `grspec.yaml`.

#### Scenario: Project-level opt-out
- **WHEN** the project's `grspec.yaml` contains `ui-auto-generate: false`
- **AND** a proposal is created with ≥3 UI keywords
- **AND** the workflow runs `grspec ui detect` with `detected: true`
- **THEN** the workflow SHALL NOT generate a design system
- **AND** SHALL still write `ui: { detected: true, keywords: [...] }` to `.grspec.yaml`

#### Scenario: Change-level opt-out
- **WHEN** a change's `.grspec.yaml` contains `ui: { autoGenerate: false }` or legacy `ui-auto-generate: false`
- **AND** the proposal contains ≥3 UI keywords
- **THEN** the workflow SHALL NOT generate a design system for that change

### Requirement: Manual UI opt-in
Users SHALL be able to force UI integration by manually setting `ui: { detected: true }` or legacy `ui-detected: true` in the change's `.grspec.yaml`, even when fewer than 3 keywords are detected.

#### Scenario: Manual override triggers downstream hooks
- **WHEN** a change's `.grspec.yaml` contains `ui: { detected: true }` or `ui-detected: true`
- **AND** the proposal has fewer than 3 UI keywords
- **THEN** downstream hooks (design enrichment, apply rules, verify checks) SHALL activate as if UI was detected

### Requirement: Content templates include UI detection step
The propose and fast-forward content templates SHALL include a UI detection step that instructs the agent to run `grspec ui detect --change "<name>" --json` after the artifact creation loop completes (before final status output).

#### Scenario: Propose content template contains detection step
- **WHEN** `grspec init` generates skill files from content templates
- **THEN** the propose content template (`content/propose.md`) SHALL contain a step for UI detection after the artifact loop and before the "show final status" step
- **AND** the ff-change content template (`content/ff-change.md`) SHALL contain the same UI detection step

#### Scenario: UI detected — metadata written via content template
- **WHEN** a proposal is created with text mentioning "responsive analytics dashboard with chart components"
- **AND** the agent runs `grspec ui detect --change "<name>" --json`
- **AND** the result has `detected: true` with `keywords: ["responsive", "dashboard", "chart", "component"]`
- **THEN** the agent SHALL add to `.grspec.yaml`:
  ```yaml
  ui:
    detected: true
    keywords: [responsive, dashboard, chart, component]
  ```

#### Scenario: UI not detected — no metadata change
- **WHEN** a proposal is created with text "Refactor the parser module for better error handling"
- **AND** `grspec ui detect` returns `detected: false` with `keywords: []`
- **THEN** `.grspec.yaml` SHALL NOT be modified with any `ui` key or `ui-detected` field
