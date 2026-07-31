## 1. Template Updates

- [x] 1.1 Update `schemas/spec-driven/templates/design.md` to add normative terminology guidance in Decisions and Risks section comments [AI+review]
- [x] 1.2 Update `schemas/spec-driven/templates/plan.md` to list the four canonical strategy tags (`codegen`, `TDD`, `AI+review`, `manual`) with definitions in comments [AI+review]
- [x] 1.3 Update `schemas/spec-driven/schema.yaml` design artifact instruction to include RFC 2119 normative vocabulary guidance [manual]
- [x] 1.4 Update `schemas/spec-driven/schema.yaml` plan artifact instruction to recommend imperative mood and reference the four canonical strategy tags [manual]

## 2. Frontmatter Injection

- [x] 2.1 Add `injectFrontmatter(artifactId, context)` helper to `src/core/artifact-graph/instruction-loader.ts` that constructs YAML frontmatter from artifact type, change name, current date, and schema name [TDD]
- [x] 2.2 Integrate `injectFrontmatter` into `generateInstructions` to prepend frontmatter to the `template` field, with idempotency check (skip if template already starts with `---`) [TDD]
- [x] 2.3 Add unit tests for frontmatter injection: correct fields per artifact type, `specs` → `spec` type mapping, idempotency, date format [TDD]

## 3. tasks.md Deprecation and Skill Template Cleanup

- [x] 3.1 Update `getTaskProgressForChange` and `getIncompleteItemsForChange` in `src/utils/task-progress.ts` to emit `console.warn` when `tasks.md` is found (with or without `plan.md`) [TDD]
- [x] 3.2 Replace all `tasks.md` references with `plan.md` in skill template files: `archive-change.ts`, `continue-change.ts`, `verify-change.ts`, `propose.ts`, `bulk-archive-change.ts`, `onboard.ts`, `explore.ts` [AI+review]
- [x] 3.3 Update `tasks.md` references in `src/commands/schema.ts`, `src/commands/change.ts`, `src/core/split.ts`, and `src/commands/workflow/instructions.ts` where contextually appropriate [AI+review]
- [x] 3.4 Add unit tests for deprecation warnings: tasks.md only, both files present, plan.md only (no warning) [TDD]
