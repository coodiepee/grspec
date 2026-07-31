# cli-config (delta)

## ADDED Requirements

### Requirement: Extended grspec.yaml project configuration schema

The `grspec.yaml` project configuration SHALL support extended top-level sections named `knowledge`, `workflow`, `execution`, `codegen`, `collaboration`, and `bootstrap`, each of which MAY contain structured values validated according to the project configuration schema.

#### Scenario: Extended sections are recognized

- **WHEN** `grspec.yaml` includes one or more of `knowledge`, `workflow`, `execution`, `codegen`, `collaboration`, or `bootstrap`
- **THEN** configuration loading SHALL parse and expose those sections to tooling that consumes project configuration
- **AND** unknown keys outside the schema SHALL continue to follow existing validation policy for project config

#### Scenario: Extended sections may be omitted

- **WHEN** `grspec.yaml` omits any of the extended sections
- **THEN** the configuration SHALL still be valid
- **AND** omitted sections SHALL behave as empty or default per schema defaults

### Requirement: Project configuration file naming for grspec

`grspec` SHALL use `grspec.yaml` as the project configuration filename under the grspec directory root, replacing `config.yaml` as the canonical name for that file.

#### Scenario: CLI resolves grspec.yaml

- **WHEN** tooling needs project-level grspec settings from the filesystem
- **THEN** it SHALL load `grspec/grspec.yaml` when present
- **AND** documentation for project configuration SHALL refer to `grspec.yaml` as the standard filename
