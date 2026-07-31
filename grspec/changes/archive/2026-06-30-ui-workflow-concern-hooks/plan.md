---
type: plan
change: ui-workflow-concern-hooks
created: 2026-06-30
schema: spec-driven
---
## 1. Structured UI Metadata

- [x] 1.1 Add `ui` object to `ChangeMetadataSchema` in `src/core/artifact-graph/types.ts` (`detected`, `keywords`, `autoGenerate`) while keeping legacy `ui-detected` [TDD]
- [x] 1.2 Extend `readChangeMetadata` / parsed output with `uiDetected` and `uiKeywords` — dual-read `ui.detected` and `ui-detected`, `ui` block takes precedence [TDD]
- [x] 1.3 Add unit tests for metadata parsing: ui block, legacy field, precedence, empty keywords [TDD]
- [x] 1.4 Update `generateApplyInstructions` in `instructions.ts` to use unified metadata reader instead of raw `metadata?.['ui-detected']`; regression: CRITICAL rules still embed when UI active [TDD]

## 2. Design System Inheritance

- [x] 2.1 Extract `findProjectDesignSystemMaster(projectRoot)` — prefer `detectDesignSystem()` path; fallback to first `grspec/design-system/<slug>/MASTER.md` via `path.join` [TDD]
- [x] 2.2 Extend `generateApplyInstructions` contextFiles discovery: change-level first, project-level fallback when change has no MASTER; instruction text notes project paths when applicable [TDD]
- [x] 2.3 Add integration tests in `test/core/ui/workflow-integration.test.ts` for project fallback and change-level priority [TDD]
- [x] 2.4 Extend `enrichDesignInstructionWithUi` in `instruction-loader.ts` to reference project-level MASTER when change-level absent and UI is active [AI+review]
- [x] 2.5 Add design enrichment test for project-level MASTER inheritance [TDD]

## 3. Workflow Template Sync

- [x] 3.1 Update content templates: `propose.md`, `ff-change.md`, `apply-change.md`, `verify-change.md`, `continue-change.md`, `archive-change.md` — structured `ui` metadata, catch-up detect, review gate, archive soft gate [AI+review]
- [x] 3.2 Align `workflows/propose.ts` and `workflows/ff-change.ts` Output sections with content templates (UI detection result line) [AI+review]
- [x] 3.3 Align `.cursor/commands/grsx-propose.md` and `grsx-ff.md` Output sections with content templates [AI+review]
- [x] 3.4 Sync remaining `workflows/*.ts` and deployed commands/skills for apply, verify, continue, archive [AI+review]
- [x] 3.5 Update `test/core/templates/skill-templates-parity.test.ts` — refresh `EXPECTED_FUNCTION_HASHES` after workflow template changes; add UI phrase assertions for six workflows [TDD]

## 4. Verification

- [x] 4.1 Run `pnpm run lint && pnpm run test && pnpm run build` and fix any regressions [manual]
- [x] 4.2 Delta spec coverage checklist [AI+review]:
  | Capability | Verification |
  |------------|--------------|
  | `ui-metadata-schema` | plan 1.3 unit tests |
  | `design-system-inheritance` | plan 2.3, 2.5 integration tests |
  | `workflow-template-sync` | plan 3.5 parity hashes + UI phrase assertions |
  | `continue-ui-catchup` | plan 3.5 phrase `UI catch-up detection` |
  | `propose-ui-hook` | plan 3.5 phrase `after artifact loop` |
  | `apply-ui-context` | plan 1.4 + 2.2 + plan 3.5 phrase `grspec ui review` |
  | `verify-ui-quality` | plan 3.5 phrase `Verify UI Quality` |
  | `design-phase-ui-hook` | plan 2.4 enrichment test |
  | `design-system-artifact` | plan 2.1–2.2 contextFiles tests |
