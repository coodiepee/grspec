## ADDED Requirements

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