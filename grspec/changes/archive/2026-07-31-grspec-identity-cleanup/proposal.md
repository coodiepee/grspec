---
type: proposal
change: grspec-identity-cleanup
created: 2026-07-31
schema: spec-driven
---
## Why

The product runtime already self-identifies as grspec, but main specs/wiki still speak OpenSpec, while expired compatibility shims (legacy cleanup, deprecated CLI trees, `tasks.md`, `profile: core`) keep a dual surface that confuses contributors and users. Close the migration window and make grspec the only current identity and CLI contract.

## What Changes

- Rewrite main specs and wiki so the product, paths, and CLI examples say **grspec** (not OpenSpec), except intentional upstream attribution
- **Preserve** README Acknowledgments crediting OpenSpec as the evolutionary upstream
- Rename capability `openspec-conventions` → `grspec-conventions` (new spec; retire old)
- **BREAKING**: Remove `legacy-cleanup` entirely — `init` / `update` no longer detect or clean pre-skills marker-init artifacts
- **BREAKING**: Remove hidden `grspec experimental` alias
- **BREAKING**: Remove deprecated duplicate subcommands under `grspec change` (`show` / `list` / `validate`) and the entire `grspec spec` tree; keep stacking helpers (`overlap` / `graph` / `next` / `split`) until promoted elsewhere
- **BREAKING**: Remove `--requirements-only` alias
- **BREAKING**: Stop reading `tasks.md`; only `plan.md` counts for task progress
- **BREAKING**: Stop accepting `profile: core` (users must use `minimal` / `standard` / `full` / `custom`)
- Delete dead code (`feedback-loop` and any other zero-production-reference modules found in the sweep)
- Align repo hygiene: orphan docs, explorations, `IMPLEMENTATION_ORDER.md`, `.gitignore` for `.grcode/cache` and `.grcode/sessions`, resolve suspended `CHANGELOG.md` / `MAINTAINERS.md` deletion

## Capabilities

### New Capabilities
- `product-identity-grspec`: Rules for product self-identification as grspec in main specs and wiki, and what must remain as historical or third-party OpenSpec mentions
- `grspec-conventions`: Product conventions formerly documented as OpenSpec conventions, restated for grspec

### Modified Capabilities
- `openspec-conventions`: Retire entire capability (replaced by `grspec-conventions`)
- `legacy-cleanup`: Retire entire capability — migration window closed
- `cli-init`: Remove experimental command alias requirement
- `cli-change`: Remove deprecated duplicate show/list/validate (and legacy list bridge); keep overlap/graph/next/split (**BREAKING** for removed subcommands)
- `cli-spec`: Remove deprecated `grspec spec` command tree (**BREAKING**)
- `task-progress-parsing`: Require `plan.md` only; end `tasks.md` dual-read and soft deprecation
- `profile-tiers`: Remove `core` profile alias compatibility

## Domain Context

Affects CLI surface (init, update, change, spec, config/profiles), progress parsing for apply/archive, and the documentation/spec identity of the product. No new domain entities; retires migration and compatibility entities.

## Risk Assessment

- **Impact scope**: Broad — init/update paths, CLI registration, progress utilities, ~35 main specs, wiki pages, selected docs, and tests tied to removed APIs
- **Regression risk**: HIGH for users still on marker-era installs, `tasks.md` changes, `profile: core`, or scripts calling `grspec change` / `grspec spec` / `grspec experimental`. Mitigate with clear BREAKING notes in changelog and README CLI table updates
- **Performance**: Negligible (removes code paths)
- **Coordination**: No active overlapping changes (`grspec change overlap` empty at propose time)
- **False-friend risk**: Do not rewrite `grspec/changes/archive/**` or third-party repo names (e.g. `openspec-schemas`)

## Impact

- **Code**: `src/core/legacy-cleanup.ts` (delete), `src/core/init.ts`, `src/core/update.ts`, `src/commands/change.ts`, `src/commands/spec.ts`, `src/commands/init.ts`, `src/core/profiles.ts`, `src/utils/task-progress.ts`, `src/core/feedback-loop.ts` (delete), CLI registration, related tests
- **Specs**: Main specs/wiki rename pass; capability add/retire listed above
- **Docs**: README (CLI table only; keep Acknowledgments), `docs/grsx.md` / cheatsheet alignment, explorations / IMPLEMENTATION_ORDER cleanup
- **Repo**: `.gitignore` for GRCode runtime cache/sessions; resolve deleted CHANGELOG/MAINTAINERS
