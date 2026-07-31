---
type: spec
change: ui-init
created: 2026-06-15
schema: spec-driven
---
## ADDED Requirements

### Requirement: Init subcommand generates a persisted design system
The `grspec ui init` subcommand SHALL generate a design system and persist it to the `design-system/` directory. The subcommand SHALL accept `--type <product-type>` to specify the product category used for design system generation.

#### Scenario: Basic init with product type
- **WHEN** user runs `grspec ui init --type saas`
- **THEN** the system generates a design system using "saas" as the product type query
- **AND** persists the result to `design-system/<project-slug>/MASTER.md`

#### Scenario: Init with style keywords
- **WHEN** user runs `grspec ui init --type devtool --style "minimal dark"`
- **THEN** the system assembles a query from type and style ("devtool minimal dark")
- **AND** generates a design system matching those keywords

#### Scenario: Init with explicit project name
- **WHEN** user runs `grspec ui init --type saas -p "My App"`
- **THEN** the design system uses "My App" as the project name
- **AND** the output directory is `design-system/my-app/`

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

### Requirement: Init guards against overwriting existing design system
When a `design-system/` directory with a `MASTER.md` file exists in the output directory, the CLI SHALL refuse to proceed unless `--force` is provided.

#### Scenario: Existing design system without force
- **WHEN** user runs `grspec ui init --type saas` and `design-system/` contains a `MASTER.md`
- **THEN** the system prints a warning including the detected style name
- **AND** exits with a non-zero exit code
- **AND** does not modify any files

#### Scenario: Existing design system with force
- **WHEN** user runs `grspec ui init --type saas --force` and `design-system/` exists
- **THEN** the system regenerates and overwrites the design system

### Requirement: Init generates page overrides
The `--page` option SHALL generate a page-specific override file alongside the master design system.

#### Scenario: Init with page override
- **WHEN** user runs `grspec ui init --type saas --page dashboard`
- **THEN** the system creates both `MASTER.md` and `pages/dashboard.md`

### Requirement: Init generates rules checklist
When `--with-rules` is provided, the CLI SHALL generate a platform-specific rules checklist and write it to the design system directory.

#### Scenario: Rules checklist for web platform
- **WHEN** user runs `grspec ui init --type saas --with-rules`
- **THEN** the system generates a rules checklist at `design-system/<slug>/RULES-CHECKLIST.md`
- **AND** the checklist is filtered for the web platform by default

#### Scenario: Rules checklist for app platform
- **WHEN** user runs `grspec ui init --type saas --with-rules --platform app`
- **THEN** the rules checklist is filtered for the app platform

### Requirement: Init supports custom output directory
The `--output` option SHALL redirect the design system output to a specified directory instead of the current working directory.

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
