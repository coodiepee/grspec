## ADDED Requirements

### Requirement: Design-system context file discovery
During `generateApplyInstructions`, after building `contextFiles` from schema artifact outputs, the system SHALL scan the change directory for `design-system/MASTER.md`. If found, the system SHALL add all `.md` files in the `design-system/` directory to `contextFiles` under the key `design-system`.

#### Scenario: Design-system directory with MASTER.md
- **WHEN** `generateApplyInstructions` is called for a change that has `design-system/MASTER.md`
- **THEN** `contextFiles` SHALL contain a `design-system` key
- **AND** the value SHALL include the path to `MASTER.md`

#### Scenario: Design-system directory with page overrides
- **WHEN** `generateApplyInstructions` is called for a change that has `design-system/MASTER.md` and `design-system/landing.md`
- **THEN** `contextFiles['design-system']` SHALL include paths to both `MASTER.md` and `landing.md`

#### Scenario: No design-system directory
- **WHEN** `generateApplyInstructions` is called for a change without a `design-system/` directory
- **THEN** `contextFiles` SHALL NOT contain a `design-system` key

#### Scenario: Design-system directory without MASTER.md
- **WHEN** the change directory has a `design-system/` directory but no `MASTER.md` inside it
- **THEN** `contextFiles` SHALL NOT contain a `design-system` key

### Requirement: Apply instruction includes UI guidance when design-system present
When design-system context files are discovered, the apply instruction SHALL append a note reminding the agent to reference the design-system artifacts for color tokens, typography, and component specifications.

#### Scenario: UI guidance in apply instruction
- **WHEN** `generateApplyInstructions` produces instructions with `design-system` in `contextFiles`
- **THEN** the `instruction` field SHALL contain text referencing the design-system for implementation guidance

#### Scenario: No UI guidance without design-system
- **WHEN** `generateApplyInstructions` produces instructions without `design-system` in `contextFiles`
- **THEN** the `instruction` field SHALL NOT contain design-system references
