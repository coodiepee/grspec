## ADDED Requirements

### Requirement: Plan artifact in spec-driven schema
The spec-driven schema SHALL define a `plan` artifact whose `requires` field lists `design` and `specs` (in that logical dependency order as specified by the schema).

#### Scenario: Schema declares plan with correct prerequisites
- **WHEN** tooling loads the spec-driven artifact schema for a grspec project
- **THEN** the schema SHALL include a `plan` artifact definition
- **AND** the `plan` artifact SHALL declare `requires: [design, specs]` (or equivalent normalized representation)

### Requirement: Apply phase depends on plan
The apply phase SHALL require completion of the `plan` artifact instead of requiring the `tasks` artifact directly, such that apply proceeds only after a plan exists and satisfies schema rules.

#### Scenario: Apply blocked without plan
- **WHEN** the user attempts the apply phase
- **AND** the `plan` artifact is incomplete or missing per schema
- **THEN** grspec SHALL not treat apply as eligible for execution
- **AND** SHALL surface guidance to complete or create the plan artifact

#### Scenario: Apply allowed with satisfied plan prerequisite
- **WHEN** the user attempts the apply phase
- **AND** prerequisites through `plan` (including `design` and `specs` per schema) are satisfied
- **THEN** apply SHALL proceed according to standard workflow rules

### Requirement: Plan artifact template
The `plan` artifact SHALL provide a `plan.md` template that supports checkbox-based task tracking and allows per-task annotations for strategy, bounded context, and verification expectations.

#### Scenario: Init or template emission includes structured plan.md
- **WHEN** grspec generates the plan artifact template for a change or project
- **THEN** the template file SHALL be named `plan.md` or mapped to that template id per conventions
- **AND** the template SHALL support checkbox items for tasks
- **AND** each task or checklist item SHALL accommodate strategy, bounded-context, and verification annotations

### Requirement: Plan status in grspec status
The `grspec status` command SHALL display completion status for the plan artifact alongside other tracked artifacts.

#### Scenario: Status output includes plan row or section
- **WHEN** the user runs `grspec status` in a project that uses the plan artifact
- **THEN** the output SHALL include plan artifact completion status
- **AND** SHALL be consistent with how other primary artifacts are reported

### Requirement: Plan instructions command
The `grspec instructions plan` command SHALL print enriched, actionable instructions for creating or completing the plan artifact, including how it relates to design, specs, and apply.

#### Scenario: Instructions plan emits enriched guidance
- **WHEN** the user runs `grspec instructions plan`
- **THEN** grspec SHALL output instructions for producing the plan artifact
- **AND** the instructions SHALL reference relationships to `design` and `specs` and expectations for apply
- **AND** SHALL be suitable for human or agent use without requiring undocumented tribal knowledge
