## ADDED Requirements

### Requirement: Controlled strategy tag vocabulary
The system SHALL define the following strategy tags as the canonical vocabulary for plan task annotations:
- `[codegen]` — deterministic code generation (make gen, protoc, schema compilation)
- `[TDD]` — test-driven development: write test first, then implement
- `[AI+review]` — AI generates implementation, human or AI reviews
- `[manual]` — requires manual human implementation

#### Scenario: Plan template uses canonical tags
- **WHEN** the `plan.md` template file is read
- **THEN** the strategy placeholder comment SHALL list exactly these four tags: `codegen`, `TDD`, `AI+review`, `manual`

#### Scenario: Schema instruction defines all four tags
- **WHEN** the schema instruction for the `plan` artifact is read from `schema.yaml`
- **THEN** it SHALL define each of the four strategy tags with a one-line description

### Requirement: Strategy tags are advisory
Strategy tag validation SHALL NOT be enforced at runtime in this change. Tags are standardized at the template and documentation level only.

#### Scenario: Non-standard tag does not cause error
- **WHEN** a plan.md file contains a task with an unrecognized strategy tag `[prototype]`
- **AND** `parseTasksFile` processes the file
- **THEN** the task SHALL be parsed normally without error or warning
