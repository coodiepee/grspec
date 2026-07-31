---
type: spec
change: ui-workflow-fusion
created: 2026-06-23
schema: spec-driven
---
# propose-ui-metadata Specification

## Purpose
Mark changes as UI-involved by writing structured metadata to `.grspec.yaml` after proposal creation, enabling downstream phases (design, apply, verify) to conditionally activate UI-specific behavior.

## ADDED Requirements

### Requirement: Propose workflow writes UI metadata to .grspec.yaml
After the proposal artifact is created during the propose or fast-forward workflow, the content template SHALL instruct the agent to run `grspec ui detect --change "<name>" --json`. When the detection result has `detected: true`, the agent SHALL update `.grspec.yaml` with structured UI metadata.

#### Scenario: UI detected — metadata written
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
- **THEN** `.grspec.yaml` SHALL NOT be modified with any `ui` key

#### Scenario: Content templates include UI detection step
- **WHEN** `grspec init` generates skill files from content templates
- **THEN** the propose content template (`content/propose.md`) SHALL contain a step for UI detection between artifact creation and the "show final status" step
- **AND** the ff-change content template (`content/ff-change.md`) SHALL contain the same UI detection step

### Requirement: Opt-out control
The UI detection step in the content template SHALL instruct the agent to skip detection when `ui-auto-generate: false` is set in the change's `.grspec.yaml` or in the project-level `grspec.yaml`.

#### Scenario: Change-level opt-out
- **WHEN** `.grspec.yaml` contains `ui-auto-generate: false`
- **THEN** the agent SHALL skip the `grspec ui detect` step entirely

### Requirement: Manual opt-in
The content template SHALL note that users can manually set `ui.detected: true` in `.grspec.yaml` to force UI-aware behavior in downstream phases, regardless of keyword detection.

#### Scenario: Manual override
- **WHEN** a user manually sets `ui: { detected: true }` in `.grspec.yaml`
- **THEN** downstream phases (apply, verify) SHALL treat the change as UI-involved
