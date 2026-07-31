# Project Constitution

## Project Identity

- **Name**: grspec
- **Language**: TypeScript (ESM)
- **Runtime**: Node.js (≥20.19.0)
- **Package Manager**: pnpm
- **CLI Framework**: Commander.js
- **Test Framework**: Vitest

## Architecture Principles

- **Layering**: CLI → Commands → Core → Templates/Utils
- **API Design**: CLI commands map 1:1 to user workflows
- **Codegen Strategy**: Template-based skill/command generation for 25+ AI tools
- **Error Handling**: Graceful degradation with user-friendly messages via ora
- **Cross-platform**: macOS, Linux, Windows — always use path.join()

## Coding Standards

- **Naming**: camelCase for variables/functions, PascalCase for types/classes
- **Comments**: Only for non-obvious intent; no narrating comments
- **Test Strategy**: Vitest unit tests for all modules; e2e tests for CLI commands
- **Lint/Format**: ESLint with typescript-eslint

## Team Agreements

- **Change Granularity**: One feature/fix per change; atomic commits per task
- **Review Strategy**: Spec compliance + code quality dual-stage
- **Branch Strategy**: Feature branches from main
