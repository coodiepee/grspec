---
type: spec
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## ADDED Requirements

### Requirement: Continue workflow catch-up UI detection
The continue content template (`content/continue-change.md`) SHALL instruct the agent to run catch-up UI detection when:

- The `proposal` artifact has status `done`, AND
- `.grspec.yaml` contains neither a `ui` block nor `ui-detected: true`

The catch-up step SHALL run `grspec ui detect --change "<name>" --json` and, when `detected: true`, write the structured `ui` metadata block (and generate change-level design system when `autoGenerate` is not false), following the same rules as the propose workflow UI detection step.

#### Scenario: Catch-up runs on new-change path
- **WHEN** a user created a change via `/grsx:new` and completed `proposal.md` with ≥3 UI keywords
- **AND** `.grspec.yaml` has no UI metadata
- **AND** the user invokes continue
- **THEN** the agent SHALL run `grspec ui detect`
- **AND** SHALL write `ui: { detected: true, keywords: [...] }` to `.grspec.yaml`

#### Scenario: Catch-up skipped when metadata already present
- **WHEN** `.grspec.yaml` already contains `ui: { detected: true }` or `ui-detected: true`
- **THEN** the continue workflow SHALL NOT re-run UI detection

#### Scenario: Catch-up skipped when proposal incomplete
- **WHEN** the `proposal` artifact is not `done`
- **THEN** the continue workflow SHALL NOT run catch-up UI detection

#### Scenario: No UI detected during catch-up
- **WHEN** catch-up detection returns `detected: false`
- **THEN** `.grspec.yaml` SHALL NOT be modified with UI metadata
- **AND** the continue workflow SHALL proceed to the next ready artifact normally
