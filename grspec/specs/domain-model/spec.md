# domain-model Specification

## Purpose
Define domain model template generation behavior for `grspec init --track`, including full templates for new projects and reverse-engineering skeletons for existing projects, plus validation when bounded contexts are referenced.

## Requirements
### Requirement: Domain model template generation for new projects
When the user runs `grspec init --track new-project`, the init command SHALL generate a `grspec/domain-model.md` file containing all of the following sections: Bounded Contexts, Core Entities, and Context Map.

#### Scenario: New project track emits full domain model template
- **WHEN** the user runs `grspec init --track new-project`
- **THEN** grspec SHALL create `grspec/domain-model.md`
- **AND** the file SHALL include a Bounded Contexts section
- **AND** SHALL include a Core Entities section
- **AND** SHALL include a Context Map section

### Requirement: Domain model skeleton for existing projects
When the user runs `grspec init --track existing-project`, the init command SHALL generate a `grspec/domain-model.md` skeleton that includes reverse-engineering guidance prompts for deriving bounded contexts, entities, and relationships from an existing system.

#### Scenario: Existing project track emits domain model skeleton with guidance
- **WHEN** the user runs `grspec init --track existing-project`
- **THEN** grspec SHALL create `grspec/domain-model.md` as a skeleton
- **AND** the skeleton SHALL include prompts or guidance for reverse-engineering domain structure from existing code and documentation

### Requirement: Domain model presence validation when bounded contexts are referenced
When change metadata references bounded contexts, grspec SHALL validate that `grspec/domain-model.md` exists (or the configured domain-model path) before allowing operations that rely on that linkage.

#### Scenario: Missing domain model blocks changes that reference bounded contexts
- **WHEN** a change or its metadata references bounded-contexts
- **AND** `grspec/domain-model.md` is absent
- **THEN** grspec SHALL fail validation with a clear error
- **AND** SHALL require creation or restoration of the domain model artifact

#### Scenario: Present domain model passes bounded-context reference check
- **WHEN** change metadata references bounded-contexts
- **AND** `grspec/domain-model.md` exists
- **THEN** validation SHALL succeed for domain model presence
- **AND** subsequent validation or workflow steps MAY proceed per other rules
