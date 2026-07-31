---
type: spec
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Apply instruction includes UI guidance when design-system present
When design-system context files are discovered (at change or project level per design-system-inheritance), the apply instruction SHALL append a note reminding the agent to reference the design-system artifacts for color tokens, typography, and component specifications.

Additionally, when UI is active in change metadata (`ui.detected: true` or legacy `ui-detected: true`), the instruction SHALL embed the text of all CRITICAL-severity rules from the rules database inline, rather than only suggesting the `grspec ui rules` command.

#### Scenario: CRITICAL rules embedded when UI is active
- **WHEN** `generateApplyInstructions` produces instructions for a change with `ui: { detected: true }` or `ui-detected: true` in `.grspec.yaml`
- **AND** the apply state is `ready`
- **THEN** the `instruction` field SHALL contain the inline text of all CRITICAL-severity UI rules
- **AND** SHALL recommend running `grspec ui review <path>` after implementation

#### Scenario: Design-system guidance with inline rules
- **WHEN** `generateApplyInstructions` produces instructions with `design-system` in `contextFiles`
- **AND** UI is active in metadata
- **THEN** the `instruction` field SHALL contain both design-system references and inline CRITICAL rules

#### Scenario: Design-system present but UI not active
- **WHEN** `generateApplyInstructions` produces instructions with `design-system` in `contextFiles`
- **AND** neither `ui.detected` nor `ui-detected` is set in `.grspec.yaml`
- **THEN** the `instruction` field SHALL contain design-system references
- **AND** SHALL suggest the `grspec ui rules` command (existing behavior)
- **AND** SHALL NOT embed inline rules

#### Scenario: UI active without design-system
- **WHEN** `generateApplyInstructions` produces instructions without `design-system` in `contextFiles`
- **AND** UI is active in metadata
- **THEN** the `instruction` field SHALL embed inline CRITICAL rules
- **AND** SHALL recommend `grspec ui review <path>` after implementation

### Requirement: Design-system context file discovery
During `generateApplyInstructions`, after building `contextFiles` from schema artifact outputs, the system SHALL discover design-system files using the inheritance priority defined in design-system-inheritance: change-level `design-system/MASTER.md` first, then project-level `grspec/design-system/<slug>/MASTER.md`.

#### Scenario: Design-system directory with MASTER.md at change level
- **WHEN** `generateApplyInstructions` is called for a change that has `design-system/MASTER.md`
- **THEN** `contextFiles` SHALL contain a `design-system` key
- **AND** the value SHALL include the path to `MASTER.md`

#### Scenario: Project-level fallback
- **WHEN** `generateApplyInstructions` is called for a change without change-level `design-system/MASTER.md`
- **AND** the project has `grspec/design-system/<slug>/MASTER.md`
- **THEN** `contextFiles` SHALL contain a `design-system` key with the project MASTER path

#### Scenario: No design-system at any level
- **WHEN** `generateApplyInstructions` is called for a change without design-system at change or project level
- **THEN** `contextFiles` SHALL NOT contain a `design-system` key

### Requirement: Apply content template references design-system contextFiles
The apply content template (`content/apply-change.md`) SHALL include guidance for agents to read and use design-system files when present in `contextFiles`.

#### Scenario: Design-system in contextFiles
- **WHEN** the apply content template instructs the agent to read context files (Step 4)
- **THEN** the template SHALL explicitly mention that `contextFiles` may include a `design-system` key containing MASTER.md and page overrides (from change or project level)
- **AND** SHALL instruct the agent to reference design tokens (colors, typography, spacing) from these files when implementing UI-related tasks

### Requirement: Apply content template includes post-task UI review
The apply content template SHALL instruct agents to run `grspec ui review` after completing tasks when UI work is involved.

#### Scenario: UI review when design-system present
- **WHEN** the "After EVERY task" checklist in the apply template runs
- **AND** `contextFiles` includes a `design-system` key
- **THEN** the template SHALL instruct the agent to run `grspec ui review <changed-file-paths>` and report CRITICAL/HIGH findings before marking the task complete

#### Scenario: UI review when UI active without design-system
- **WHEN** the "After EVERY task" checklist runs
- **AND** change metadata indicates UI is active (`ui.detected` or `ui-detected`)
- **AND** `contextFiles` does not include `design-system`
- **THEN** the template SHALL still instruct the agent to run `grspec ui review <changed-file-paths>` on modified UI files
