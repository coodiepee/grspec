## REMOVED Requirements

### Requirement: Deprecation warning for tasks.md
**Reason**: Soft-deprecation period ended; `tasks.md` is no longer read.
**Migration**: Rename `tasks.md` to `plan.md` (or merge checkboxes into existing `plan.md`) before running apply/archive flows that need task progress.

## ADDED Requirements

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
