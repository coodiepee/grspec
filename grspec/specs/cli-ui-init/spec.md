# cli-ui-init Specification

## Purpose
Provide a `grspec ui init` CLI subcommand that auto-detects project stack and name, accepts structured design system parameters, generates and persists a design system, and optionally creates a rules checklist — with idempotency guard against accidental overwrites.
## Requirements
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

### Requirement: Init auto-detects project name from package.json
When `--project` is not provided, the CLI SHALL read the `name` field from `package.json` in the current working directory and use it as the project name.

#### Scenario: Auto-detect project name
- **WHEN** user runs `grspec ui init --type saas` in a directory with `package.json` containing `"name": "my-tool"`
- **THEN** the design system uses "my-tool" as the project name

#### Scenario: No package.json available
- **WHEN** user runs `grspec ui init --type saas` in a directory without `package.json`
- **THEN** the system uses the product type as a fallback project name

### Requirement: Init auto-detects stack from dependencies
The CLI SHALL detect the technology stack by inspecting `dependencies` and `devDependencies` in `package.json`, matching package names against the known stacks list. The detected stack is appended to the design system query for better-targeted recommendations.

#### Scenario: React detected in dependencies
- **WHEN** `package.json` has `"react"` in dependencies
- **THEN** the system includes "react" in the design system query

#### Scenario: Multiple frameworks detected
- **WHEN** `package.json` has both `"next"` and `"react"` in dependencies
- **THEN** the system uses the more specific framework ("nextjs") in the query

#### Scenario: No recognized stack in dependencies
- **WHEN** `package.json` dependencies contain no recognized stack packages
- **THEN** the system generates the design system without a stack qualifier

### Requirement: Init generates page overrides
The `--page` option SHALL generate a page-specific override file alongside the master design system.

#### Scenario: Init with page override
- **WHEN** user runs `grspec ui init --type saas --page dashboard`
- **THEN** the system creates both `MASTER.md` and `pages/dashboard.md`

### Requirement: Init supports custom output directory
The `--output` option SHALL redirect the design system output to a specified directory instead of the default `grspec/` directory.

#### Scenario: Custom output directory
- **WHEN** user runs `grspec ui init --type saas -o ./my-project`
- **THEN** the design system is persisted to `./my-project/design-system/<slug>/MASTER.md`

### Requirement: Init supports JSON output
The `--json` flag SHALL output the generated design system and detection metadata as structured JSON instead of human-readable text.

#### Scenario: JSON output
- **WHEN** user runs `grspec ui init --type saas --json`
- **THEN** the system outputs a JSON object containing the design system data, detected stack, and project name

### Requirement: Cross-platform path handling
All file path operations in the init module SHALL use `path.join()` or `path.resolve()` and SHALL NOT assume a specific path separator character.

#### Scenario: Path construction on Windows
- **WHEN** the init module constructs paths to `package.json`, `design-system/`, or output files
- **THEN** all paths use `path.join()` rather than string concatenation with separators

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

