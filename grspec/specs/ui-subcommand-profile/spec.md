# ui-subcommand-profile Specification

## Purpose
Define UI workflow packaging as subcommand skills/commands without a hub skill.
## Requirements
### Requirement: Hub skill and command removed
The system SHALL NOT register `grspec-ui` skill or `grsx-ui` slash command. `src/core/templates/content/ui.md` hub router SHALL NOT exist.

#### Scenario: Skill generation excludes hub
- **WHEN** `getSkillTemplates()` returns all registered skills
- **THEN** the list SHALL NOT include a template with `name: grspec-ui`

#### Scenario: Command generation excludes hub
- **WHEN** `getCommandTemplates()` returns all registered commands
- **THEN** the list SHALL NOT include a template with `name: grsx-ui`

### Requirement: UI workflow maps to all subcommand skills
When profile workflow `ui` is enabled, the system SHALL install all ten `grspec-ui-*` skill directories:

`grspec-ui-init`, `grspec-ui-search`, `grspec-ui-design-system`, `grspec-ui-rules`, `grspec-ui-reference`, `grspec-ui-review`, `grspec-ui-status`, `grspec-ui-detect`, `grspec-ui-install`, `grspec-ui-sync`.

#### Scenario: Profile ui installs all sub-skills
- **WHEN** user runs `grspec update` with standard profile including workflow `ui`
- **THEN** all ten `grspec-ui-*` skill directories SHALL be present under the tool skills folder

### Requirement: WORKFLOW_TO_SKILL_DIRS for multi-skill workflows
The system SHALL define `WORKFLOW_TO_SKILL_DIRS: Partial<Record<WorkflowId, readonly string[]>>` with `ui` mapping to all UI subcommand skill directory names.

Profile sync drift, update, init, and migration SHALL iterate every directory in `WORKFLOW_TO_SKILL_DIRS[workflow]` when checking install state for that workflow.

#### Scenario: Drift detected when one sub-skill missing
- **WHEN** profile includes workflow `ui`
- **AND** `grspec-ui-init` skill exists but `grspec-ui-review` is missing
- **THEN** `hasToolProfileOrDeliveryDrift` SHALL return true for that tool

#### Scenario: Drift detected when hub skill present after update
- **WHEN** profile includes workflow `ui`
- **AND** legacy `grspec-ui` skill directory still exists on disk
- **THEN** profile sync SHALL report drift and remove the hub on next sync

### Requirement: WORKFLOW_TO_COMMAND_IDS lists all UI subcommands
`WORKFLOW_TO_COMMAND_IDS['ui']` SHALL list all ten UI command ids (`ui-init` through `ui-sync`). `COMMAND_IDS` and `SKILL_NAMES` registries SHALL NOT include hub `ui` / `grspec-ui` entries.

#### Scenario: Command drift checks all UI commands
- **WHEN** profile includes workflow `ui`
- **AND** `grsx-ui-init` exists but `grsx-ui-review` is missing
- **THEN** profile command drift detection SHALL return true

