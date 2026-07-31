---
type: spec
change: expand-ui-subcmd-system
created: 2026-06-05
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Apply instruction includes UI guidance when design-system present
When design-system context files are discovered, the apply instruction SHALL append a note reminding the agent to reference the design-system artifacts for color tokens, typography, and component specifications. Additionally, when UI content is detected, the instruction SHALL recommend running `grspec ui rules --severity critical,high --checklist` before implementation to surface binding UX constraints.

#### Scenario: UI guidance in apply instruction
- **WHEN** `generateApplyInstructions` produces instructions with `design-system` in `contextFiles`
- **THEN** the `instruction` field SHALL contain text referencing the design-system for implementation guidance

#### Scenario: Rules recommendation in apply instruction
- **WHEN** `generateApplyInstructions` produces instructions with `design-system` in `contextFiles` and the task state is "ready"
- **THEN** the `instruction` field SHALL also contain a recommendation to run `grspec ui rules --severity critical,high --platform <detected>` for binding UX constraints

#### Scenario: No UI guidance without design-system
- **WHEN** `generateApplyInstructions` produces instructions without `design-system` in `contextFiles`
- **THEN** the `instruction` field SHALL NOT contain design-system or rules references
