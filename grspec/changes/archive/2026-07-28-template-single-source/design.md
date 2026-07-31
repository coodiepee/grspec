---
type: design
change: template-single-source
created: 2026-07-28
schema: spec-driven
---
## Context

`loadWorkflowTemplate` already powers skill instructions and UI/onboard commands. Core workflow command factories still embed large template literals that drifted from `content/*.md`. Parity tests hash skill and command payloads **separately** and only assert shared UI phrases exist on both sides — locking divergence in place. UI subcommands prove the target pattern: one md file, both factories load it, tests assert `===`.

## Goals / Non-Goals

**Goals:**
- One Markdown file per shared workflow narrative; skill and command bodies byte-identical.
- Wiki slash bodies extracted to dedicated content files; no INLINE command bodies in `workflows/*.ts`.
- Content quality pass (merge, delivery-neutral verbs, drop legacy dual-read teaching, drop Task/subagent, AskUserQuestion consistency).
- Strict automated guards: identity parity + content smell tests; full lint/test/build green before done.
- Regenerated `.cursor` artifacts only via generators — no hand-maintained dual copy.

**Non-Goals:**
- Removing CLI `schemaVersion` v1 graph or `ui-detected` / `ui.detected` dual-read in runtime/Zod (separate change).
- Splitting `grspec-wiki` into per-subcommand skills (optional future); this change only single-sources command bodies.
- Rewriting onboard slash cheat sheets to CLI-only (onboard MAY keep `/grsx:` tables as Cursor teaching).
- Changing command-generation adapters or delivery profile semantics.

## Decisions

### Decision 1: Full single source (option A)

**Choice:** `CommandTemplate.content = loadWorkflowTemplate(name)` for every workflow that today embeds a full INLINE body, matching the paired skill’s content name.

**Alternatives:** (B) md body + thin slash prefix wrapper; (C) keep dual track with sync tooling.

**Why A:** UI already shipped A; wrappers reintroduce drift; sync tooling failed (phrase checks). Byte identity is the only enforceable contract.

### Decision 2: Content merge policy

**Choice:** Start from current `content/*.md` (skill source). Diff against former INLINE command bodies; **keep** fuller operational sections from md; **port** superior archive multi-outcome output blocks from INLINE; then apply quality rules from `workflow-template-content`.

**Why:** Skill text is generally more complete for apply; archive INLINE had richer success/error templates. Blind “delete INLINE” would lose good archive UX copy.

### Decision 3: Wiki content layout

**Choice:**
- `content/wiki.md` — hub skill (+ hub command loads same file under A).
- `content/wiki-init.md`, `wiki-ingest.md`, `wiki-lint.md`, `wiki-query.md`, `wiki-sync.md`, `wiki-status.md` — extracted from current INLINE (enriched from `wiki.md` sections where INLINE was a stub).

**Why:** Mirrors UI multi-file layout without forcing a wiki skill split in this change.

### Decision 4: Parity test shape

**Choice:** Extend `ui-templates-parity` style to a `workflow-templates-parity` (or expand existing) matrix: for each pair, `expect(skill.instructions).toBe(command.content)` and `.toBe(loadWorkflowTemplate(...))`. Replace “UI phrases on both sides” as the **primary** guard. Keep/adjust content hashes only **after** identity holds (hashes become a change-detection aid, not a license for divergence).

**Content guards:** dedicated test asserts absence of `Task tool`, `subagent_type`, and legacy dual-read teaching phrases in scoped content files.

### Decision 5: Deployed copies

**Choice:** After TypeScript + content freeze, regenerate this repo’s `.cursor/commands` and `.cursor/skills` through the same generation path init/update uses. Implementation tasks SHALL NOT hand-edit generated bodies except via regenerating from templates.

**Why:** Hand edits are how a fourth copy appears.

### Decision 6: Verification bar (完整测试结果)

**Choice:** Change is not complete until:
1. New/updated parity + guard tests pass.
2. `pnpm run lint && pnpm run test && pnpm run build` all succeed.
3. Plan records the command outputs (or CI-equivalent) as the verification evidence.

**Why:** User-required clean engineering + complete test results; template churn touches many snapshot hashes.

### Decision 7: Validate vs verify packaging

**Choice:**
- CLI `grspec validate` ↔ skill `grspec-validate` ↔ `/grsx:validate` — structural specs/deltas only.
- Skill `grspec-verify` ↔ `/grsx:verify` (content `verify.md`) — artifact completeness/correctness/coherence + build/test/lint evidence gate.
- Delete `verify-gate` workflow id and the old standalone evidence-only skill body; remove legacy dir `grspec-verify-change` on init/update.

**Why:** Two names for the same gate (`verify` vs `verify-gate`) confused agents and docs; CLI already owns structural validation as `validate`. Content/factory names use `verify` (symmetric with `validate`).

### Decision 8: Packaging hygiene after single-source

**Choice:**
- `COMMAND_IDS` and `WORKFLOW_TO_COMMAND_IDS.wiki` include the wiki hub id so install/deselect stay consistent with `getCommandTemplates`.
- `RETIRED_WORKFLOW_IDS` / `sanitizeWorkflowIds` strip `verify-gate` from custom config on read/save.
- Keep `LEGACY_VERIFY_CHANGE_SKILL_DIR` removal shim until installs have migrated.

## Schema Changes

None.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| Content merge + quality edits | AI+review | Per-file merge from INLINE diffs |
| `workflows/*.ts` load wiring | TDD | Failing identity tests first |
| Wiki content files | AI+review | Extract then load |
| Parity + guard tests | TDD | Expand UI pattern |
| Hash refresh | AI+review | After content freeze only |
| `.cursor` regenerate | AI+review | Generator path only |

## Risks / Trade-offs

- **[Risk] Slash users see longer prompts** → Accept; identical to skills is the product decision (A). Mitigate with clear content editing, not a second short track.
- **[Risk] Hash test churn masks real regressions** → Land identity assertions first; refresh hashes in one commit/task after freeze.
- **[Risk] Incomplete INLINE port loses archive output templates** → Explicit merge checklist in plan for archive.
- **[Risk] Stale main specs still say `design-system/` / `ui-detected`** → This change’s deltas cover template packaging + content teaching; runtime CLI dual-read cleanup stays out of scope (documented Non-Goal).
