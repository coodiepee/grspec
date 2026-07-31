---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Apply instruction includes UI guidance when UI context present
When UI context files are discovered under `contextFiles.ui`, the apply instruction SHALL remind the agent to reference `grspec/ui/MASTER.md`, change `ui.md`, and change `ui/pages/` for tokens and page overrides.

When `effectiveUiActive` is true (see ui-metadata-schema), the instruction SHALL embed inline CRITICAL-severity rules from the rules database.

#### Scenario: CRITICAL rules embedded when UI active
- **WHEN** `generateApplyInstructions` produces instructions for a v2 change with `uiArtifactStatus` not equal to `na`
- **AND** the apply state is `ready`
- **THEN** the `instruction` field SHALL contain inline CRITICAL UI rules
- **AND** SHALL recommend `grspec ui review <path>` after implementation

#### Scenario: UI context with inline rules
- **WHEN** `contextFiles.ui` is non-empty
- **AND** `effectiveUiActive` is true
- **THEN** the `instruction` field SHALL reference UI context paths and embed CRITICAL rules

#### Scenario: UI not active
- **WHEN** `effectiveUiActive` is false
- **THEN** the instruction SHALL NOT embed inline CRITICAL rules

### Requirement: UI context file discovery
During `generateApplyInstructions`, after schema artifact outputs, the system SHALL discover UI files at:

1. `grspec/changes/<name>/ui.md` (if exists)
2. `grspec/ui/MASTER.md` (if exists)
3. `grspec/ui/pages/*.md` (if any)
4. `grspec/changes/<name>/ui/pages/*.md` (if any)

Discovered paths SHALL be exposed under `contextFiles.ui`. The system SHALL NOT discover `design-system/` paths.

#### Scenario: Full UI context on v2 change
- **WHEN** change has `ui.md`, project has `grspec/ui/MASTER.md`, and change has `ui/pages/billing.md`
- **THEN** `contextFiles.ui` SHALL include all three paths

#### Scenario: No UI files
- **WHEN** no UI paths exist
- **THEN** `contextFiles` SHALL NOT contain a `ui` key

### Requirement: Apply content template references UI contextFiles
The apply content template SHALL instruct agents to read `contextFiles.ui` and honor `uiArtifactStatus` when marking plan items complete. UI tasks under plan `## UI` SHALL NOT be marked complete when `uiArtifactStatus` is `blocked` or `unknown`.

#### Scenario: Template mentions ui key
- **WHEN** the apply template instructs reading context files
- **THEN** it SHALL document the `ui` key (not `design-system`)

#### Scenario: UI review when UI active
- **WHEN** `effectiveUiActive` is true
- **THEN** the template SHALL instruct running `grspec ui review` after UI-related tasks

### Requirement: Apply instructions JSON UI fields
`grspec instructions apply --json` for v2 changes with `ui.md` SHALL include:

- `schemaVersion`
- `uiArtifactStatus` — result of `parseUiArtifactStatus`
- `uiFoundationReady` — result of `isUiFoundationReady`
- `contextFiles.ui` — discovered paths

#### Scenario: Blocked change apply JSON
- **WHEN** `ui.md` has `Status: blocked`
- **AND** `grspec/ui/MASTER.md` is missing
- **THEN** `uiArtifactStatus` SHALL be `blocked`
- **AND** `uiFoundationReady` SHALL be `false`
