## ADDED Requirements

### Requirement: Structured conventions for specs and changes

grspec conventions SHALL mandate a structured spec format with clear requirement and scenario sections so tooling can parse consistently.

#### Scenario: Following the structured spec format
- **WHEN** writing or updating grspec specifications
- **THEN** authors SHALL use `### Requirement: ...` followed by at least one `#### Scenario: ...` section

### Requirement: Behavior-First Specification Boundary

grspec specifications SHALL capture verifiable behavior contracts and avoid internal implementation detail.

#### Scenario: Writing behavior requirements
- **WHEN** documenting a capability in `spec.md`
- **THEN** requirements SHALL describe observable behavior with SHALL/MUST language
- **AND** SHALL NOT prescribe internal module layout unless that layout is itself the product contract

### Requirement: Project directory structure

A grspec project SHALL maintain a consistent directory structure for specifications and changes.

#### Scenario: Initialized project layout
- **WHEN** a grspec project is initialized
- **THEN** it SHALL provide a `grspec/` directory containing at least `specs/` and `changes/`

### Requirement: Verb-first CLI design

grspec CLI design SHALL use verbs as top-level commands with nouns provided as arguments or flags for scoping.

#### Scenario: Verb-first listing and validation
- **WHEN** a user runs commands such as `grspec list` or `grspec validate --changes`
- **THEN** those verb-first forms SHALL be the supported primary interface for list/show/validate

#### Scenario: Retired duplicate noun commands
- **WHEN** documenting or shipping the supported CLI surface
- **THEN** duplicate `grspec change show|list|validate` and the `grspec spec` tree SHALL NOT be part of the supported surface
- **AND** stacking helpers under `grspec change` (`overlap`, `graph`, `next`, `split`) MAY remain until promoted to verb-first homes
