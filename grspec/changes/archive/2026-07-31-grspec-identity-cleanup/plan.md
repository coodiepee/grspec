## 1. Phase 1 — Product identity (grspec naming)

- [x] 1.1 Rewrite OpenSpec product language to grspec in `grspec/specs/**` (paths, CLI examples, product name); skip allowlisted third-party names [AI+review]
- [x] 1.2 Rewrite OpenSpec product language to grspec in `grspec/wiki/**` with the same allowlist rules [AI+review]
- [x] 1.3 Ensure README Acknowledgments still credit OpenSpec upstream; do not treat that credit as a defect [manual]
- [x] 1.4 Confirm `rg 'openspec|OpenSpec' grspec/specs grspec/wiki` leftovers are only allowlisted or intentional historical notes [AI+review]
- [x] 1.5 Add/keep delta specs for `product-identity-grspec` and `grspec-conventions`; retire `openspec-conventions` requirements via delta already in this change [AI+review]

## 2. Phase 2 — Dead code

- [x] 2.1 Delete `src/core/feedback-loop.ts` and `test/core/feedback-loop.test.ts` [TDD]
- [x] 2.2 Re-scan `src/` for modules with zero production imports (test-only or none); delete confirmed dead modules + tests [AI+review]
- [x] 2.3 Run unit tests for touched areas and fix fallout [TDD]

## 3. Phase 3 — Compatibility removal

- [x] 3.1 Remove `legacy-cleanup` module, init/update integration, and `test/core/legacy-cleanup.test.ts` [TDD]
- [x] 3.2 Remove hidden `grspec experimental` alias from init command registration + tests [TDD]
- [x] 3.3 Remove `grspec change show|list|validate` and `--requirements-only`; keep `overlap|graph|next|split`; update completions registry [TDD]
- [x] 3.4 Unregister entire `grspec spec` command tree; update completions and tests [TDD]
- [x] 3.5 Change task progress helpers to read `plan.md` only; update `task-progress` tests [TDD]
- [x] 3.6 Remove `profile: core` alias; treat as invalid; update profile/config tests [TDD]
- [x] 3.7 Remove obsolete LEGACY_UI_HUB / verify-gate cleanup branches only if unused after 3.1–3.6 [AI+review]

## 4. Phase 4 — Alignment

- [x] 4.1 Align or delete `docs/grsx.md` and link/remove `docs/cheatsheet.md` from README as decided in review [AI+review]
- [x] 4.2 Remove or supersede `grspec/explorations/*` and delete `grspec/changes/IMPLEMENTATION_ORDER.md` [AI+review]
- [x] 4.3 Add `.grcode/cache/` and `.grcode/sessions/` to `.gitignore`; leave skills/commands/rules installable [AI+review]
- [x] 4.4 Resolve suspended `CHANGELOG.md` / `MAINTAINERS.md` deletion (commit deletion or restore) [manual]
- [x] 4.5 Update README CLI reference table and wiki log/overview for BREAKING removals [AI+review]
- [x] 4.6 Run `pnpm run lint && pnpm run test && pnpm run build` and fix failures [TDD]

## UI

- [x] UI.1 No UI work — ui.md Status is `na` [manual]
