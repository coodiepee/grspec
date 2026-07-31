export function getConstitutionTemplate(track: 'new-project' | 'existing-project'): string {
  if (track === 'new-project') {
    return NEW_PROJECT_CONSTITUTION;
  }
  return EXISTING_PROJECT_CONSTITUTION;
}

const NEW_PROJECT_CONSTITUTION = `# Project Constitution

## Project Identity

- **Name**: <!-- project name -->
- **Language**: <!-- primary language -->
- **Framework**: <!-- main framework -->
- **Database**: <!-- database if any -->
- **Package Manager**: <!-- npm/pnpm/yarn/etc. -->

## Architecture Principles

<!-- Define the architecture principles for this project -->

- **Layering Strategy**: <!-- e.g., Clean Architecture, Hexagonal, MVC -->
- **API Design**: <!-- e.g., REST, GraphQL, gRPC -->
- **Codegen Strategy**: <!-- e.g., protobuf, OpenAPI, xidl, none -->
- **Error Handling**: <!-- error handling conventions -->

## Coding Standards

- **Naming Convention**: <!-- e.g., camelCase for variables, PascalCase for types -->
- **Comment Policy**: <!-- when and how to comment -->
- **Test Strategy**: <!-- e.g., TDD for core logic, integration tests for APIs -->
- **Lint/Format**: <!-- e.g., ESLint + Prettier, gofmt -->

## Team Agreements

- **Change Granularity**: <!-- how big should a single change be? -->
- **Review Strategy**: <!-- who reviews, when, how -->
- **Codegen Policy**: <!-- when to use codegen vs manual implementation -->
- **Branch Strategy**: <!-- e.g., feature branches, trunk-based -->
`;

const EXISTING_PROJECT_CONSTITUTION = `# Project Constitution

> This file was generated for an existing project. Use grspec explore to reverse-engineer your project conventions.
> Suggested command: Tell your AI assistant "Help me fill in the constitution by analyzing the codebase"

## Project Identity

- **Name**: <!-- analyze package.json or project config -->
- **Language**: <!-- check file extensions and configs -->
- **Framework**: <!-- check dependencies -->
- **Database**: <!-- check connection configs -->
- **Package Manager**: <!-- check lockfile type -->

## Architecture Principles

<!-- Analyze the codebase structure to identify patterns -->

## Coding Standards

<!-- Check linter configs, existing code patterns -->

## Team Agreements

<!-- Review git history and PR conventions -->
`;
