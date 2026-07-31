---
type: spec
change: agents-md-v2
created: 2026-06-15
schema: spec-driven
---
## ADDED Requirements

### Requirement: AGENTS.md section ordering

The AGENTS.md output SHALL follow the industry-consensus section order.

#### Scenario: Section order in generated output

- **WHEN** generating AGENTS.md content
- **THEN** sections SHALL appear in this order: project header (name + tech stack), Commands, Architecture, Code Style, Testing, Git Workflow, Boundaries, and grspec Workflow (if applicable)
- **AND** Commands SHALL appear before all other content sections

### Requirement: Git Workflow section

The AGENTS.md SHALL include a Git Workflow section covering commit format, branch naming, pre-commit checks, and merge strategy.

#### Scenario: Conventional Commits detected

- **WHEN** `package.json` devDependencies contain `commitlint` or any `@commitlint/*` package
- **THEN** the Git Workflow section SHALL specify Conventional Commits format: `<type>(<scope>): <summary>`
- **AND** SHALL list common types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`
- **AND** SHALL specify summary under 80 characters in imperative mood

#### Scenario: No commit format tooling detected

- **WHEN** no commitlint packages are found in devDependencies
- **THEN** the Git Workflow section SHALL use the generic default: "Commit messages: imperative mood, short first line (<80 chars)"

#### Scenario: Pre-commit commands from detected scripts

- **WHEN** the project has `lint` and `test` scripts in package.json
- **THEN** the Git Workflow section SHALL include the exact pre-commit command chain using the detected package manager (e.g., `pnpm run lint && pnpm run test`)

#### Scenario: Pre-commit commands with partial scripts

- **WHEN** the project has `lint` but no `test` script (or vice versa)
- **THEN** the Git Workflow section SHALL include only the available command

#### Scenario: No pre-commit scripts detected

- **WHEN** neither `lint` nor `test` scripts exist
- **THEN** the Git Workflow section SHALL include a TODO placeholder: `<!-- TODO: Add your pre-commit checks -->`

#### Scenario: Branch naming convention

- **WHEN** generating the Git Workflow section
- **THEN** it SHALL include branch naming guidance: "Branch from `main`, prefix with `feat/`, `fix/`, or `chore/`"

#### Scenario: Merge strategy default

- **WHEN** generating the Git Workflow section
- **THEN** it SHALL include "Squash merge PRs" as the default merge strategy

#### Scenario: Pre-commit hooks detected

- **WHEN** `package.json` devDependencies contain `husky` or `lint-staged`
- **THEN** the Git Workflow section SHALL note that pre-commit hooks are configured

### Requirement: Boundaries section with three-tier system

The AGENTS.md SHALL include a Boundaries section using the Always/Ask First/Never tier system.

#### Scenario: Always tier from verification commands

- **WHEN** the project has `lint`, `test`, and `build` scripts
- **THEN** the Always tier SHALL include each as a verification requirement with the exact command

#### Scenario: Ask First tier defaults

- **WHEN** generating the Boundaries section
- **THEN** the Ask First tier SHALL include "Database schema changes", "Adding new dependencies", and "Modifying CI/CD config" as defaults

#### Scenario: Never tier from escalation rules

- **WHEN** generating the Boundaries section
- **THEN** the Never tier SHALL include: commit secrets or API keys, force push to main/master, delete test files to make tests pass, skip type checks or linting

#### Scenario: Boundaries uses emoji tier markers

- **WHEN** rendering the Boundaries section
- **THEN** each tier SHALL be prefixed with its marker: `✅` for Always, `⚠️` for Ask First, `🚫` for Never

### Requirement: AGENTS.md generated unconditionally

The system SHALL generate AGENTS.md during `grspec init` regardless of the `--tools` flag value.

#### Scenario: AGENTS.md with any tools flag

- **WHEN** `grspec init` runs with any `--tools` value (including `cursor`, `claude`, `none`, `all`)
- **THEN** the system SHALL generate AGENTS.md at the project root
- **AND** SHALL follow the existing exists/force/skip behavior for file conflicts

#### Scenario: AGENTS.md with tools=none

- **WHEN** `grspec init` runs with `--tools none`
- **THEN** the system SHALL still generate AGENTS.md at the project root
- **AND** SHALL skip tool-specific skill and command generation as before

### Requirement: AGENTS.md line count target

The generated AGENTS.md SHALL stay concise for context-window efficiency.

#### Scenario: Typical project output size

- **WHEN** generating AGENTS.md for a project with package.json scripts, src/ directories, and grspec
- **THEN** the output SHALL be under 100 lines
