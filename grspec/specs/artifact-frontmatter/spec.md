# artifact-frontmatter Specification

## Purpose
Define the YAML frontmatter schema injected into artifact templates, including required fields (type, change, created, schema) and delimiter format.
## Requirements
### Requirement: Artifact frontmatter schema
The system SHALL define a YAML frontmatter schema for all artifact types with the following fields:
- `type`: one of `proposal`, `spec`, `design`, `plan` (REQUIRED)
- `change`: the kebab-case change name (REQUIRED)
- `created`: ISO-8601 date string (REQUIRED)
- `schema`: the schema name, e.g. `spec-driven` (REQUIRED)

The frontmatter block SHALL be delimited by `---` on its own line before and after the YAML content.

#### Scenario: Valid frontmatter on a proposal artifact
- **WHEN** `generateInstructions` is called for artifact ID `proposal` on change `my-feature`
- **THEN** the returned `template` field SHALL begin with a YAML frontmatter block containing `type: proposal`, `change: my-feature`, `created: <current-date>`, and `schema: spec-driven`
- **AND** the original template content SHALL follow after the closing `---` delimiter

#### Scenario: Valid frontmatter on a spec artifact
- **WHEN** `generateInstructions` is called for artifact ID `specs` on change `my-feature`
- **THEN** the returned `template` field SHALL begin with a YAML frontmatter block containing `type: spec`

#### Scenario: Valid frontmatter on a design artifact
- **WHEN** `generateInstructions` is called for artifact ID `design` on change `my-feature`
- **THEN** the returned `template` field SHALL begin with a YAML frontmatter block containing `type: design`

#### Scenario: Valid frontmatter on a plan artifact
- **WHEN** `generateInstructions` is called for artifact ID `plan` on change `my-feature`
- **THEN** the returned `template` field SHALL begin with a YAML frontmatter block containing `type: plan`

### Requirement: Frontmatter does not alter static template files
The YAML frontmatter SHALL be injected at runtime by `generateInstructions`, not stored in the static template files under `schemas/spec-driven/templates/`.

#### Scenario: Static template files remain unchanged
- **WHEN** the template file `schemas/spec-driven/templates/proposal.md` is read from disk
- **THEN** it SHALL NOT contain a YAML frontmatter block
- **AND** the file content SHALL begin with `## Why`

### Requirement: Frontmatter created date
The `created` field SHALL use the current date at instruction generation time, formatted as `YYYY-MM-DD`.

#### Scenario: Created date reflects generation time
- **WHEN** `generateInstructions` is called on 2026-05-27
- **THEN** the frontmatter `created` field SHALL be `2026-05-27`

