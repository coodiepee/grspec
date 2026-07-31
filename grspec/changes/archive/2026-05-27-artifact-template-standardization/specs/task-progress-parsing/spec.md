## ADDED Requirements

### Requirement: Deprecation warning for tasks.md
When `getTaskProgressForChange` or `getIncompleteItemsForChange` encounters a `tasks.md` file in a change directory where `plan.md` does not exist, the system SHALL emit a deprecation warning via `console.warn`.

The warning message SHALL include:
- The change name
- Guidance to rename `tasks.md` to `plan.md`
- A note that `tasks.md` support will be removed in a future release

#### Scenario: tasks.md found without plan.md
- **WHEN** `getTaskProgressForChange` is called for a change that has `tasks.md` but not `plan.md`
- **THEN** the system SHALL emit a `console.warn` containing the text "tasks.md is deprecated"
- **AND** the system SHALL still read and return task progress from `tasks.md`

#### Scenario: Both tasks.md and plan.md present
- **WHEN** `getTaskProgressForChange` is called for a change that has both `tasks.md` and `plan.md`
- **THEN** the system SHALL emit a `console.warn` recommending removal of `tasks.md`
- **AND** the system SHALL aggregate tasks from both files (existing behavior preserved)

#### Scenario: Only plan.md present
- **WHEN** `getTaskProgressForChange` is called for a change that has `plan.md` but not `tasks.md`
- **THEN** the system SHALL NOT emit any deprecation warning
- **AND** task progress SHALL be read from `plan.md` only

### Requirement: Skill templates reference plan.md
All skill template strings in `src/core/templates/workflows/*.ts` that reference `tasks.md` SHALL be updated to reference `plan.md` instead.

#### Scenario: Skill template content uses plan.md
- **WHEN** the `getApplyChangeSkillTemplate` function returns its instruction text
- **THEN** the text SHALL reference `plan.md` for task tracking
- **AND** the text SHALL NOT contain the string `tasks.md`

#### Scenario: All workflow skill templates updated
- **WHEN** all files in `src/core/templates/workflows/` are searched for the string `tasks.md`
- **THEN** zero matches SHALL be found
