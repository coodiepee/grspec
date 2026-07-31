---
type: design
change: grspec-identity-cleanup
created: 2026-07-31
schema: spec-driven
---
## Context

Runtime code already uses grspec naming (`src/` / `test/` have zero OpenSpec string matches). Residue is concentrated in:

1. Main specs + wiki still authored in OpenSpec product language
2. Compatibility shims whose migration windows the product owner has closed
3. Dead modules and repo hygiene leftovers

Decisions locked in exploration: keep README OpenSpec acknowledgment; delete `legacy-cleanup` (window closed).

## Goals / Non-Goals

**Goals:**
- Main specs/wiki self-identify as grspec
- Retire closed-window compatibility surfaces with matching tests
- Remove confirmed dead code
- Align docs/gitignore/suspended git deletes with the new contract

**Non-Goals:**
- Rewriting `grspec/changes/archive/**`
- Renaming third-party repos/packages that literally contain `openspec`
- Removing README OpenSpec acknowledgment
- Redesigning workspace beta behavior
- Promoting `change overlap|graph|next|split` to new top-level verbs (keep under `grspec change` for now)
- Full restatement of every former `openspec-conventions` paragraph into `grspec-conventions` (Phase 1 rewrite pass keeps detailed normative text in the renamed/rewritten main-spec tree)

## Decisions

### D1: Capability split for conventions
- **Choice**: ADD `grspec-conventions` (slim verb-first + structure contract) and REMOVE all requirements from `openspec-conventions`; Phase 1 rewrite pass updates remaining main specs in place.
- **Alternatives**: In-place edit of `openspec-conventions` only — rejected because the capability id itself embeds OpenSpec.
- **SHALL**: After archive, `grspec/specs/openspec-conventions/` MUST be gone; `grspec-conventions` MUST exist.

### D2: legacy-cleanup deletion
- **Choice**: Delete `src/core/legacy-cleanup.ts` and all init/update call sites + tests.
- **Alternatives**: Rename-and-keep for one more major — rejected; owner closed the window.
- **SHALL**: `grspec init` / `grspec update` MUST NOT prompt for or perform marker-era cleanup.

### D3: Partial `grspec change` retention
- **Choice**: Remove only duplicate show/list/validate (and legacy list bridge / `--requirements-only`). Keep `overlap`, `graph`, `next`, `split`.
- **Alternatives**: Delete entire `change` command — rejected; propose/skills still rely on `change overlap` and stacking helpers have no verb-first home yet.
- **SHALL**: `grspec change show|list|validate` MUST be absent; stacking helpers MUST remain.

### D4: `grspec spec` removal
- **Choice**: Unregister entire `spec` command tree.
- **SHALL**: Users MUST use verb-first show/list/validate for specs.

### D5: tasks.md hard cut
- **Choice**: Progress parsers read `plan.md` only; ignore `tasks.md` without dual-read.
- **Alternatives**: Hard-fail if only `tasks.md` exists — deferred; ignoring is enough for the cut and avoids blocking unrelated commands that call progress helpers.

### D6: profile `core` hard cut
- **Choice**: Treat `core` as invalid (same path as unknown profiles).
- **SHALL**: No silent alias to `standard`.

### D7: Identity rename pass mechanics
- **Choice**: Mechanical rewrite of `openspec`/`OpenSpec`/`openspec/` in `grspec/specs/**` and `grspec/wiki/**` with allowlist for third-party names; never touch archive.
- **SHOULD**: Prefer path/`grspec` CLI consistency over clever partial rewrites.

### D8: Dead code sweep
- **Choice**: Delete `feedback-loop` first; re-run zero-production-reference scan before finishing Phase 2.
- **SHALL NOT**: Delete modules still imported by init/update/CLI.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| Spec/wiki rename | AI+review | Bulk edit + spot-check scenarios |
| legacy-cleanup removal | TDD | Fail tests that assert cleanup, then delete |
| CLI deprecations | TDD | Update command registration + e2e/unit |
| task-progress / profiles | TDD | Existing unit tests drive cut |
| Dead code + hygiene | AI+review | feedback-loop, gitignore, docs |

## Risks / Trade-offs

- [Users on marker-era installs break on init] → Document BREAKING in changelog; README note that manual cleanup is required
- [Scripts calling `grspec change show|list|validate` or `grspec spec …` fail] → README CLI table + cheatsheet update; keep overlap helpers
- [Incomplete openspec-conventions content in slim replacement] → Phase 1 rewrite keeps detailed requirements alive in other main specs; conventions capability is the naming/CLI contract hub
- [Bulk rename false positives in wiki/sources] → Allowlist third-party and historical evolution pages; human review of `rg` leftovers
- [Large PR] → Implement strictly Phase 1→2→3→4; do not interleave

## Migration Plan

1. Land code + specs behind one change; publish BREAKING notes with 0.x bump as appropriate
2. No automated upgrade path for marker-era or `tasks.md` / `profile: core`
3. Rollback: revert the release commit; archive history unchanged so historical OpenSpec text remains recoverable from archive/

## Open Questions

None — product decisions locked (keep acknowledgment; close legacy-cleanup window; four-phase order).
