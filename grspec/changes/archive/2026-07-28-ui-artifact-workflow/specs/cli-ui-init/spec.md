---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## MODIFIED Requirements

### Requirement: Init subcommand generates a persisted design system
The `grspec ui init` subcommand SHALL generate a design system and persist the project foundation to flat `grspec/ui/MASTER.md`. The subcommand SHALL accept `--type <product-type>` for the product category.

#### Scenario: Basic init with product type
- **WHEN** user runs `grspec ui init --type saas`
- **THEN** the system generates a design system using "saas" as the product type query
- **AND** persists the result to `grspec/ui/MASTER.md`

#### Scenario: Init with style keywords
- **WHEN** user runs `grspec ui init --type devtool --style "minimal dark"`
- **THEN** the system assembles a query from type and style
- **AND** writes `grspec/ui/MASTER.md`

#### Scenario: Init with explicit project name
- **WHEN** user runs `grspec ui init --type saas -p "My App"`
- **THEN** the design system uses "My App" as the project name in MASTER content
- **AND** the output file path is still `grspec/ui/MASTER.md`

### Requirement: Init idempotency guard path
When `grspec/ui/MASTER.md` exists, the CLI SHALL refuse to proceed unless `--force` is provided.

#### Scenario: Refuse overwrite
- **WHEN** `grspec/ui/MASTER.md` exists
- **AND** user runs `grspec ui init --type saas` without `--force`
- **THEN** the CLI SHALL exit with an error describing the existing foundation

#### Scenario: Force overwrite
- **WHEN** user runs `grspec ui init --type saas --force` and MASTER exists
- **THEN** the CLI SHALL overwrite `grspec/ui/MASTER.md`

### Requirement: Optional rules checklist path
When `--with-rules` is passed, the rules checklist SHALL be written to `grspec/ui/RULES-CHECKLIST.md`.

#### Scenario: Rules checklist location
- **WHEN** user runs `grspec ui init --type saas --with-rules`
- **THEN** the system writes `grspec/ui/RULES-CHECKLIST.md`
