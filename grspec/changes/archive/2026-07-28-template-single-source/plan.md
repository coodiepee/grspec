---
type: plan
change: template-single-source
created: 2026-07-28
schema: spec-driven
---
## 1. Failing parity contract (TDD)

- [x] 1.1 Add workflow skill↔command↔file byte-identity tests for every paired factory (apply, archive, bulk-archive, continue, explore, ff, new, propose, sync, verify, onboard) mirroring `ui-templates-parity` [TDD]
- [x] 1.2 Add wiki hub + subcommand load-identity tests (`wiki`, `wiki-init`, … `wiki-status`) expecting `loadWorkflowTemplate` equality [TDD]
- [x] 1.3 Add content-guard tests forbidding `Task tool` / `subagent_type` and legacy dual-read teaching phrases (`v1: ui.detected`, `legacy ui-detected`) in apply/archive/verify/continue content [TDD]
- [x] 1.4 Confirm new tests fail on current tree (dual-source / smells present) before implementation [TDD]

## 2. Content consolidation and quality

- [x] 2.1 Merge apply/continue/ff/propose/verify content: keep skill depth; apply quality rules (CLI-primary verbs, `effectiveUiActive` / `ui.md` Status only, AskUserQuestion consistency) [AI+review]
- [x] 2.2 Merge archive (+ bulk-archive if needed): port INLINE multi-outcome output templates; remove Task/subagent sync dispatch; AskUserQuestion on all confirmation gates; dedupe Verification Gate heading / step numbers [AI+review]
- [x] 2.3 Extract `content/wiki-init.md` … `wiki-status.md` from INLINE + enrich from `wiki.md`; set hub so `wiki.md` serves skill + hub command [AI+review]
- [x] 2.4 Sweep remaining paired content files (explore, new-change, sync-specs) for delivery-neutral wording and smell guards [AI+review]

## 3. Loader wiring (clean engineering)

- [x] 3.1 Replace INLINE `content: \`...\`` in core `workflows/*.ts` command factories with `loadWorkflowTemplate(...)` matching the skill content name [TDD]
- [x] 3.2 Wire wiki command factories to dedicated content files; delete INLINE bodies [TDD]
- [x] 3.3 Ensure no residual full-body command template literals remain under `src/core/templates/workflows/` (except non-body metadata) [AI+review]

## 4. Parity suite cleanup

- [x] 4.1 Remove or demote “phrases on both sides” as the primary dual-source guard; identity tests are authoritative [TDD]
- [x] 4.2 Refresh `EXPECTED_FUNCTION_HASHES` / generated skill hashes in `skill-templates-parity` **after** content+wiring freeze (single coordinated update) [AI+review]

## 5. Regenerate deployed copies

- [x] 5.1 Regenerate this repo’s `.cursor/commands` and `.cursor/skills` via the project’s generation/update path — do not hand-edit generated bodies [AI+review]
- [x] 5.2 Spot-check apply/archive/verify/wiki-init: command file body matches `content/*.md` [AI+review]

## 6. Validate ↔ verify alignment (cut redundancy)

- [x] 6.1 Merge evidence gate into `content/verify.md`; skill name `grspec-verify` (retire `verify-gate` packaging) [AI+review]
- [x] 6.2 Add `content/validate.md` + validate skill/command factories; register in skill-generation, profiles, tool-detection, profile-sync-drift [TDD]
- [x] 6.3 Remove `verify-gate` from `ALL_WORKFLOWS` / standard; remove legacy `grspec-verify-change` on init/update [TDD]
- [x] 6.4 Refresh parity hashes; regenerate `.cursor` + `.grcode` with **local** built CLI; update wiki/delta specs [AI+review]
- [x] 6.5 Packaging cleanup: wiki hub registries; sanitize retired `verify-gate`; rename factories/content to `verify`; legacy-dir unit tests [TDD]

## UI

- [x] UI.1 None — `ui.md` Status is `na` [manual]

## 7. Verification (完整测试结果 — required)

- [x] 7.1 Run `pnpm run lint` and capture clean result [manual]
- [x] 7.2 Run `pnpm run test` and capture full pass (including new parity + guards) [manual]
- [x] 7.3 Run `pnpm run build` and capture success [manual]
- [x] 7.4 Record lint/test/build outcomes below before archive [manual]

## Verification evidence (2026-07-28)

| Command | Result |
|---------|--------|
| `pnpm run lint` | exit 0 — 0 errors, 1 pre-existing `prefer-const` warning in `instructions.ts` |
| `pnpm run test` | exit 0 — **126** files, **2141** tests passed |
| `pnpm run build` | exit 0 — TypeScript compile + content copy (includes `validate.md`, `verify.md`) |

Spot-check: `.cursor/commands/grsx-{validate,verify}.md` and skills `grspec-{validate,verify}` bodies byte-match `content/{validate,verify}.md`. Legacy `grspec-verify-change` removed. No `verify-gate` in profiles.
