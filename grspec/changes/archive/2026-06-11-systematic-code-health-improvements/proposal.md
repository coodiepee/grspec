---
type: proposal
change: systematic-code-health-improvements
created: 2026-06-11
schema: spec-driven
---
## Why

The grspec codebase has grown to ~32K lines of TypeScript across 182 source files. While all 1851 tests pass and lint is clean, several structural issues are accumulating that degrade maintainability, increase onboarding friction, and create risk for the 13 active changes that touch overlapping areas. Addressing these now prevents compounding debt as the project scales to more contributors and AI tool adapters.

## What Changes

- **Introduce a unified error handling layer** for CLI commands, replacing the current mix of `ora().fail()` + `process.exit(1)`, `console.error()` + `process.exitCode`, and bare `console.error()` + `process.exit(1)` patterns (151+ inconsistent catch blocks)
- **Introduce a structured logger** to replace ~700 scattered `console.log/error/warn` calls, enabling log-level control, test silencing, and consistent output formatting
- **Decompose oversized files** — split `cli/index.ts` (601 lines), `init.ts` (823 lines), `schema.ts` (994 lines), and other files exceeding 500 lines into focused, single-responsibility modules
- **Gradually enable `no-explicit-any`** by fixing the 37+ `: any` type annotations across the codebase, starting with core modules
- **Remove or deprecation-gate stale code paths** — consolidate the 11+ deprecated command aliases and the 671-line `legacy-cleanup.ts` module behind a feature flag or removal timeline
- **Expand E2E test coverage** — the CLI has only one E2E test file (`test/cli-e2e/basic.test.ts`); add coverage for the critical `init`, `update`, `archive`, and `validate` flows
- **Extract template content from TypeScript** — the 22 workflow template files (~4700 lines) embed Markdown in TypeScript strings; extract to standalone `.md` files loaded at runtime

## Capabilities

### New Capabilities

- `error-handling-layer`: Unified CLI error handling middleware with consistent formatting, exit-code strategy, and error classification
- `structured-logging`: Project-wide logger abstraction supporting log levels, test silencing, and `--no-color`/`--verbose` flags
- `cli-command-decomposition`: Pattern for registering CLI commands from self-contained modules instead of a single monolithic entry file
- `template-extraction`: Runtime loading of workflow template content from standalone Markdown files instead of embedded TypeScript strings

### Modified Capabilities

_(No spec-level requirement changes — these are internal refactors that preserve existing behavior)_

## Risk Assessment

- **Impact scope**: Touches 30+ source files across `src/cli/`, `src/core/`, `src/commands/`, and `src/core/templates/`. The error-handling and logger changes are cross-cutting.
- **Regression risk**: MODERATE. All changes are internal refactors that must preserve the existing public CLI interface and output format. The primary risk is breaking 103 test files that assert on specific `console.log` output or `process.exit` behavior.
- **Performance implications**: Negligible. Logger indirection adds nanoseconds. Template loading from disk adds a one-time read per command invocation.
- **Coordination risk**: The `unify-template-generation-pipeline` change (0/24 tasks) overlaps with the template extraction work. The `add-global-install-scope` change overlaps with CLI decomposition. Both are currently stalled (0% progress) so conflict risk is low but should be monitored.
- **Mitigation**: Each improvement area is independently shippable. Implement in small PRs with full test parity. Run the complete 1851-test suite after each phase.

## Impact

- **Code**: `src/cli/index.ts`, `src/core/init.ts`, `src/commands/schema.ts`, `src/core/update.ts`, `src/core/legacy-cleanup.ts`, `src/core/templates/workflows/*.ts`, all `src/commands/*.ts` catch blocks
- **Dependencies**: May add a lightweight logger (or build one internally — no new dependency required)
- **Tests**: `test/cli-e2e/*.test.ts` (new), existing tests updated to use logger mocks instead of `console.log` spies
- **CI**: No changes to CI pipeline; existing matrix (Linux/macOS/Windows) covers cross-platform validation
