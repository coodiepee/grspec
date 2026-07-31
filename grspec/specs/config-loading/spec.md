# config-loading Specification

## Purpose
Define how `grspec/grspec.yaml` is discovered, parsed, validated, and exposed to callers with safe fallbacks.
## Requirements
### Requirement: Load project config from grspec/grspec.yaml

The system SHALL read and parse the project configuration file located at `grspec/grspec.yaml` relative to the project root.

#### Scenario: Valid config file exists
- **WHEN** `grspec/grspec.yaml` exists with valid YAML content
- **THEN** system parses the file and returns a ProjectConfig object

#### Scenario: Config file does not exist
- **WHEN** `grspec/grspec.yaml` does not exist
- **THEN** system returns null without error

#### Scenario: Config file has invalid YAML syntax
- **WHEN** `grspec/grspec.yaml` contains malformed YAML
- **THEN** system logs a warning message and returns null

#### Scenario: Config file has valid YAML but invalid schema
- **WHEN** `grspec/grspec.yaml` contains valid YAML that fails Zod schema validation
- **THEN** system logs a warning message with validation details and returns null

### Requirement: Support .yml file extension alias

The system SHALL accept both `.yaml` and `.yml` file extensions for the config file.

#### Scenario: Config file uses .yml extension
- **WHEN** `grspec/grspec.yml` exists and `grspec/grspec.yaml` does not exist
- **THEN** system reads from `grspec/grspec.yml`

#### Scenario: Both .yaml and .yml exist
- **WHEN** both `grspec/grspec.yaml` and `grspec/grspec.yml` exist
- **THEN** system prefers `grspec/grspec.yaml`

### Requirement: Use resilient field-by-field parsing

The system SHALL parse each config field independently, collecting valid fields and warning about invalid ones without rejecting the entire config.

#### Scenario: Schema field is valid
- **WHEN** config contains `schema: "spec-driven"`
- **THEN** schema field is included in returned config

#### Scenario: Schema field is missing
- **WHEN** config lacks the `schema` field
- **THEN** no warning is logged (field is optional at parse level)

#### Scenario: Schema field is empty string
- **WHEN** config contains `schema: ""`
- **THEN** warning is logged and schema field is not included in returned config

#### Scenario: Schema field is invalid type
- **WHEN** config contains `schema: 123` (number instead of string)
- **THEN** warning is logged and schema field is not included in returned config

#### Scenario: Context field is valid
- **WHEN** config contains `context: "Tech stack: TypeScript"`
- **THEN** context field is included in returned config

#### Scenario: Context field is invalid type
- **WHEN** config contains `context: 123` (number instead of string)
- **THEN** warning is logged and context field is not included in returned config

#### Scenario: Rules field has valid structure
- **WHEN** config contains `rules: { proposal: ["Rule 1"], specs: ["Rule 2"] }`
- **THEN** rules field is included in returned config with valid rules

#### Scenario: Rules field has non-array value for artifact
- **WHEN** config contains `rules: { proposal: "not an array", specs: ["Valid"] }`
- **THEN** warning is logged for proposal, but specs rules are still included in returned config

#### Scenario: Rules array contains non-string elements
- **WHEN** config contains `rules: { proposal: ["Valid rule", 123, ""] }`
- **THEN** only "Valid rule" is included, warning logged about invalid elements

#### Scenario: Mix of valid and invalid fields
- **WHEN** config contains valid schema, invalid context type, valid rules
- **THEN** config is returned with schema and rules fields, warning logged about context

### Requirement: Enforce context size limit

The system SHALL reject context fields exceeding 50KB and log a warning.

#### Scenario: Context within size limit
- **WHEN** config contains context of 1KB
- **THEN** context is included in returned config

#### Scenario: Context at size limit
- **WHEN** config contains context of exactly 50KB
- **THEN** context is included in returned config

#### Scenario: Context exceeds size limit
- **WHEN** config contains context of 51KB
- **THEN** warning is logged with size and limit, context field is not included in returned config

### Requirement: Defer artifact ID validation to instruction loading

The system SHALL NOT validate artifact IDs in rules during config load time. Validation happens during instruction loading when schema is known.

#### Scenario: Config with rules is loaded
- **WHEN** config contains `rules: { unknownartifact: [...] }`
- **THEN** config is loaded successfully without validation errors

#### Scenario: Validation happens at instruction load time
- **WHEN** instructions are loaded for any artifact and config has unknown artifact IDs in rules
- **THEN** warnings are emitted about unknown artifact IDs (see rules-injection spec for details)

### Requirement: Gracefully handle config errors without halting

The system SHALL continue operation with default values when config loading or parsing fails.

#### Scenario: Config parse failure during command execution
- **WHEN** config file has syntax errors and user runs `grspec new change`
- **THEN** command executes using default schema "spec-driven"

#### Scenario: Warning is visible to user
- **WHEN** config loading fails
- **THEN** system outputs warning message to stderr with details about the failure

### Requirement: Wiki configuration section

The config loader SHALL parse a `wiki` section from `grspec.yaml` containing wiki feature settings.

#### Scenario: Valid wiki configuration

- **WHEN** `grspec.yaml` contains a `wiki` section with valid fields
- **THEN** the config loader SHALL parse and return the wiki settings
- **AND** SHALL make them available to wiki-aware features

#### Scenario: Wiki section absent

- **WHEN** `grspec.yaml` does not contain a `wiki` section
- **THEN** the config loader SHALL treat wiki as disabled
- **AND** SHALL return default wiki settings with `enabled: false`

#### Scenario: Wiki enabled field

- **WHEN** `wiki.enabled` is `true`
- **THEN** wiki features SHALL be activated throughout the workflow
- **WHEN** `wiki.enabled` is `false` or absent
- **THEN** all wiki features SHALL be skipped

#### Scenario: Wiki categories configuration

- **WHEN** `wiki.categories` is a string array
- **THEN** the config loader SHALL use those categories as the wiki directory structure
- **WHEN** `wiki.categories` is absent
- **THEN** the config loader SHALL use the default categories: `["concepts", "entities", "sources", "comparisons"]`

#### Scenario: Auto-ingest configuration

- **WHEN** `wiki.auto-ingest` is an object with boolean fields `on-propose`, `on-apply`, `on-archive`
- **THEN** the config loader SHALL parse each field to control automatic wiki ingest triggers
- **WHEN** `wiki.auto-ingest` is absent
- **THEN** the config loader SHALL use defaults: `on-propose: true`, `on-apply: false`, `on-archive: true`

#### Scenario: Lint configuration

- **WHEN** `wiki.lint` is an object with boolean fields `on-archive`, `structural`, `semantic`
- **THEN** the config loader SHALL parse each field to control lint behavior
- **WHEN** `wiki.lint` is absent
- **THEN** the config loader SHALL use defaults: `on-archive: true`, `structural: true`, `semantic: true`

#### Scenario: Resilient wiki config parsing

- **WHEN** the `wiki` section contains unexpected fields or invalid types for known fields
- **THEN** the config loader SHALL warn about invalid fields
- **AND** SHALL fall back to defaults for those fields without failing the entire config load

