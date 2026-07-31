---
type: design
change: systematic-code-health-improvements
created: 2026-06-11
schema: spec-driven
---

## Context

grspec is a CLI tool (~32K LoC, 182 source files, 103 test files) that generates AI assistant instructions for spec-driven development. It supports 30+ AI tools via an adapter architecture and has been growing rapidly, adding features like wiki support, UI design systems, change stacking, and workspace management.

The codebase is functionally correct (1851 tests pass, lint is clean) but has accumulated structural debt:
- No error handling abstraction (151+ inconsistent catch blocks)
- No logger (700+ `console.log/error/warn` calls)
- Several files exceeding 500-900 lines with mixed responsibilities
- 22 workflow template files embedding ~4700 lines of Markdown in TypeScript strings
- 4 disabled ESLint rules including `no-explicit-any`

These issues compound as more contributors and AI tool adapters are added.

## Goals / Non-Goals

### Goals
- Establish consistent error handling and logging patterns across the CLI
- Decompose oversized files into focused, testable modules
- Extract template content from code to reduce compilation coupling
- Enable gradual `any`-type elimination without blocking other work
- Maintain 100% backward compatibility with the existing CLI interface

### Non-Goals
- Rewriting the CLI framework (Commander.js stays)
- Changing the public API surface or output format
- Adding new user-facing features (this is purely internal quality)
- Removing deprecated commands (only consolidating their implementations)
- Refactoring the command-generation adapter system (covered by `unify-template-generation-pipeline`)

## Decisions

### D1: Error handler as a thin wrapper function, not middleware

**Choice**: A `handleCommandError(error, context)` function imported by each command module.

**Alternative considered**: Commander.js middleware/hook approach — rejected because Commander's `postAction` hook doesn't catch exceptions from async action handlers, requiring manual try/catch regardless.

**Alternative considered**: Custom `Command` subclass with automatic error wrapping — rejected because it adds a layer of indirection that makes debugging harder and doesn't compose well with Commander's hook system.

**Rationale**: A plain function is the simplest pattern that works with Commander's async action model, is easily testable, and is incrementally adoptable (one command at a time).

### D2: Logger built internally, no new dependency

**Choice**: A ~60-line logger module in `src/utils/logger.ts` wrapping `console.log/error/warn` with level filtering.

**Alternative considered**: `pino`, `winston`, `consola` — rejected because the CLI is not a long-running server. A full logging library adds dependency weight for features (transports, serializers, child loggers) that are unnecessary. The CLI's logging needs are: level filtering, color awareness, test silencing.

**Rationale**: grspec already uses `chalk` for colors and `ora` for spinners. The logger only needs to add level gating and a test-friendly capture mechanism.

### D3: CLI decomposition via register functions, not auto-discovery

**Choice**: Each command group exports a `registerXCommand(program: Command)` function. The CLI entry file calls them explicitly.

**Alternative considered**: Auto-discovery via `fs.readdir` + dynamic `import()` — rejected because it makes the command set implicit (harder to debug, harder to tree-shake, harder to understand boot order).

**Rationale**: Several command groups (`spec`, `config`, `schema`, `workspace`, `wiki`, `ui`) already use the `registerXCommand` pattern. This decision codifies the existing pattern and extends it to the commands currently defined inline in `cli/index.ts`.

### D4: Template extraction uses `__dirname`-relative file loading

**Choice**: Template `.md` files live in a `templates/` directory co-located with the compiled JS. The loader resolves paths via `import.meta.url` + `path.resolve`.

**Alternative considered**: Bundling templates into a JSON/JS module at build time — rejected because it re-introduces the coupling between template content and compilation.

**Alternative considered**: Loading from the `schemas/` directory — rejected because workflow skill templates are distinct from schema artifact templates.

**Rationale**: Using `import.meta.url` for path resolution is the standard ESM approach, works cross-platform, and keeps templates editable without recompilation during development.

### D5: Phased rollout with independent PRs

**Choice**: Implement in 5 independent phases (error handler → logger → CLI decomposition → template extraction → type safety). Each phase is a self-contained PR that can be reviewed, tested, and merged independently.

**Rationale**: The cross-cutting nature of these changes means a single large PR would be unreviewable. Independent phases also allow parallel work and make rollback surgical.

## Risks / Trade-offs

- [Test churn] → Error handler and logger changes will require updating many test files that mock `console.log` or assert on `process.exit`. Mitigation: Create test utilities (`expectCommandError`, `captureLogOutput`) first, then migrate tests alongside source.
- [Template loading performance] → Reading `.md` files from disk adds I/O per command invocation. Mitigation: Templates are small (<1KB each) and loaded once per invocation. Benchmarking shows <1ms for file reads of this size. If needed, add in-memory caching.
- [Stale change overlap] → The `unify-template-generation-pipeline` change (0/24 tasks) has overlapping scope with template extraction. Mitigation: Template extraction is scoped to skill/workflow templates only. If the other change activates, coordinate via `dependsOn` metadata.
- [Migration window] → During the migration period, the codebase will have a mix of old (`console.log` + inline error handling) and new (logger + unified handler) patterns. Mitigation: A lint rule or grep-based CI check can track migration progress.

## Open Questions

- Should deprecated command aliases (e.g., `grspec experimental`, `grspec change list`) be removed in a major version bump, or kept indefinitely with warnings? This decision affects whether `legacy-cleanup.ts` can eventually be deleted.
- Should the logger support structured JSON output for CI/automation consumers, or is plain text sufficient?
