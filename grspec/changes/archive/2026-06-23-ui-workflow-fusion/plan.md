---
type: plan
change: ui-workflow-fusion
created: 2026-06-23
schema: spec-driven
---
# Implementation Plan

## 1. Content Template: Propose UI Detection

- [x] 1.1 Add UI detection step to `src/core/templates/content/propose.md` — insert after artifact creation loop, before "Infer touches" step. Port Step 6 from the command template in `src/core/templates/workflows/propose.ts` [AI+review]
- [x] 1.2 Add the same UI detection step to `src/core/templates/content/ff-change.md` — insert before "Show final status" step [AI+review]
- [x] 1.3 Sync the command template in `src/core/templates/workflows/propose.ts` inline content with any refinements made to the content template [AI+review]

## 2. Content Template: Apply UI Context

- [x] 2.1 Update "Read context files" step in `src/core/templates/content/apply-change.md` — add guidance for `design-system` key in contextFiles, instruct agent to reference design tokens when implementing UI tasks [AI+review]
- [x] 2.2 Update "After EVERY task" checklist in `src/core/templates/content/apply-change.md` — add conditional `grspec ui review <path>` when design-system context is present [AI+review]

## 3. Content Template: Verify UI Quality

- [x] 3.1 Add UI Quality step to `src/core/templates/content/verify-change.md` — insert after Coherence (Step 7), before "Generate Verification Report" [AI+review]
- [x] 3.2 Update summary scorecard in verify template to include conditional fourth "UI Quality" row [AI+review]

## 4. CLI: Inline CRITICAL Rules in Apply Instructions

- [x] 4.1 Add `.grspec.yaml` metadata reader in `src/commands/workflow/instructions.ts` to detect `ui-detected: true` [TDD] — already implemented (lines 398-405)
- [x] 4.2 Load CRITICAL-severity rules via `loadRules()` + `filterBySeverity()` and embed them inline in the `instruction` field when `ui-detected: true` [TDD] — already implemented (lines 413-426)
- [x] 4.3 Verify existing behavior unchanged when `ui-detected` is not set (regression test) [TDD] — tests exist in test/core/ui/workflow-integration.test.ts

## 5. Sync Command Templates

- [x] 5.1 Verify `src/core/templates/workflows/apply-change.ts` inline command content matches updated `content/apply-change.md` [AI+review]
- [x] 5.2 Verify `src/core/templates/workflows/verify-change.ts` inline command content matches updated `content/verify-change.md` [AI+review]

## 6. Deploy

- [x] 6.1 Regenerate skill files — copy updated content templates to `.cursor/skills/grspec-propose/SKILL.md`, `.cursor/skills/grspec-ff-change/SKILL.md`, `.cursor/skills/grspec-apply-change/SKILL.md`, `.cursor/skills/grspec-verify-change/SKILL.md` [AI+review]
- [x] 6.2 Run `pnpm run lint && pnpm run test && pnpm run build` to verify no regressions [manual] — parity + UI workflow tests pass; 7 failures are pre-existing (powershell-installer build error, init --tools)
