# template-extraction Specification

## Purpose
Store workflow template content as standalone Markdown files loaded at runtime, keeping TypeScript modules free of large template-literal strings and enabling independent template editing.
## Requirements
### Requirement: Workflow templates as standalone files
Workflow template content (skill instructions **and** slash-command bodies) SHALL be stored as standalone Markdown files rather than embedded in TypeScript template-literal strings. The TypeScript module SHALL load and return the file content at runtime for **both** `SkillTemplate.instructions` and `CommandTemplate.content` when a workflow has a paired skill and command.

#### Scenario: Skill template file loaded at runtime
- **WHEN** a workflow skill template is requested (e.g., `getApplyChangeSkillTemplate()`)
- **THEN** the system reads the corresponding `.md` file from the templates content directory and returns its content as `instructions`

#### Scenario: Command template file loaded at runtime
- **WHEN** a workflow slash-command template is requested (e.g., `getGrsxApplyCommandTemplate()`)
- **THEN** the system reads the **same** `.md` file used by the paired skill (when a pair exists) and returns its content as `content`
- **AND** the TypeScript module SHALL NOT embed a divergent full-body template literal for that command

#### Scenario: Template file missing
- **WHEN** the expected template file does not exist on disk
- **THEN** the system throws a descriptive error identifying the missing file path (using OS-native path separators)

#### Scenario: Template file path on Windows
- **WHEN** the template loader resolves a file path on Windows
- **THEN** the path uses backslash separators and resolves correctly relative to the package installation directory

### Requirement: Template files included in published package
The extracted `.md` template files SHALL be included in the npm package `files` array so they are available after installation.

#### Scenario: Package install includes templates
- **WHEN** a user installs `@coodiepee/grspec` via npm
- **THEN** the template `.md` files are present in the installed package directory alongside the compiled JavaScript

### Requirement: Template content parity
For every workflow that exposes both a skill template and a slash-command template backed by a shared content file, `SkillTemplate.instructions`, `CommandTemplate.content`, and the on-disk Markdown file SHALL be byte-identical after `loadWorkflowTemplate` trimming rules (trailing whitespace normalization only).

#### Scenario: Skill and command body identity
- **WHEN** a parity test loads a paired skill factory and command factory that share a content template name
- **THEN** `skill.instructions` SHALL equal `command.content`
- **AND** both SHALL equal `loadWorkflowTemplate(contentTemplateName)`

#### Scenario: UI subcommands remain the reference pattern
- **WHEN** UI subcommand templates are generated
- **THEN** they SHALL continue to satisfy the same byte-identity rule (no regression)

#### Scenario: Divergent INLINE command bodies are invalid
- **WHEN** a paired workflow command factory embeds a full-body template literal that differs from its content Markdown file
- **THEN** the parity suite SHALL fail (factories must load Markdown; separate historical string hashes MUST NOT be the only guard)

### Requirement: Template variables remain in TypeScript
Template files MAY contain placeholder tokens (e.g., `{{changeName}}`, `{{projectRoot}}`). The TypeScript loader function SHALL perform variable substitution after reading the file. The substitution logic SHALL remain in TypeScript, not in the template file.

#### Scenario: Variable substitution in loaded template
- **WHEN** a template file contains `{{changeName}}` and the loader is called with `changeName: "add-dark-mode"`
- **THEN** the returned string contains `add-dark-mode` in place of `{{changeName}}`

