---
type: spec
change: expand-ui-subcmd-system
created: 2026-06-05
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Design instruction enrichment when UI detected
When `generateInstructions` is called for the `design` artifact and UI content is detected in the completed `proposal.md`, the system SHALL append a supplementary UI instruction block to the `instruction` field.

The supplementary block SHALL include:
- A note indicating that UI-related content was detected
- The matched keywords
- A recommendation to run `grspec ui design-system "<query>"` with a suggested query
- Guidance to persist results using `--persist --output <changeDir>/design-system`
- A recommendation to run `grspec ui reference "<style>"` after choosing a style for detailed component specs

#### Scenario: UI detected in proposal during design instruction
- **WHEN** `generateInstructions` is called with `artifactId = 'design'`
- **AND** the change's `proposal.md` contains the text "modern dark mode dashboard with glassmorphism"
- **THEN** the returned `instruction` field SHALL contain the original schema design instruction
- **AND** it SHALL also contain a supplementary block mentioning `grspec ui design-system`
- **AND** it SHALL mention `grspec ui reference` for viewing complete style specifications after a style is chosen

#### Scenario: No UI detected in proposal
- **WHEN** `generateInstructions` is called with `artifactId = 'design'`
- **AND** the change's `proposal.md` contains no UI keywords
- **THEN** the returned `instruction` field SHALL be the unmodified schema design instruction

#### Scenario: Enrichment only for design artifact
- **WHEN** `generateInstructions` is called with `artifactId = 'proposal'` or `artifactId = 'plan'`
- **THEN** the returned `instruction` field SHALL NOT contain UI-related supplementary blocks regardless of proposal content

### Requirement: UI enrichment does not block artifact creation
The UI instruction enrichment SHALL be advisory only. If `detectUiContentInChange` throws an error (e.g. unreadable file), the system SHALL silently skip enrichment and return the unmodified instruction.

#### Scenario: Detection error is non-fatal
- **WHEN** `generateInstructions` is called for `design` and the proposal.md file is unreadable
- **THEN** the function SHALL return successfully with the standard instruction
- **AND** no error SHALL be thrown
