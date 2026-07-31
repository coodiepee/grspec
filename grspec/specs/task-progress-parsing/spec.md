# task-progress-parsing Specification

## Purpose
Specify the deprecation path for `tasks.md` in favor of `plan.md`, including warning behavior and skill template migration.
## Requirements

### Requirement: Skill templates reference plan.md
All skill template strings in `src/core/templates/workflows/*.ts` that reference `tasks.md` SHALL be updated to reference `plan.md` instead.

#### Scenario: Skill template content uses plan.md
- **WHEN** the `getApplyChangeSkillTemplate` function returns its instruction text
- **THEN** the text SHALL reference `plan.md` for task tracking
- **AND** the text SHALL NOT contain the string `tasks.md`

#### Scenario: All workflow skill templates updated
- **WHEN** all files in `src/core/templates/workflows/` are searched for the string `tasks.md`
- **THEN** zero matches SHALL be found

### Requirement: plan.md is the only task progress source

`getTaskProgressForChange` and `getIncompleteItemsForChange` SHALL read task checkboxes only from `plan.md` in the change directory.

#### Scenario: plan.md present
- **WHEN** progress is requested for a change that has `plan.md`
- **THEN** the system SHALL parse checkboxes from `plan.md` only

#### Scenario: tasks.md present without plan.md
- **WHEN** progress is requested for a change that has `tasks.md` but not `plan.md`
- **THEN** the system SHALL treat the change as having no task progress file for parsing purposes
- **AND** the system SHALL NOT read `tasks.md`

#### Scenario: both files present
- **WHEN** progress is requested for a change that has both `tasks.md` and `plan.md`
- **THEN** the system SHALL read `plan.md` only
- **AND** the system SHALL ignore `tasks.md`
