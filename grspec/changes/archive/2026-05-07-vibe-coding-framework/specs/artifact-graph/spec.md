# artifact-graph (delta)

## ADDED Requirements

### Requirement: Plan artifact status tracking

The artifact graph SHALL track `plan` artifact lifecycle status using the same status vocabulary as other tracked artifacts, including at minimum `pending`, `done`, and `blocked` states as applicable to the implementation.

#### Scenario: Plan appears in graph state

- **WHEN** a loaded schema defines a `plan` artifact
- **THEN** graph queries SHALL include `plan` in status and readiness calculations
- **AND** `plan` SHALL report `blocked` while required upstream artifacts remain incomplete

#### Scenario: Plan completion marks done

- **WHEN** completion rules for `plan` are satisfied per schema and filesystem checks
- **THEN** the artifact graph SHALL mark `plan` as `done`

### Requirement: Plan checklist completion for apply readiness

The artifact graph SHALL derive `plan` completion in part from `plan.md` checkbox completion using the same mechanism currently used to track `tasks.md` checkbox completion for task readiness.

#### Scenario: Incomplete plan checklists block plan artifact

- **WHEN** `plan.md` exists and contains incomplete checklist items (e.g., `- [ ]`)
- **THEN** the `plan` artifact SHALL NOT be treated as complete

#### Scenario: Complete plan checklists satisfy plan artifact

- **WHEN** `plan.md` exists and every checklist item is marked complete (e.g., `- [x]`) using the same checkbox patterns as `tasks.md` tracking
- **THEN** the `plan` artifact SHALL be eligible for `done` status according to the schema's completion rules
