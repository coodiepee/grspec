---
type: spec
change: ui-workflow-fusion
created: 2026-06-23
schema: spec-driven
---
# apply-ui-context Delta Specification

## Purpose
Close the gap between CLI-level UI integration (already partially implemented) and agent-level awareness in the apply content template.

## MODIFIED Requirements

### Requirement: Apply content template references design-system contextFiles
The apply content template (`content/apply-change.md`) SHALL include guidance for agents to read and use design-system files when present in `contextFiles`.

#### Scenario: Design-system in contextFiles
- **WHEN** the apply content template instructs the agent to read context files (Step 4)
- **THEN** the template SHALL explicitly mention that `contextFiles` may include a `design-system` key containing MASTER.md and page overrides
- **AND** SHALL instruct the agent to reference design tokens (colors, typography, spacing) from these files when implementing UI-related tasks

### Requirement: Apply content template includes post-task UI review
The apply content template SHALL instruct agents to run `grspec ui review` after completing UI-related tasks when design-system context is present.

#### Scenario: UI review after task completion
- **WHEN** the "After EVERY task" checklist in the apply template runs
- **AND** `contextFiles` includes a `design-system` key
- **THEN** the template SHALL instruct the agent to also run `grspec ui review <changed-file-paths>` and report CRITICAL/HIGH findings before marking the task complete

### Requirement: Inline CRITICAL rules in CLI apply instructions
When `generateApplyInstructions` produces instructions for a change with `ui-detected: true` in `.grspec.yaml`, the `instruction` field SHALL embed the text of all CRITICAL-severity UI rules inline, rather than only suggesting the `grspec ui rules` command.

#### Scenario: CRITICAL rules embedded
- **WHEN** `generateApplyInstructions` runs for a change with `ui-detected: true`
- **THEN** the `instruction` field SHALL contain the inline text of all CRITICAL-severity UI rules
- **AND** SHALL still recommend running `grspec ui review <path>` after implementation

#### Scenario: No ui-detected — existing behavior preserved
- **WHEN** `generateApplyInstructions` runs for a change without `ui-detected`
- **THEN** the instruction SHALL use existing behavior (suggest `grspec ui rules` command if design-system present, no UI references otherwise)
