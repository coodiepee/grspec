---
type: spec
change: expand-ui-subcmd-system
created: 2026-06-05
schema: spec-driven
---
## ADDED Requirements

### Requirement: Rules listing by category
The system SHALL display UI/UX rules organized by category when the user runs `grspec ui rules [category]`. Without a category argument, the system SHALL list all available categories with their severity and rule count.

#### Scenario: List all categories
- **WHEN** user runs `grspec ui rules` with no arguments
- **THEN** the system displays all 10 rule categories with severity level and rule count per category

#### Scenario: Query specific category
- **WHEN** user runs `grspec ui rules accessibility`
- **THEN** the system displays all rules in the Accessibility category with RuleID, Platform scope, Short description, Do, and Don't fields

#### Scenario: Case-insensitive category matching
- **WHEN** user runs `grspec ui rules "Touch & Interaction"` or `grspec ui rules "touch"`
- **THEN** the system matches the category case-insensitively and displays matching rules

### Requirement: Platform filtering
The system SHALL support a `--platform` flag that filters rules to only show those applicable to the specified platform context.

#### Scenario: Filter by app platform
- **WHEN** user runs `grspec ui rules --platform app`
- **THEN** only rules with Platform value "App" or "Both" are displayed

#### Scenario: Filter by web platform
- **WHEN** user runs `grspec ui rules --platform web`
- **THEN** only rules with Platform value "Web" or "Both" are displayed

#### Scenario: Combine category and platform
- **WHEN** user runs `grspec ui rules animation --platform app`
- **THEN** only Animation rules applicable to App or Both platforms are displayed

### Requirement: Severity filtering
The system SHALL support a `--severity` flag accepting comma-separated severity levels.

#### Scenario: Single severity filter
- **WHEN** user runs `grspec ui rules --severity critical`
- **THEN** only rules with Severity "Critical" are displayed across all categories

#### Scenario: Multiple severity filter
- **WHEN** user runs `grspec ui rules --severity critical,high`
- **THEN** rules with Severity "Critical" or "High" are displayed

### Requirement: Keyword search within rules
The system SHALL support a `--search` flag that performs BM25 search across rule Short, Do, and Don't fields.

#### Scenario: Search for specific concern
- **WHEN** user runs `grspec ui rules --search "touch target"`
- **THEN** the system returns rules where "touch target" is most relevant, ranked by BM25 score

### Requirement: Checklist output format
The system SHALL support a `--checklist` flag that outputs rules as a Markdown checkbox list suitable for copy-paste into documentation or PRs.

#### Scenario: Checklist output
- **WHEN** user runs `grspec ui rules accessibility --checklist`
- **THEN** the output is formatted as `- [ ] <Short description> [Platform]` for each rule

### Requirement: JSON output
The system SHALL support `--json` flag for machine-readable output.

#### Scenario: JSON output
- **WHEN** user runs `grspec ui rules accessibility --json`
- **THEN** the output is a valid JSON array of rule objects with all fields
