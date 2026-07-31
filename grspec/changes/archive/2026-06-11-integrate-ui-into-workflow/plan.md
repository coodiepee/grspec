---
type: plan
change: integrate-ui-into-workflow
created: 2026-06-11
schema: spec-driven
---
## 1. Detection Threshold Upgrade

- [x] 1.1 Update `detectUiContent()` in `src/core/ui/detect.ts` to require ≥3 keyword matches for `detected: true` [TDD]
- [x] 1.2 Update existing detection tests to reflect the new threshold behavior [TDD]

## 2. CLI: `grspec ui detect` Subcommand

- [x] 2.1 Add `detect` subcommand to `src/commands/ui.ts` with `--change` and `--json` flags [AI+review]
- [x] 2.2 Add tests for the detect subcommand (JSON output, human-readable, error cases) [TDD]

## 3. Design Phase Enrichment Upgrade

- [x] 3.1 Refactor `enrichDesignInstructionWithUi()` in `src/core/artifact-graph/instruction-loader.ts` to check for `design-system/MASTER.md` first, then fall back to detection-based advisory [AI+review]
- [x] 3.2 Add helper `extractDesignTokenSummary(masterPath)` to extract key tokens from MASTER.md for inline reference [AI+review]
- [x] 3.3 Update instruction-loader tests for the three conditional paths (design-system exists, UI detected, no UI) [TDD]

## 4. Apply Phase CRITICAL Rules Enrichment

- [x] 4.1 In `generateApplyInstructions()` in `src/commands/workflow/instructions.ts`, read `ui-detected` from `.grspec.yaml` and embed CRITICAL-severity rules inline when true [AI+review]
- [x] 4.2 Add tests verifying inline rules appear when `ui-detected` is set, and are absent otherwise [TDD]

## 5. Propose Workflow Hook

- [x] 5.1 Update the propose workflow template (`src/core/templates/workflows/propose.ts` or content file) to include the UI detection and design-system generation step after proposal creation [AI+review]
- [x] 5.2 Update the propose skill (`grsx-propose.md`) to include the UI detection step with `grspec ui detect --change --json` and conditional design-system generation [AI+review]

## 6. Verify Workflow Hook

- [x] 6.1 Update the verify skill (`grsx-verify.md` or `SKILL.md`) to include a UI Quality sub-check under Coherence when `ui-detected` is true or touches include UI files [AI+review]

## 7. Command Surface Collapse

- [x] 7.1 Rewrite `.cursor/commands/grsx-ui.md` as a smart routing entry point (natural language → CLI subcommand dispatch) [AI+review]
- [x] 7.2 Delete `.cursor/commands/grsx-ui-rules.md`, `grsx-ui-reference.md`, `grsx-ui-status.md`, `grsx-ui-install.md`, `grsx-ui-sync.md` [AI+review]
- [x] 7.3 Update `.cursor/skills/grspec-ui/SKILL.md` Workflow Integration section to reflect the new hooks and collapsed command surface [AI+review]
- [x] 7.4 Update `src/core/templates/workflows/ui.ts` to generate only 2 command templates instead of 7 [AI+review]

## 8. Verification

- [x] 8.1 Run full test suite (`pnpm test`) to verify no regressions [AI+review]
- [x] 8.2 Run build (`pnpm build`) to verify compilation [AI+review]
- [x] 8.3 Manual smoke test: run `grspec ui detect --change` on an existing change to verify output [manual]
