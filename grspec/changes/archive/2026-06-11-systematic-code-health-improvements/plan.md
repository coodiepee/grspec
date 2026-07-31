---
type: plan
change: systematic-code-health-improvements
created: 2026-06-11
schema: spec-driven
---

## 1. Error Handling Layer

- [x] 1.1 Create `src/utils/command-error.ts` with `handleCommandError(error, context)` function [TDD]
- [x] 1.2 Create `test/utils/command-error.test.ts` with tests for Error, non-Error, and JSON-mode scenarios [TDD]
- [x] 1.3 Extract `init` command from inline `cli/index.ts` to `src/commands/init.ts` using `registerInitCommand()` pattern, adopting unified error handler [AI+review]
- [x] 1.4 Extract `update` command from inline `cli/index.ts` to `src/commands/update.ts` using `registerUpdateCommand()` pattern [AI+review]
- [x] 1.5 Extract `list` command from inline `cli/index.ts` to `src/commands/list.ts` using `registerListCommand()` pattern [AI+review]
- [x] 1.6 Extract `view` command from inline `cli/index.ts` to `src/commands/view.ts` using `registerViewCommand()` pattern [AI+review]
- [x] 1.7 Extract `archive` command from inline `cli/index.ts` to `src/commands/archive.ts` using `registerArchiveCommand()` pattern [AI+review]
- [x] 1.8 Extract `validate` top-level command to `src/commands/validate.ts` `registerValidateCommand()` [AI+review]
- [x] 1.9 Extract `show` top-level command to `src/commands/show.ts` `registerShowCommand()` [AI+review]
- [x] 1.10 Extract `feedback` command to `src/commands/feedback.ts` `registerFeedbackCommand()` [AI+review]
- [x] 1.11 Extract `completion` command group to `src/commands/completion.ts` `registerCompletionCommand()` [AI+review]
- [x] 1.12 Extract `status`, `instructions`, `templates`, `schemas`, `new` commands to use `registerWorkflowCommands()` [AI+review]
- [x] 1.13 Extract `activity` command to `src/commands/activity.ts` `registerActivityCommand()` [AI+review]
- [x] 1.14 Refactor `cli/index.ts` to only contain program setup + registration calls (target: <150 lines) [AI+review]
- [x] 1.15 Verify all 1851 tests still pass after CLI decomposition [manual]

## 2. Structured Logger

- [x] 2.1 Create `src/utils/logger.ts` with `Logger` class supporting `debug/info/warn/error` and silent mode [TDD]
- [x] 2.2 Create `test/utils/logger.test.ts` with tests for level filtering, silent mode, and capture [TDD]
- [x] 2.3 Add `--verbose` global flag to CLI program definition [AI+review]
- [x] 2.4 Migrate `src/core/init.ts` from `console.log/error` to logger (34 calls) [AI+review]
- [x] 2.5 Migrate `src/core/update.ts` from `console.log/error` to logger (47 calls) [AI+review]
- [x] 2.6 Migrate `src/core/archive.ts` from `console.log/error` to logger (46 calls) [AI+review]
- [x] 2.7 Migrate `src/commands/config.ts` from `console.log/error` to logger (52 calls) [AI+review]
- [x] 2.8 Migrate `src/commands/ui.ts` from `console.log/error` to logger (84 calls) [AI+review]
- [x] 2.9 Migrate remaining `src/commands/*.ts` files to logger [AI+review]
- [x] 2.10 Migrate remaining `src/core/*.ts` files to logger [AI+review]
- [x] 2.11 Update test files that spy on `console.log` to use logger capture instead [AI+review]
- [x] 2.12 Verify all tests pass after logger migration [manual]

## 3. Type Safety (no-explicit-any elimination)

- [x] 3.1 Fix `error: any` patterns in `src/utils/file-system.ts` (5 occurrences) — use `unknown` + type guards [TDD]
- [x] 3.2 Fix `error: any` patterns in `src/core/legacy-cleanup.ts` (4 occurrences) [TDD]
- [x] 3.3 Fix `error: any` patterns in `src/core/completions/installers/*.ts` (8 occurrences across 4 files) [AI+review]
- [x] 3.4 Fix remaining `: any` annotations in `src/core/view.ts`, `src/commands/show.ts`, `src/commands/validate.ts` [AI+review]
- [x] 3.5 Fix `: any` in `src/cli/index.ts` (2 occurrences) [AI+review]
- [x] 3.6 Enable `@typescript-eslint/no-explicit-any` as `warn` in eslint config [AI+review]
- [x] 3.7 Verify no new any regressions — all lint warnings accounted for [manual]

## 4. Template Extraction

- [x] 4.1 Create `src/core/templates/loader.ts` with `loadWorkflowTemplate(name)` using `import.meta.url` resolution [TDD]
- [x] 4.2 Create `test/core/templates/loader.test.ts` with tests for loading, missing files, and whitespace trimming [TDD]
- [x] 4.3 Extract `src/core/templates/workflows/explore.ts` (469 lines) to `explore.md` + thin loader [AI+review]
- [x] 4.4 Extract `src/core/templates/workflows/onboard.ts` (574 lines) to `onboard.md` + thin loader [AI+review]
- [x] 4.5 Extract `src/core/templates/workflows/bulk-archive-change.ts` (496 lines) to `bulk-archive-change.md` + thin loader [AI+review]
- [x] 4.6 Extract all 22 workflow template files to `.md` + thin loaders [AI+review]
- [x] 4.7 Update `build.js` to copy `.md` content files to `dist/` [manual]
- [x] 4.8 Verify output parity: all 19 skills and 24 commands load correctly at runtime [TDD]
- [x] 4.9 Verify all 1884 tests pass after template extraction [manual]

## 5. E2E Test Coverage

- [x] 5.1 E2E init tests already in `test/cli-e2e/basic.test.ts` (16 tests covering --help, --version, init options) [TDD]
- [x] 5.2 Create `test/cli-e2e/update.test.ts` testing `grspec update` on an initialized project [TDD]
- [x] 5.3 E2E validate tests already in `test/cli-e2e/basic.test.ts` (validate --all --json, unknown item) [TDD]
- [x] 5.4 Create `test/cli-e2e/archive.test.ts` testing `grspec archive` end-to-end flow [TDD]
- [x] 5.5 Create `test/cli-e2e/workflow.test.ts` testing `grspec new/status/instructions/schemas` flow [TDD]
- [x] 5.6 Verify all 26 E2E tests pass (109 test files, 1894 tests total) [manual]

## 6. Cleanup & Documentation

- [x] 6.1 Consolidate deprecated `grspec experimental` alias: extracted shared `runInit()` helper [AI+review]
- [x] 6.2 Verified `grspec change list/show/validate` handlers show deprecation warnings and share `ChangeCommand` [AI+review]
- [x] 6.3 Enable `prefer-const` ESLint rule as `warn` [AI+review]
- [x] 6.4 Enable `no-empty` ESLint rule as `warn` [AI+review]
- [x] 6.5 Run full test suite + lint on all platforms, confirm green [manual]
