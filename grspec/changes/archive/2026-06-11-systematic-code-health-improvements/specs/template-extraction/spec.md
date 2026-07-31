---
type: spec
change: systematic-code-health-improvements
created: 2026-06-11
schema: spec-driven
---
## ADDED Requirements

### Requirement: Workflow templates as standalone files
Workflow template content (skill instructions, command bodies) SHALL be stored as standalone Markdown files rather than embedded in TypeScript template-literal strings. The TypeScript module SHALL load and return the file content at runtime.

#### Scenario: Template file loaded at runtime
- **WHEN** a workflow skill template is requested (e.g., `getExploreSkillTemplate()`)
- **THEN** the system reads the corresponding `.md` file from the templates directory and returns its content

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
Extracted template files SHALL produce identical output to the current embedded TypeScript string templates. No user-visible behavior SHALL change as a result of extraction.

#### Scenario: Output parity verification
- **WHEN** a skill file is generated using the extracted template
- **THEN** the output is byte-identical to the output produced by the previous embedded template (excluding trailing whitespace normalization)

### Requirement: Template variables remain in TypeScript
Template files MAY contain placeholder tokens (e.g., `{{changeName}}`, `{{projectRoot}}`). The TypeScript loader function SHALL perform variable substitution after reading the file. The substitution logic SHALL remain in TypeScript, not in the template file.

#### Scenario: Variable substitution in loaded template
- **WHEN** a template file contains `{{changeName}}` and the loader is called with `changeName: "add-dark-mode"`
- **THEN** the returned string contains `add-dark-mode` in place of `{{changeName}}`
