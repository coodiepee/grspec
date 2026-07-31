---
type: spec
change: add-rule-generation
created: 2026-06-11
schema: spec-driven
---
## ADDED Requirements

### Requirement: Rule generation during init

The `grspec init` command SHALL generate rule files for each selected tool, writing one rule file per rule template into each tool's native rules directory.

#### Scenario: Rules generated for selected tools

- **WHEN** `grspec init` is executed with tools selected
- **THEN** the system SHALL generate rule files for each selected tool using the tool's rule adapter
- **AND** rule files SHALL be written to the tool's native rules directory

#### Scenario: Rules generated regardless of delivery setting

- **WHEN** `grspec init` is executed with delivery set to `commands` or `skills`
- **THEN** rule files SHALL still be generated for all selected tools

#### Scenario: Rules generated regardless of profile

- **WHEN** `grspec init` is executed with any profile (minimal, standard, full, custom)
- **THEN** rule files SHALL still be generated for all selected tools

#### Scenario: Rule generation for tool without adapter

- **WHEN** generating rules for a tool that has no registered rule adapter
- **THEN** the tool SHALL be recorded in a `rulesSkipped` list
- **AND** initialization SHALL continue without error

### Requirement: Rule count in success output

The init success output SHALL include the count of generated rules alongside skill and command counts.

#### Scenario: Displaying rule count

- **WHEN** init completes with rules generated
- **THEN** the success message SHALL include the number of rules generated (e.g., "1 rule" or "2 rules")

### Requirement: Rules regenerated on update

The `grspec update` command SHALL regenerate rule files alongside skills and commands.

#### Scenario: Update regenerates rules

- **WHEN** `grspec update` is executed
- **THEN** rule files SHALL be regenerated for all configured tools
