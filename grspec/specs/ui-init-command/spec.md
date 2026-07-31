# ui-init-command Specification

## Purpose
Provide a `/grsx-ui-init` Cursor command as the entry point for interactive UI initialization, routing to the `grspec-ui-init` skill.

## Requirements
### Requirement: Command routes to the ui-init skill
The `/grsx-ui-init` Cursor command SHALL invoke the `grspec-ui-init` skill as its entry point for interactive UI initialization.

#### Scenario: User invokes the command
- **WHEN** user types `/grsx-ui-init` in the Cursor chat
- **THEN** the agent reads and follows the `grspec-ui-init` skill instructions

### Requirement: Command metadata follows conventions
The command file SHALL include standard frontmatter fields (`name`, `id`, `category`, `description`) consistent with other `/grsx-*` commands.

#### Scenario: Command file structure
- **WHEN** the command file is loaded
- **THEN** it contains `name: /grsx-ui-init`, `id: grsx-ui-init`, `category: design`, and a description explaining its purpose
