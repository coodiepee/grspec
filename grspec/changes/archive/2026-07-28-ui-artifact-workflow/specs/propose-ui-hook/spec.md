---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Propose phase UI detection and generation
After the proposal artifact is created during the propose workflow, the system SHALL detect UI content via `grspec ui detect --change "<name>" --json`. When `detected: true`, the workflow SHALL write structured metadata to `.grspec.yaml`:

```yaml
ui:
  detected: true
  keywords: [<matched keywords>]
```

The propose and fast-forward workflows SHALL NOT run `grspec ui design-system --persist` or create `design-system/` or `ui/pages/` during the propose phase.

#### Scenario: UI detected during propose — metadata only
- **WHEN** a proposal is created with text "Build a responsive analytics dashboard with chart components"
- **AND** `grspec ui detect` returns `detected: true`
- **THEN** the workflow SHALL write `ui: { detected: true, keywords: [...] }` to `.grspec.yaml`
- **AND** SHALL NOT generate any persist output under the change directory during propose

#### Scenario: No UI detected during propose
- **WHEN** `grspec ui detect` returns `detected: false`
- **THEN** the workflow SHALL NOT add a `ui` block to `.grspec.yaml`
- **AND** SHALL NOT display UI generation output

#### Scenario: Propose continues to next artifact without persist
- **WHEN** UI is detected during propose
- **THEN** the propose workflow SHALL continue to the next ready artifact without design-system generation

### Requirement: Content templates include UI detection step
The propose and fast-forward content templates SHALL include a UI detection step that instructs the agent to run `grspec ui detect --change "<name>" --json` after proposal creation.

The templates SHALL NOT instruct `grspec ui design-system --persist`, SHALL NOT reference `ui-auto-generate` or `ui.autoGenerate`, and SHALL NOT create `design-system/` or `ui/pages/` during propose/ff.

#### Scenario: Propose content template contains detection step
- **WHEN** `grspec init` generates skill files from content templates
- **THEN** the propose content template (`content/propose.md`) SHALL contain a step for UI detection between artifact creation and the "show final status" step
- **AND** the ff-change content template (`content/ff-change.md`) SHALL contain the same UI detection step
- **AND** neither template SHALL contain persist or autoGenerate instructions

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
- **AND** SHALL NOT persist any UI files under the change directory

#### Scenario: UI not detected — no metadata change
- **WHEN** a proposal is created with text "Refactor the parser module for better error handling"
- **AND** `grspec ui detect` returns `detected: false` with `keywords: []`
- **THEN** `.grspec.yaml` SHALL NOT be modified with any `ui` key

## REMOVED Requirements

### Requirement: Propose UI opt-out
**Reason**: `ui.autoGenerate` and `ui-auto-generate` removed; persist moved to ui artifact phase.
**Migration**: No configuration opt-out; agents skip persist in propose/ff templates.

### Requirement: Manual UI opt-in
**Reason**: Superseded by ui artifact `Status: na` clearing false-positive metadata and v2 `ui.md` as authority.
**Migration**: Use `ui.md` Status and structured `ui` metadata from detect; manual `ui-detected: true` remains readable on v1 changes only.
