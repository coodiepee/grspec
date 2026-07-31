# cli-show Specification

## Purpose
Define top-level `grspec show` behavior for interactive and direct display of change and spec content.

## Requirements
### Requirement: Top-level show command

The CLI SHALL provide a top-level `show` command for displaying changes and specs with intelligent selection.

#### Scenario: Interactive show selection

- **WHEN** executing `grspec show` without arguments
- **THEN** prompt user to select type (change or spec)
- **AND** display list of available items for selected type
- **AND** show the selected item's content

#### Scenario: Non-interactive environments do not prompt

- **GIVEN** stdin is not a TTY or `--no-interactive` is provided or environment variable `GRSPEC_INTERACTIVE=0`
- **WHEN** executing `grspec show` without arguments
- **THEN** do not prompt
- **AND** print a helpful hint with examples for `grspec show <item>` or `grspec change/spec show`
- **AND** exit with code 1

#### Scenario: Direct item display

- **WHEN** executing `grspec show <item-name>`
- **THEN** automatically detect if item is a change or spec
- **AND** display the item's content
- **AND** use appropriate formatting based on item type

#### Scenario: Type detection and ambiguity handling

- **WHEN** executing `grspec show <item-name>`
- **THEN** if `<item-name>` uniquely matches a change or a spec, show that item
- **AND** if it matches both, print an ambiguity error and suggest `--type change|spec` or using `grspec change show`/`grspec spec show`
- **AND** if it matches neither, print not-found with nearest-match suggestions

#### Scenario: Explicit type override

- **WHEN** executing `grspec show --type change <item>`
- **THEN** treat `<item>` as a change ID and show it (skipping auto-detection)

- **WHEN** executing `grspec show --type spec <item>`
- **THEN** treat `<item>` as a spec ID and show it (skipping auto-detection)

### Requirement: Output format options

The show command SHALL support various output formats consistent with existing commands.

#### Scenario: JSON output

- **WHEN** executing `grspec show <item> --json`
- **THEN** output the item in JSON format
- **AND** include parsed metadata and structure
- **AND** maintain format consistency with existing change/spec show commands

#### Scenario: Flag scoping and delegation

- **WHEN** showing a change or a spec via the top-level command
- **THEN** accept common flags such as `--json`
- **AND** pass through type-specific flags to the corresponding implementation
  - Change-only flags: `--deltas-only` (alias `--requirements-only` deprecated)
  - Spec-only flags: `--requirements`, `--no-scenarios`, `-r/--requirement`
- **AND** ignore irrelevant flags for the detected type with a warning

### Requirement: Interactivity controls

- The CLI SHALL respect `--no-interactive` to disable prompts.
- The CLI SHALL respect `GRSPEC_INTERACTIVE=0` to disable prompts globally.
- Interactive prompts SHALL only be shown when stdin is a TTY and interactivity is not disabled.

#### Scenario: Change-specific options

- **WHEN** showing a change with `grspec show <change-name> --deltas-only`
- **THEN** display only the deltas in JSON format
- **AND** maintain compatibility with existing change show options

#### Scenario: Spec-specific options  

- **WHEN** showing a spec with `grspec show <spec-id> --requirements`
- **THEN** display only requirements in JSON format
- **AND** support other spec options (--no-scenarios, -r)
- **AND** maintain compatibility with existing spec show options

