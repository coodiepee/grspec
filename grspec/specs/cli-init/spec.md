# CLI Init Specification

## Purpose

The `grspec init` command SHALL create a complete grspec directory structure in any project, enabling immediate adoption of grspec conventions with support for multiple AI coding assistants.
## Requirements

### Requirement: Progress Indicators

The command SHALL display progress indicators during initialization to provide clear feedback about each step.

#### Scenario: Displaying initialization progress

- **WHEN** executing initialization steps
- **THEN** validate environment silently in background (no output unless error)
- **AND** display progress with ora spinners:
  - Show spinner: "⠋ Creating grspec structure..."
  - Then success: "✔ grspec structure created"
  - Show spinner: "⠋ Configuring AI tools..."
  - Then success: "✔ AI tools configured"

### Requirement: Directory Creation

The command SHALL create the grspec directory structure with config file.

#### Scenario: Creating grspec structure

- **WHEN** `grspec init` is executed
- **THEN** create the following directory structure:
```
grspec/
├── config.yaml
├── specs/
└── changes/
    └── archive/
```

### Requirement: AI Tool Configuration

The command SHALL configure AI coding assistants with skills and slash commands using a searchable multi-select experience.

#### Scenario: Prompting for AI tool selection

- **WHEN** run interactively
- **THEN** display animated welcome screen with grspec logo
- **AND** present a searchable multi-select that shows all available tools
- **AND** mark already configured tools with "(configured ✓)" indicator
- **AND** pre-select configured tools for easy refresh
- **AND** sort configured tools to appear first in the list
- **AND** allow filtering by typing to search

#### Scenario: Selecting tools to configure

- **WHEN** user selects tools and confirms
- **THEN** generate skills in `.<tool>/skills/` directory for each selected tool
- **AND** generate slash commands in `.<tool>/commands/grsx/` directory for each selected tool
- **AND** create `grspec/grspec.yaml` with default schema setting

### Requirement: Interactive Mode
The command SHALL provide an interactive menu for AI tool selection with clear navigation instructions.
#### Scenario: Displaying interactive menu
- **WHEN** run in fresh or extend mode
- **THEN** present a looping select menu that lets users toggle tools with Space and review selections with Enter
- **AND** when Enter is pressed on a highlighted selectable tool that is not already selected, automatically add it to the selection before moving to review so the highlighted tool is configured
- **AND** label already configured tools with "(already configured)" while keeping disabled options marked "coming soon"
- **AND** change the prompt copy in extend mode to "Which AI tools would you like to add or refresh?"
- **AND** display inline instructions clarifying that Space toggles tools and Enter selects the highlighted tool before reviewing selections

### Requirement: Safety Checks
The command SHALL perform safety checks to prevent overwriting existing structures and ensure proper permissions.

#### Scenario: Detecting existing initialization
- **WHEN** the `grspec/` directory already exists
- **THEN** inform the user that grspec is already initialized, skip recreating the base structure, and enter an extend mode
- **AND** continue to the AI tool selection step so additional tools can be configured
- **AND** display the existing-initialization error message only when the user declines to add any AI tools

### Requirement: Success Output

The command SHALL provide clear, actionable next steps upon successful initialization.

#### Scenario: Displaying success message

- **WHEN** initialization completes successfully
- **THEN** display categorized summary:
  - "Created: <tools>" for newly configured tools
  - "Refreshed: <tools>" for already-configured tools that were updated
  - Count of skills and commands generated
- **AND** display AGENTS.md generation status (created, exists, or skipped)
- **AND** display pointer file status for each generated tool-specific file (CLAUDE.md, GEMINI.md)
- **AND** display getting started section with:
  - `/grsx:new` - Start a new change
  - `/grsx:continue` - Create the next artifact
  - `/grsx:apply` - Implement tasks
- **AND** display links to documentation and feedback

#### Scenario: Displaying restart instruction

- **WHEN** initialization completes successfully and tools were created or refreshed
- **THEN** display instruction to restart IDE for slash commands to take effect

### Requirement: Exit Codes

The command SHALL use consistent exit codes to indicate different failure modes.

#### Scenario: Returning exit codes

- **WHEN** the command completes
- **THEN** return appropriate exit code:
  - 0: Success
  - 1: General error (including when grspec directory already exists)
  - 2: Insufficient permissions (reserved for future use)
  - 3: User cancelled operation (reserved for future use)

### Requirement: Additional AI Tool Initialization
`grspec init` SHALL allow users to add configuration files for new AI coding assistants after the initial setup.

#### Scenario: Configuring an extra tool after initial setup
- **GIVEN** an `grspec/` directory already exists and at least one AI tool file is present
- **WHEN** the user runs `grspec init` and selects a different supported AI tool
- **THEN** generate that tool's configuration files with grspec markers the same way as during first-time initialization
- **AND** leave existing tool configuration files unchanged except for managed sections that need refreshing
- **AND** exit with code 0 and display a success summary highlighting the newly added tool files

### Requirement: Success Output Enhancements
`grspec init` SHALL summarize tool actions when initialization or extend mode completes.

#### Scenario: Showing tool summary
- **WHEN** the command completes successfully
- **THEN** display a categorized summary of tools that were created, refreshed, or skipped (including already-configured skips)
- **AND** personalize the "Next steps" header using the names of the selected tools, defaulting to a generic label when none remain

### Requirement: Exit Code Adjustments
`grspec init` SHALL treat extend mode without new native tool selections as a successful refresh.

#### Scenario: Allowing empty extend runs
- **WHEN** grspec is already initialized and the user selects no additional natively supported tools
- **THEN** complete successfully without requiring additional tool setup
- **AND** preserve the existing grspec structure and config files
- **AND** exit with code 0

### Requirement: Non-Interactive Mode

The command SHALL support non-interactive operation through command-line options.

#### Scenario: Select all tools non-interactively

- **WHEN** run with `--tools all`
- **THEN** automatically select every available AI tool without prompting
- **AND** proceed with skill and command generation

#### Scenario: Select specific tools non-interactively

- **WHEN** run with `--tools claude,cursor`
- **THEN** parse the comma-separated tool IDs
- **AND** generate skills and commands for specified tools only

#### Scenario: Skip tool configuration non-interactively

- **WHEN** run with `--tools none`
- **THEN** create only the grspec directory structure
- **AND** skip skill and command generation
- **AND** create config only when config creation conditions are met

#### Scenario: Invalid tool specification

- **WHEN** run with `--tools invalid-tool`
- **THEN** fail with exit code 1
- **AND** display an error listing available values (`all`, `none`, and supported tool IDs)

#### Scenario: Reserved value combined with tool IDs

- **WHEN** run with `--tools all,claude` or `--tools none,cursor`
- **THEN** fail with exit code 1
- **AND** display an error explaining reserved values cannot be combined with specific tool IDs

#### Scenario: Missing --tools in non-interactive mode

- **GIVEN** prompts are unavailable in non-interactive execution
- **WHEN** user runs `grspec init` without `--tools`
- **THEN** fail with exit code 1
- **AND** instruct to use `--tools all`, `--tools none`, or explicit tool IDs

### Requirement: Skill Generation

The command SHALL generate Agent Skills for selected AI tools.

#### Scenario: Generating skills for a tool

- **WHEN** a tool is selected during initialization
- **THEN** create 9 skill directories under `.<tool>/skills/`:
  - `grspec-explore/SKILL.md`
  - `grspec-new-change/SKILL.md`
  - `grspec-continue-change/SKILL.md`
  - `grspec-apply-change/SKILL.md`
  - `grspec-ff-change/SKILL.md`
  - `grspec-verify-change/SKILL.md`
  - `grspec-sync-specs/SKILL.md`
  - `grspec-archive-change/SKILL.md`
  - `grspec-bulk-archive-change/SKILL.md`
- **AND** each SKILL.md SHALL contain YAML frontmatter with name and description
- **AND** each SKILL.md SHALL contain the skill instructions

### Requirement: Slash Command Generation

The command SHALL generate grsx slash commands only for selected tools that have a registered command adapter, while keeping adapterless tools valid for skill generation.

#### Scenario: Generating slash commands for a tool with a registered adapter

- **WHEN** a tool with a registered command adapter is selected during initialization
- **THEN** create 9 slash command files using the tool's command adapter:
  - `/grsx:explore`
  - `/grsx:new`
  - `/grsx:continue`
  - `/grsx:apply`
  - `/grsx:ff`
  - `/grsx:verify`
  - `/grsx:sync`
  - `/grsx:archive`
  - `/grsx:bulk-archive`
- **AND** use tool-specific path conventions (e.g., `.claude/commands/grsx/` for Claude)
- **AND** include tool-specific frontmatter format

#### Scenario: Selected tool has no command adapter

- **GIVEN** a selected tool has `skillsDir` configured but no registered command adapter
- **WHEN** initialization includes command generation
- **THEN** skill generation for that tool SHALL still remain valid
- **AND** command-file generation SHALL be skipped for that tool
- **AND** the command output SHALL include `Commands skipped for: <tool-id> (no adapter)`

#### Scenario: Kimi CLI skips command-file generation

- **WHEN** the user selects Kimi CLI during initialization
- **THEN** grspec SHALL treat it as a supported tool with `skillsDir: '.kimi'`
- **AND** command-file generation SHALL be skipped because no Kimi adapter is registered

#### Scenario: DeepSeek Harness skips command-file generation

- **WHEN** the user selects DeepSeek Harness during initialization
- **THEN** grspec SHALL treat it as a supported tool with `skillsDir: '.dsh'`
- **AND** command-file generation SHALL be skipped because no DeepSeek adapter is registered
- **AND** generated skill instructions SHALL reference `/grspec-*` skill commands instead of `/grsx:*` commands

### Requirement: Config File Generation

The command SHALL create an grspec config file with schema settings.

#### Scenario: Creating config.yaml

- **WHEN** initialization completes
- **AND** config.yaml does not exist
- **THEN** create `grspec/grspec.yaml` with default schema setting
- **AND** display config location in output

#### Scenario: Preserving existing config.yaml

- **WHEN** initialization runs in extend mode
- **AND** `grspec/grspec.yaml` already exists
- **THEN** preserve the existing config file
- **AND** display "(exists)" indicator in output

### Requirement: Track parameter

`grspec init` SHALL accept a `--track` parameter with values `new-project` or `existing-project` to determine initialization mode.

#### Scenario: Accepting track values

- **WHEN** the user runs `grspec init --track new-project` or `grspec init --track existing-project` with other required non-interactive options as applicable
- **THEN** the command SHALL use the specified track to select initialization behavior
- **AND** the command SHALL reject invalid `--track` values with a non-zero exit code and an error that lists the allowed values

### Requirement: New project initialization track

When `--track new-project` is specified, `grspec init` SHALL generate `constitution.md` and `domain-model.md` from templates and SHALL generate `grspec.yaml` including a bootstrap section appropriate for greenfield adoption.

#### Scenario: New project track output

- **WHEN** `grspec init` runs with `--track new-project` and completes successfully
- **THEN** the grspec workspace SHALL include template-based `constitution.md` and `domain-model.md`
- **AND** the grspec workspace SHALL include `grspec.yaml` containing a bootstrap section as defined by the init templates

### Requirement: Existing project initialization track

When `--track existing-project` is specified, `grspec init` SHALL generate `constitution.md` and `domain-model.md` as skeletons that include reverse-engineering guidance for documenting an established codebase.

#### Scenario: Existing project track output

- **WHEN** `grspec init` runs with `--track existing-project` and completes successfully
- **THEN** the grspec workspace SHALL include skeleton `constitution.md` and `domain-model.md`
- **AND** those files SHALL include guidance oriented toward reverse-engineering and capturing the current system

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

### Requirement: Pointer file generation in init

`grspec init` SHALL generate tool-specific pointer files alongside AGENTS.md based on the selected tools.

#### Scenario: Generating CLAUDE.md for claude tool

- **WHEN** `grspec init` runs with `--tools claude` or `--tools all`
- **THEN** the system SHALL generate CLAUDE.md at the project root
- **AND** the file SHALL reference AGENTS.md for shared context
- **AND** the success output SHALL include CLAUDE.md status

#### Scenario: Generating GEMINI.md for gemini tool

- **WHEN** `grspec init` runs with `--tools gemini` or `--tools all`
- **THEN** the system SHALL generate GEMINI.md at the project root
- **AND** the success output SHALL include GEMINI.md status

#### Scenario: Pointer file exists without force

- **WHEN** a pointer file already exists and `--force` is not specified
- **THEN** the system SHALL skip that pointer file
- **AND** SHALL log that it was skipped

#### Scenario: Force regeneration of pointer files

- **WHEN** `grspec init --force` runs and pointer files exist
- **THEN** the system SHALL regenerate all applicable pointer files

## Why

Manual creation of grspec structure is error-prone and creates adoption friction. A standardized init command ensures:
- Consistent structure across all projects
- Proper AI instruction files are always included
- Quick onboarding for new projects
- Clear conventions from the start
