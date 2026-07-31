# ui-artifact-orchestration Specification

## Purpose
Define ui.md orchestration, status values, unblock flow, and plan UI task grouping.
## Requirements
### Requirement: ui artifact schema instruction orchestration
The v2 `ui` artifact schema instruction SHALL direct the agent to:

1. Read `proposal.md`, `design.md`, and `.grspec.yaml` UI metadata
2. Decide whether the change has a UI surface
3. If no UI surface: write `ui.md` with `Status: na`, clear UI metadata, and stop
4. If UI surface: check `grspec/ui/MASTER.md` via `grspec ui status --json` or `isUiFoundationReady`
5. If MASTER missing: write `ui.md` with `Status: blocked` and suggest `/grsx-ui-init`
6. If MASTER present: write `ui.md` with `Status: done`, Key Decisions, and optionally persist change pages via `grspec-ui-design-system`
7. Never create change-level `MASTER.md`

The instruction SHALL name sub-skills `grspec-ui-init`, `grspec-ui-design-system`, `grspec-ui-reference`, and `grspec-ui-review` directly. It SHALL NOT reference a hub `grspec-ui` skill.

#### Scenario: Instructions available for ui artifact
- **WHEN** `generateInstructions` is called with `artifactId = 'ui'` on a v2 change with `design` complete
- **THEN** the returned instruction SHALL describe the decision tree above
- **AND** SHALL NOT append UI blocks to the `design` artifact instruction

### Requirement: ui.md status values and required sections
The `ui.md` artifact SHALL use `## Status` with first-line values `na`, `blocked`, `done`, or leave missing (parsed as `unknown`).

| Status | Required sections |
|--------|-------------------|
| `na` | UI Scope, Rationale |
| `blocked` | UI Scope, Required before apply |
| `done` | UI Scope, Key Decisions |

#### Scenario: Done without pages is valid
- **WHEN** agent writes `ui.md` with `Status: done` and non-empty UI Scope
- **AND** `grspec/ui/MASTER.md` exists
- **AND** no `ui/pages/` files exist
- **THEN** the ui artifact SHALL still be considered valid for workflow purposes

### Requirement: Unblocking blocked ui artifact
When `grspec/ui/MASTER.md` is created after `ui.md` was written with `Status: blocked`, the continue workflow or re-running `grspec instructions ui` SHALL instruct the agent to update `ui.md` to `Status: done`, complete Key Decisions, and re-validate or regenerate provisional pages.

#### Scenario: Continue prompts unblock after init
- **WHEN** `ui.md` has `Status: blocked`
- **AND** `grspec/ui/MASTER.md` now exists
- **AND** user invokes continue
- **THEN** the continue template SHALL instruct the agent to refresh `ui.md` to `done`

### Requirement: Plan UI task grouping
The v2 `plan` artifact schema instruction SHALL require UI implementation tasks to be listed under a `## UI` markdown heading so apply gates can identify UI-related plan items.

#### Scenario: Plan instruction mentions UI section
- **WHEN** `generateInstructions` is called with `artifactId = 'plan'` on a v2 schema
- **THEN** the instruction SHALL state that UI tasks MUST be grouped under `## UI`

