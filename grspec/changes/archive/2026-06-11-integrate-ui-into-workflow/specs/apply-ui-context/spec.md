---
type: spec
change: integrate-ui-into-workflow
created: 2026-06-11
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Apply instruction includes UI guidance when design-system present
When design-system context files are discovered, the apply instruction SHALL append a note reminding the agent to reference the design-system artifacts for color tokens, typography, and component specifications.

Additionally, when `ui-detected` is set to `true` in the change's `.grspec.yaml`, the instruction SHALL embed the text of all CRITICAL-severity rules from the rules database inline, rather than only suggesting the `grspec ui rules` command.

#### Scenario: CRITICAL rules embedded when ui-detected is true
- **WHEN** `generateApplyInstructions` produces instructions for a change with `ui-detected: true` in `.grspec.yaml`
- **AND** the apply state is `ready`
- **THEN** the `instruction` field SHALL contain the inline text of all CRITICAL-severity UI rules
- **AND** SHALL recommend running `grspec ui review <path>` after implementation

#### Scenario: Design-system guidance with inline rules
- **WHEN** `generateApplyInstructions` produces instructions with `design-system` in `contextFiles`
- **AND** `ui-detected` is `true`
- **THEN** the `instruction` field SHALL contain both design-system references and inline CRITICAL rules

#### Scenario: Design-system present but ui-detected not set
- **WHEN** `generateApplyInstructions` produces instructions with `design-system` in `contextFiles`
- **AND** `ui-detected` is NOT set in `.grspec.yaml`
- **THEN** the `instruction` field SHALL contain design-system references
- **AND** SHALL suggest the `grspec ui rules` command (existing behavior)
- **AND** SHALL NOT embed inline rules

#### Scenario: No design-system and no ui-detected
- **WHEN** `generateApplyInstructions` produces instructions without `design-system` in `contextFiles`
- **AND** `ui-detected` is not set
- **THEN** the `instruction` field SHALL NOT contain design-system, rules, or review references

### Requirement: Design-system context file discovery
During `generateApplyInstructions`, after building `contextFiles` from schema artifact outputs, the system SHALL scan the change directory for `design-system/MASTER.md`. If found, the system SHALL add all `.md` files in the `design-system/` directory to `contextFiles` under the key `design-system`.

#### Scenario: Design-system directory with MASTER.md
- **WHEN** `generateApplyInstructions` is called for a change that has `design-system/MASTER.md`
- **THEN** `contextFiles` SHALL contain a `design-system` key
- **AND** the value SHALL include the path to `MASTER.md`

#### Scenario: No design-system directory
- **WHEN** `generateApplyInstructions` is called for a change without a `design-system/` directory
- **THEN** `contextFiles` SHALL NOT contain a `design-system` key
