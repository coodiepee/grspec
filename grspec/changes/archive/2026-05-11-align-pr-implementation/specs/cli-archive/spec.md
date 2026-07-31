# cli-archive Specification (Delta)

## MODIFIED Requirements

### Requirement: Task Completion Check

The command SHALL verify task completion status before archiving to prevent premature archival. When a `plan.md` file exists, the command SHALL check plan checkbox completion in addition to `tasks.md` completion.

#### Scenario: Incomplete tasks found

- **WHEN** incomplete tasks are found (marked with `- [ ]`) in either `tasks.md` or `plan.md`
- **THEN** display all incomplete tasks to the user
- **AND** SHALL NOT proceed with archiving by default
- **AND** SHALL suggest using `--force` to override

#### Scenario: All tasks complete

- **WHEN** all tasks are complete in both `tasks.md` (if present) and `plan.md` (if present), OR neither file exists
- **THEN** proceed with archiving without prompting

#### Scenario: Force flag overrides incomplete check

- **WHEN** the user runs `grspec archive <change> --force`
- **AND** incomplete items exist in `plan.md` or `tasks.md`
- **THEN** display a warning listing all incomplete items
- **AND** proceed with the archive flow
