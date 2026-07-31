## ADDED Requirements

### Requirement: Product self-identification as grspec

Main specifications under `grspec/specs/` and wiki pages under `grspec/wiki/` SHALL refer to the product, project directory, and CLI as grspec (paths `grspec/`, binary `grspec`).

#### Scenario: Main spec CLI examples use grspec
- **WHEN** a main spec describes running the CLI
- **THEN** examples SHALL use `grspec` (not `openspec`)
- **AND** project paths SHALL use `grspec/` (not `openspec/`)

#### Scenario: Wiki concept pages match product name
- **WHEN** a wiki page describes product behavior or conventions
- **THEN** it SHALL name the product grspec unless the page is documenting historical evolution or a third-party project

### Requirement: Permitted OpenSpec mentions

The following OpenSpec mentions SHALL remain allowed and SHALL NOT be rewritten away solely for branding:

- README (or equivalent) acknowledgments crediting OpenSpec as evolutionary upstream
- References to third-party repository or package names that literally contain `openspec`
- Content under `grspec/changes/archive/` (historical snapshots)

#### Scenario: Upstream acknowledgment preserved
- **WHEN** the project README documents provenance
- **THEN** it MAY credit OpenSpec as the upstream project
- **AND** that credit SHALL NOT be treated as a product-identity defect

#### Scenario: Archive snapshots untouched by rename pass
- **WHEN** performing the identity rename pass
- **THEN** files under `grspec/changes/archive/` SHALL NOT be rewritten for OpenSpec→grspec branding
