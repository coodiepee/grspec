---
type: spec
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## ADDED Requirements

### Requirement: Content templates are canonical for workflow UI steps
Workflow UI integration steps (detection, design-system context, UI review, UI Quality verify, continue catch-up, archive soft gate) SHALL be defined in `src/core/templates/content/*.md`. Command templates in `src/core/templates/workflows/*.ts` and deployed `.cursor/commands/grsx-*.md` files SHALL contain equivalent UI guidance for the same workflow commands.

#### Scenario: Apply content and command templates both reference design-system
- **WHEN** `content/apply-change.md` instructs agents to read `design-system` from `contextFiles`
- **THEN** `workflows/apply-change.ts` command template SHALL include the same design-system guidance
- **AND** `.cursor/commands/grsx-apply.md` SHALL include the same design-system guidance

#### Scenario: Verify content and command templates both include UI Quality
- **WHEN** `content/verify-change.md` defines Step 8 UI Quality
- **THEN** `workflows/verify-change.ts` SHALL define an equivalent UI Quality step
- **AND** `.cursor/commands/grsx-verify.md` SHALL define an equivalent UI Quality step

#### Scenario: Continue content and command templates both include catch-up detection
- **WHEN** `content/continue-change.md` defines catch-up UI detection after status check
- **THEN** `workflows/continue-change.ts` SHALL define an equivalent catch-up step
- **AND** `.cursor/commands/grsx-continue.md` SHALL define an equivalent catch-up step

#### Scenario: Archive content and command templates both include UI soft gate
- **WHEN** `content/archive-change.md` recommends verify before archive for UI-active changes
- **THEN** `workflows/archive-change.ts` SHALL define an equivalent soft gate step
- **AND** `.cursor/commands/grsx-archive.md` SHALL define an equivalent soft gate step

#### Scenario: Propose content and command templates both include UI detection
- **WHEN** `content/propose.md` defines UI detection after the artifact loop
- **THEN** `workflows/propose.ts` command template SHALL include equivalent UI detection guidance
- **AND** `.cursor/commands/grsx-propose.md` SHALL include equivalent UI detection guidance

#### Scenario: Fast-forward content and command templates both include UI detection
- **WHEN** `content/ff-change.md` defines UI detection after the artifact loop
- **THEN** `workflows/ff-change.ts` command template SHALL include equivalent UI detection guidance
- **AND** `.cursor/commands/grsx-ff.md` SHALL include equivalent UI detection guidance

### Requirement: Template parity test for UI workflow steps
The test suite SHALL include a check that key UI integration phrases are present in both content templates and their corresponding command templates for apply, verify, continue, archive, propose, and fast-forward workflows.

#### Scenario: Parity test fails on drift
- **WHEN** `content/apply-change.md` contains post-task `grspec ui review` guidance
- **AND** the apply command template omits that guidance
- **THEN** the parity test SHALL fail

#### Scenario: Parity test passes when synchronized
- **WHEN** content and command templates contain matching UI integration guidance for all six workflow files (propose, fast-forward, apply, verify, continue, archive)
- **THEN** the parity test SHALL pass
