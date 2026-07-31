---
type: spec
change: standardize-agent-instructions
created: 2026-06-15
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Rule template registry

The system SHALL provide a `getRuleTemplates()` function returning all available rule templates.

#### Scenario: Default rule templates

- **WHEN** calling `getRuleTemplates()`
- **THEN** it SHALL return at least one entry with `ruleId` of `code-philosophy`

#### Scenario: Rule template content

- **WHEN** retrieving the `code-philosophy` template
- **THEN** the content `body` SHALL use DO/DO NOT structured format with code examples
- **AND** the content `body` SHALL cover all seven code standards: naming, abstraction level, abstraction timing, comments, logic justification, explicit assumptions, and simplicity
- **AND** the content `description` SHALL be a concise summary of the rule

#### Scenario: Code-philosophy rule format

- **WHEN** the `code-philosophy` rule body is rendered
- **THEN** each code standard SHALL be presented as a section with DO and DO NOT bullets
- **AND** DO bullets SHALL include ✓ code examples demonstrating correct usage
- **AND** DO NOT bullets SHALL include ✗ code examples demonstrating prohibited usage

### Requirement: Shared rule body across all tools

The body content of rules SHALL be identical across all tools.

#### Scenario: Same body across tools

- **WHEN** generating the `code-philosophy` rule for Cursor and Claude
- **THEN** both SHALL use the same `body` content
- **AND** only the frontmatter, file path, and extension SHALL differ

#### Scenario: DO/DO NOT format preserved across adapters

- **WHEN** the `code-philosophy` rule body contains DO/DO NOT bullets with ✓/✗ markers
- **THEN** all tool adapters SHALL preserve this formatting unchanged in the generated file
