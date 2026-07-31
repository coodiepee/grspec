---
type: spec
change: integrate-ui-into-workflow
created: 2026-06-11
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Design instruction enrichment when UI detected
When `generateInstructions` is called for the `design` artifact, the system SHALL check for UI context in the following order:

1. If `design-system/MASTER.md` exists in the change directory, the instruction SHALL include a reference to the generated design tokens (style, primary colors, typography pairings) extracted from MASTER.md, advising the author to embed key decisions in the design document.

2. If `design-system/MASTER.md` does not exist but UI content is detected in the proposal (≥3 keywords), the instruction SHALL append the existing advisory recommending `grspec ui design-system` generation.

3. If no UI content is detected, the instruction SHALL be unmodified.

#### Scenario: Design-system already generated (from propose hook)
- **WHEN** `generateInstructions` is called with `artifactId = 'design'`
- **AND** the change directory contains `design-system/MASTER.md`
- **THEN** the instruction SHALL reference the design-system directory
- **AND** SHALL include key token values extracted from MASTER.md
- **AND** SHALL NOT suggest running `grspec ui design-system` (it already ran)

#### Scenario: UI detected but no design-system yet
- **WHEN** `generateInstructions` is called with `artifactId = 'design'`
- **AND** the change's `proposal.md` contains ≥3 UI keywords
- **AND** `design-system/MASTER.md` does not exist
- **THEN** the instruction SHALL append the advisory recommending design-system generation

#### Scenario: No UI detected
- **WHEN** `generateInstructions` is called with `artifactId = 'design'`
- **AND** the change's `proposal.md` contains <3 UI keywords
- **AND** no `design-system/MASTER.md` exists
- **THEN** the instruction SHALL be the unmodified schema design instruction

#### Scenario: Enrichment only for design artifact
- **WHEN** `generateInstructions` is called with `artifactId = 'proposal'` or `artifactId = 'plan'`
- **THEN** the returned `instruction` field SHALL NOT contain UI-related supplementary blocks regardless of proposal content

### Requirement: UI enrichment does not block artifact creation
The UI instruction enrichment SHALL be advisory only. If `detectUiContentInChange` throws an error or MASTER.md is unreadable, the system SHALL silently skip enrichment and return the unmodified instruction.

#### Scenario: Detection error is non-fatal
- **WHEN** `generateInstructions` is called for `design` and the proposal.md file is unreadable
- **THEN** the function SHALL return successfully with the standard instruction
- **AND** no error SHALL be thrown
