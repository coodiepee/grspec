# tech-stack-detection Specification

## Purpose

Detect the project's tech stack and git tooling from `package.json` to populate AGENTS.md with accurate metadata.

## Requirements

### Requirement: Tech stack detection from dependencies

The system SHALL detect the project's tech stack from `package.json` `dependencies` and `devDependencies` fields using an explicit lookup map.

#### Scenario: Detecting a known framework

- **WHEN** `package.json` contains `react` in `dependencies`
- **THEN** the detected tech stack SHALL include "React"

#### Scenario: Detecting test runner

- **WHEN** `package.json` contains `vitest` in `devDependencies`
- **THEN** the detected tech stack SHALL include "Vitest"

#### Scenario: Detecting bundler

- **WHEN** `package.json` contains `vite` in `devDependencies`
- **THEN** the detected tech stack SHALL include "Vite"

#### Scenario: Detecting Node.js version from engines

- **WHEN** `package.json` contains `engines.node` field (e.g., `">=20.19.0"`)
- **THEN** the detected tech stack SHALL include the Node.js version constraint

#### Scenario: No recognized packages

- **WHEN** `package.json` dependencies contain no packages in the lookup map
- **THEN** the tech stack detection SHALL return an empty list
- **AND** the AGENTS.md header SHALL omit the tech stack line

#### Scenario: No package.json exists

- **WHEN** the project has no `package.json`
- **THEN** the tech stack detection SHALL return an empty list gracefully

#### Scenario: Exact package name matching

- **WHEN** scanning dependencies for known packages
- **THEN** the system SHALL match exact package names from a curated constant map
- **AND** SHALL NOT match substrings (e.g., `react-icons` SHALL NOT trigger "React" detection)

### Requirement: Git tooling detection from devDependencies

The system SHALL detect git-related tooling from `devDependencies` to inform Git Workflow section generation.

#### Scenario: Detecting commitlint

- **WHEN** `package.json` devDependencies contain `commitlint` or any package matching `@commitlint/*`
- **THEN** the metadata SHALL indicate Conventional Commits enforcement is configured

#### Scenario: Detecting pre-commit hook tools

- **WHEN** `package.json` devDependencies contain `husky` or `lint-staged`
- **THEN** the metadata SHALL indicate pre-commit hooks are configured

#### Scenario: No git tooling detected

- **WHEN** devDependencies contain none of the recognized git tooling packages
- **THEN** the git tooling detection SHALL return empty indicators gracefully

### Requirement: Tech stack display in AGENTS.md header

The system SHALL display detected tech stack as a concise single line in the AGENTS.md project header.

#### Scenario: Displaying tech stack

- **WHEN** tech stack items are detected
- **THEN** the AGENTS.md SHALL include a line after the project description in the format: "Tech stack: TypeScript · Node >=20 · Vitest · pnpm"
- **AND** items SHALL be separated by ` · ` (middle dot with spaces)

#### Scenario: No tech stack detected

- **WHEN** no tech stack items are detected
- **THEN** the AGENTS.md SHALL omit the tech stack line entirely (no empty placeholder)
