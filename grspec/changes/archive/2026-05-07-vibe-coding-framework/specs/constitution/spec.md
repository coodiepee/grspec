## ADDED Requirements

### Requirement: Constitution template generation for new projects
When the user runs `grspec init --track new-project`, the init command SHALL generate a `grspec/constitution.md` file containing all of the following sections: Project Identity, Architecture Principles, Coding Standards, and Team Agreements.

#### Scenario: New project track emits full constitution template
- **WHEN** the user runs `grspec init --track new-project` in a repository where grspec is being initialized for a new project
- **THEN** grspec SHALL create `grspec/constitution.md`
- **AND** the file SHALL include a Project Identity section
- **AND** SHALL include an Architecture Principles section
- **AND** SHALL include a Coding Standards section
- **AND** SHALL include a Team Agreements section

### Requirement: Constitution skeleton for existing projects
When the user runs `grspec init --track existing-project`, the init command SHALL generate a `grspec/constitution.md` skeleton that includes reverse-engineering guidance prompts suitable for extracting an existing team’s norms into the constitution.

#### Scenario: Existing project track emits constitution skeleton with guidance
- **WHEN** the user runs `grspec init --track existing-project`
- **THEN** grspec SHALL create `grspec/constitution.md` as a skeleton
- **AND** the skeleton SHALL include prompts or guidance for reverse-engineering constitution content from the current codebase and team practices
- **AND** SHALL preserve the four logical areas (identity, architecture, coding, agreements) as fill-in or guided sections

### Requirement: Constitution presence validation for knowledge-layer features
When any knowledge-layer feature references `constitution.md`, grspec SHALL validate that `grspec/constitution.md` exists (or the configured constitution path) before proceeding with commands or workflows that depend on it.

#### Scenario: Missing constitution blocks dependent operations
- **WHEN** the user invokes a knowledge-layer capability that declares a dependency on the constitution artifact
- **AND** `grspec/constitution.md` is absent
- **THEN** grspec SHALL fail validation with a clear error
- **AND** SHALL indicate that the constitution must be created or restored

#### Scenario: Present constitution allows dependent operations
- **WHEN** the user invokes a knowledge-layer capability that references the constitution
- **AND** `grspec/constitution.md` exists
- **THEN** validation SHALL succeed for constitution presence
- **AND** the dependent command or workflow MAY proceed per other validation rules
