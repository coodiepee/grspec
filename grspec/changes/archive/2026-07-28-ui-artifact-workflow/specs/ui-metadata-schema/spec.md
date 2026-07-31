---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## ADDED Requirements

### Requirement: Structured ui metadata block
The change metadata schema SHALL support an optional `ui` object in `.grspec.yaml` with:

- `detected` (boolean, required when `ui` is present)
- `keywords` (string array, optional)

The `autoGenerate` field SHALL NOT exist on the `ui` object.

#### Scenario: Full ui block written after detection
- **WHEN** `grspec ui detect` returns `detected: true` with keywords
- **THEN** `.grspec.yaml` SHALL contain `ui: { detected: true, keywords: [...] }`
- **AND** SHALL NOT contain `autoGenerate`

#### Scenario: Metadata reader returns unified UI state from ui block
- **WHEN** `.grspec.yaml` contains `ui: { detected: true, keywords: [layout] }`
- **THEN** the metadata reader SHALL return `uiDetected: true` and `uiKeywords: ["layout"]`

#### Scenario: Legacy ui-detected remains readable
- **WHEN** `.grspec.yaml` contains `ui-detected: true` and no `ui` block
- **THEN** the metadata reader SHALL return `uiDetected: true`

#### Scenario: ui block takes precedence over legacy field
- **WHEN** `.grspec.yaml` contains both `ui-detected: false` and `ui: { detected: true }`
- **THEN** the metadata reader SHALL return `uiDetected: true` from the `ui` block

### Requirement: effectiveUiActive precedence
For v2 changes with `ui.md`, `effectiveUiActive` SHALL be `parseUiArtifactStatus(ui.md) !== 'na'`. When Status is `na`, UI review and CRITICAL rule gates SHALL be disabled regardless of `ui.detected` in metadata.

When `ui.md` has `Status: na`, the ui artifact workflow SHALL set `ui.detected: false` or remove the `ui` block.

#### Scenario: na status overrides detected metadata
- **WHEN** `ui.md` has `Status: na`
- **AND** `.grspec.yaml` has `ui: { detected: true }`
- **THEN** `effectiveUiActive` SHALL be false for apply and verify gates

#### Scenario: v1 fallback without ui.md
- **WHEN** change uses schema v1 (no `ui.md` required)
- **AND** `.grspec.yaml` has `ui-detected: true`
- **THEN** `effectiveUiActive` SHALL be true

### Requirement: schemaVersion on change metadata
`.grspec.yaml` SHALL support optional `schemaVersion: 1 | 2`. `grspec new change` SHALL write `schemaVersion: 2`. When omitted, resolvers SHALL treat the change as schema version 1.

#### Scenario: New change defaults to v2
- **WHEN** user runs `grspec new change "feature-x"`
- **THEN** `.grspec.yaml` SHALL contain `schemaVersion: 2`
