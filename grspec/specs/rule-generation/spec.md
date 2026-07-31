# rule-generation Specification

## Purpose
Define tool-agnostic rule content, per-tool rule adapters, and a registry for generating rule files during init/update. Rules are always-on coding philosophy instructions installed into each tool's native rules directory.

## Requirements
### Requirement: RuleContent interface

The system SHALL define a tool-agnostic `RuleContent` interface with `id` (string identifier), `description` (frontmatter text), and `body` (markdown rule content).

#### Scenario: RuleContent structure

- **WHEN** defining rule content for generation
- **THEN** the `RuleContent` interface SHALL include `id`, `description`, and `body` string fields

### Requirement: ToolRuleAdapter interface

The system SHALL define a `ToolRuleAdapter` interface for per-tool rule formatting.

#### Scenario: Adapter interface structure

- **WHEN** implementing a rule adapter for a tool
- **THEN** the adapter SHALL provide `toolId` (string), `getRuleFilePath(ruleId: string)` returning the file path, and `formatRuleFile(content: RuleContent)` returning the complete file content

### Requirement: Cursor rule adapter

The system SHALL format rule files for Cursor using `.mdc` extension with `description` and `alwaysApply: true` frontmatter.

#### Scenario: Cursor rule file path

- **WHEN** generating a rule with id `code-philosophy` for Cursor
- **THEN** the file path SHALL be `.cursor/rules/grspec-code-philosophy.mdc` (using `path.join`)

#### Scenario: Cursor rule frontmatter

- **WHEN** formatting a rule for Cursor
- **THEN** the output SHALL include YAML frontmatter with `description` and `alwaysApply: true`
- **AND** the rule body SHALL follow the frontmatter

#### Scenario: Cursor rule on Windows

- **WHEN** generating a rule for Cursor on Windows
- **THEN** the file path SHALL use the platform path separator via `path.join`

### Requirement: Claude Code rule adapter

The system SHALL format rule files for Claude Code as `.md` files without frontmatter.

#### Scenario: Claude rule file path

- **WHEN** generating a rule with id `code-philosophy` for Claude
- **THEN** the file path SHALL be `.claude/rules/grspec-code-philosophy.md`

#### Scenario: Claude rule has no frontmatter

- **WHEN** formatting a rule for Claude Code
- **THEN** the output SHALL contain only a markdown heading and the rule body, with no YAML frontmatter

### Requirement: Windsurf rule adapter

The system SHALL format rule files for Windsurf using `trigger: always_on` and `description` frontmatter.

#### Scenario: Windsurf rule file path

- **WHEN** generating a rule with id `code-philosophy` for Windsurf
- **THEN** the file path SHALL be `.windsurf/rules/grspec-code-philosophy.md`

#### Scenario: Windsurf rule frontmatter

- **WHEN** formatting a rule for Windsurf
- **THEN** the output SHALL include YAML frontmatter with `trigger: always_on` and `description`

### Requirement: Cline rule adapter

The system SHALL format rule files for Cline using `alwaysApply: true` and `description` frontmatter.

#### Scenario: Cline rule file path

- **WHEN** generating a rule with id `code-philosophy` for Cline
- **THEN** the file path SHALL be `.clinerules/grspec-code-philosophy.md`

#### Scenario: Cline rule frontmatter

- **WHEN** formatting a rule for Cline
- **THEN** the output SHALL include YAML frontmatter with `alwaysApply: true` and `description`

### Requirement: RooCode rule adapter

The system SHALL format rule files for RooCode as `.md` files without frontmatter.

#### Scenario: RooCode rule file path

- **WHEN** generating a rule with id `code-philosophy` for RooCode
- **THEN** the file path SHALL be `.roo/rules/grspec-code-philosophy.md`

#### Scenario: RooCode rule has no frontmatter

- **WHEN** formatting a rule for RooCode
- **THEN** the output SHALL contain only a markdown heading and the rule body, with no YAML frontmatter

### Requirement: GitHub Copilot rule adapter

The system SHALL format rule files for GitHub Copilot using `.instructions.md` extension with `applyTo: "**"` and `description` frontmatter.

#### Scenario: GitHub Copilot rule file path

- **WHEN** generating a rule with id `code-philosophy` for GitHub Copilot
- **THEN** the file path SHALL be `.github/instructions/grspec-code-philosophy.instructions.md`

#### Scenario: GitHub Copilot rule frontmatter

- **WHEN** formatting a rule for GitHub Copilot
- **THEN** the output SHALL include YAML frontmatter with `applyTo: "**"` and `description`

### Requirement: Kilo Code rule adapter

The system SHALL format rule files for Kilo Code using `alwaysApply: true` and `description` frontmatter.

#### Scenario: Kilo Code rule file path

- **WHEN** generating a rule with id `code-philosophy` for Kilo Code
- **THEN** the file path SHALL be `.kilocode/rules/grspec-code-philosophy.md`

#### Scenario: Kilo Code rule frontmatter

- **WHEN** formatting a rule for Kilo Code
- **THEN** the output SHALL include YAML frontmatter with `alwaysApply: true` and `description`

### Requirement: Generic rule adapter for tools without documented conventions

The system SHALL provide a generic adapter factory that writes rules to `<skillsDir>/rules/grspec-<id>.md` without frontmatter for tools that lack a documented rules directory convention.

#### Scenario: Generic adapter file path

- **WHEN** generating a rule for a tool with `skillsDir` of `.augment` and rule id `code-philosophy`
- **THEN** the file path SHALL be `.augment/rules/grspec-code-philosophy.md`

#### Scenario: Generic adapter no frontmatter

- **WHEN** formatting a rule using the generic adapter
- **THEN** the output SHALL contain only a markdown heading and the rule body, with no YAML frontmatter

#### Scenario: Generic adapter on Windows

- **WHEN** generating a rule path using the generic adapter on Windows
- **THEN** the file path SHALL use the platform path separator via `path.join`

### Requirement: RuleAdapterRegistry

The system SHALL provide a registry for looking up rule adapters by tool ID.

#### Scenario: Get adapter for Cursor

- **WHEN** calling `RuleAdapterRegistry.get('cursor')`
- **THEN** it SHALL return the Cursor rule adapter

#### Scenario: Adapter not found

- **WHEN** looking up an adapter for an unregistered tool ID
- **THEN** `RuleAdapterRegistry.get()` SHALL return `undefined`

#### Scenario: Check adapter existence

- **WHEN** calling `RuleAdapterRegistry.has('cursor')`
- **THEN** it SHALL return `true`

#### Scenario: Get all registered adapters

- **WHEN** calling `RuleAdapterRegistry.getAll()`
- **THEN** it SHALL return an array of all registered adapters

### Requirement: Rule generator function

The system SHALL provide `generateRule` and `generateRules` functions that combine rule content with adapters.

#### Scenario: Generate single rule

- **WHEN** calling `generateRule(content, adapter)`
- **THEN** it SHALL return an object with `path` from `adapter.getRuleFilePath(content.id)` and `fileContent` from `adapter.formatRuleFile(content)`

#### Scenario: Generate multiple rules

- **WHEN** calling `generateRules(contents, adapter)`
- **THEN** it SHALL return an array of generated rule objects, one per content entry

### Requirement: Rule template registry

The system SHALL provide a `getRuleTemplates()` function returning all available rule templates.

#### Scenario: Default rule templates

- **WHEN** calling `getRuleTemplates()`
- **THEN** it SHALL return at least one entry with `ruleId` of `code-philosophy`

#### Scenario: Rule template content

- **WHEN** retrieving the `code-philosophy` template
- **THEN** the content `body` SHALL use DO/DO NOT structured format with code examples
- **AND** the content `body` SHALL cover all seven code standards: naming, abstraction level, abstraction timing, comments, logic justification, explicit assumptions, and simplicity
- **AND** the content `description` SHALL be a concise summary of the rule

#### Scenario: Code-philosophy rule format

- **WHEN** the `code-philosophy` rule body is rendered
- **THEN** each code standard SHALL be presented as a section with DO and DO NOT bullets
- **AND** DO bullets SHALL include code examples demonstrating correct usage
- **AND** DO NOT bullets SHALL include code examples demonstrating prohibited usage

### Requirement: Shared rule body across all tools

The body content of rules SHALL be identical across all tools.

#### Scenario: Same body across tools

- **WHEN** generating the `code-philosophy` rule for Cursor and Claude
- **THEN** both SHALL use the same `body` content
- **AND** only the frontmatter, file path, and extension SHALL differ

#### Scenario: DO/DO NOT format preserved across adapters

- **WHEN** the `code-philosophy` rule body contains DO/DO NOT bullets with markers
- **THEN** all tool adapters SHALL preserve this formatting unchanged in the generated file
