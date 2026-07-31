# ui-reference-viewer Specification

## Purpose
Provide full design-system specifications for any of the 67+ available styles including tokens, component patterns, and code examples.
## Requirements
### Requirement: View complete style specification
The system SHALL display the full design-system specification for a named style when the user runs `grspec ui reference "<style>"`. The specification includes design philosophy, key characteristics, component stylings, color tokens, typography scale, and code examples.

#### Scenario: View specific style
- **WHEN** user runs `grspec ui reference "Glassmorphism"`
- **THEN** the system displays the complete design specification for Glassmorphism from `design.csv`, including all sections (philosophy, characteristics, components, code)

#### Scenario: Case-insensitive style matching
- **WHEN** user runs `grspec ui reference "bauhaus"` (lowercase)
- **THEN** the system matches "Bauhaus" from the data and displays its specification

#### Scenario: Style not found
- **WHEN** user runs `grspec ui reference "NonExistentStyle"`
- **THEN** the system displays an error with a suggestion to use `--list` to see available styles

### Requirement: List available styles
The system SHALL list all available style names when the user passes `--list`.

#### Scenario: List all styles
- **WHEN** user runs `grspec ui reference --list`
- **THEN** the system displays all style names (matching the Style Category column from `styles.csv`) that have entries in `design.csv`

### Requirement: Search style specifications
The system SHALL support `--search` to find relevant styles by keyword using BM25 over the full specification text.

#### Scenario: Search by keyword
- **WHEN** user runs `grspec ui reference --search "dark mode dashboard"`
- **THEN** the system returns the top 3 style names most relevant to the query with a brief excerpt

### Requirement: Section filtering
The system SHALL support `--section` to display only a specific section of the specification.

#### Scenario: View only components section
- **WHEN** user runs `grspec ui reference "Minimalism" --section components`
- **THEN** only the Component Stylings portion of the Minimalism spec is displayed

### Requirement: JSON output
The system SHALL support `--json` for structured output.

#### Scenario: JSON output
- **WHEN** user runs `grspec ui reference "Neumorphism" --json`
- **THEN** the output is a valid JSON object with `style`, `philosophy`, `characteristics`, `components`, `fullText` fields

