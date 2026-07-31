# ui-init-skill Specification

## Purpose
Provide an agent skill that performs deep codebase analysis, classifies inferred UI attributes by confidence level (HIGH/MEDIUM/LOW), presents adaptive user confirmation, and delegates design system generation to the CLI.

## Requirements
### Requirement: Skill performs deep codebase analysis
The `grspec-ui-init` skill SHALL analyze the project codebase to infer UI-relevant attributes beyond what the CLI auto-detects. Analysis targets include CSS/theme files, component file patterns, README/docs content, and framework configuration files.

#### Scenario: Detect Tailwind configuration
- **WHEN** the project contains a `tailwind.config.*` file
- **THEN** the skill infers "tailwind" as part of the stack and reports confidence HIGH

#### Scenario: Detect existing CSS variables
- **WHEN** the project's CSS files define custom properties (e.g., `--color-primary`)
- **THEN** the skill reports that a partial design token system exists and factors this into recommendations

#### Scenario: Infer product type from README
- **WHEN** the project's README.md contains keywords matching known product types (e.g., "dashboard", "ecommerce", "developer tool")
- **THEN** the skill infers the product type with confidence MEDIUM and cites the source

### Requirement: Skill classifies inferences by confidence tier
Each inferred attribute SHALL be classified into one of three confidence tiers that determine how the skill presents it to the user.

#### Scenario: HIGH confidence attribute
- **WHEN** an attribute is detected from a deterministic source (e.g., `package.json` `name` field)
- **THEN** the skill auto-fills the attribute and displays it as confirmed without asking

#### Scenario: MEDIUM confidence attribute
- **WHEN** an attribute is inferred from a heuristic source (e.g., README keyword frequency)
- **THEN** the skill auto-fills the attribute, cites the source, and presents it for user confirmation as part of a summary

#### Scenario: LOW confidence attribute
- **WHEN** an attribute cannot be inferred from the codebase
- **THEN** the skill asks the user to provide the value explicitly

### Requirement: Skill presents adaptive confirmation dialog
After analysis, the skill SHALL present a summary grouping attributes by confidence tier, allowing the user to confirm, adjust, or provide missing values in a single interaction round.

#### Scenario: All attributes detected
- **WHEN** all attributes are HIGH or MEDIUM confidence
- **THEN** the skill presents a summary and asks for overall confirmation or adjustments

#### Scenario: Mixed confidence attributes
- **WHEN** some attributes are LOW confidence
- **THEN** the skill presents detected attributes as pre-filled and explicitly asks for the missing ones

#### Scenario: User overrides a detected attribute
- **WHEN** the user changes an auto-filled attribute (e.g., changes product type from "SaaS" to "Developer Tool")
- **THEN** the skill uses the user-provided value and re-assembles the CLI command accordingly

### Requirement: Skill delegates execution to CLI
After user confirmation, the skill SHALL construct and execute the `grspec ui init` CLI command with the confirmed parameters.

#### Scenario: Successful delegation
- **WHEN** the user confirms the detected attributes
- **THEN** the skill runs `grspec ui init --type <type> --style "<style>" -p "<name>" --persist [--with-rules]`
- **AND** presents the CLI output to the user

### Requirement: Skill detects active change context
The skill SHALL check for active grspec changes and, when one involves UI work, offer to place the design system in the change directory.

#### Scenario: Active change with UI content
- **WHEN** an active change exists and `grspec ui detect` identifies UI content in it
- **THEN** the skill asks whether to place the design system in the change directory or the project root

#### Scenario: No active change
- **WHEN** no active grspec change exists
- **THEN** the skill places the design system in the project root without asking

### Requirement: Skill provides completion guidance
After successful init, the skill SHALL display a summary of what was created and suggest relevant next steps.

#### Scenario: Completion summary
- **WHEN** init completes successfully
- **THEN** the skill lists created files (MASTER.md, optional page overrides, optional rules checklist)
- **AND** suggests `/grsx-ui` for ongoing queries and `/grsx-ui-review` for quality audits
