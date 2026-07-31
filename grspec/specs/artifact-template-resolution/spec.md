# artifact-template-resolution Specification

## Purpose
Specify how `generateInstructions` prepends YAML frontmatter to loaded templates at runtime, deriving metadata from the artifact graph and change context.
## Requirements
### Requirement: Template resolution with frontmatter injection
The `generateInstructions` function in `instruction-loader.ts` SHALL prepend YAML frontmatter to the loaded template content before returning it in the `template` field of `ArtifactInstructions`.

The frontmatter SHALL be constructed from:
- `type`: derived from the artifact's `id` field (mapping `specs` → `spec`)
- `change`: from `context.changeName`
- `created`: current date as `YYYY-MM-DD`
- `schema`: from `context.schemaName`

#### Scenario: Frontmatter prepended to template
- **WHEN** `generateInstructions` is called with `artifactId = 'design'` and `context.changeName = 'my-change'`
- **THEN** the returned `template` field SHALL start with `---\ntype: design\nchange: my-change\ncreated: <date>\nschema: spec-driven\n---\n`
- **AND** the original template content SHALL follow immediately after

#### Scenario: Spec artifact type mapping
- **WHEN** `generateInstructions` is called with `artifactId = 'specs'`
- **THEN** the frontmatter `type` field SHALL be `spec` (not `specs`)

### Requirement: Frontmatter injection is idempotent
If the loaded template already contains a YAML frontmatter block (starts with `---`), the system SHALL NOT inject a second frontmatter block.

#### Scenario: Template with existing frontmatter
- **WHEN** a custom schema template file already begins with `---`
- **AND** `generateInstructions` processes it
- **THEN** the returned `template` SHALL contain exactly one frontmatter block

