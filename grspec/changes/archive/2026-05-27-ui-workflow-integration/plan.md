## 1. UI Content Detection Module

- [x] 1.1 Create `src/core/ui/detect.ts` with curated keyword list and `detectUiContent(text)` function [TDD]
- [x] 1.2 Add `detectUiContentInChange(changeDir)` that reads proposal.md and design.md from a change directory [TDD]
- [x] 1.3 Export detection functions from `src/core/ui/index.ts` barrel file [manual]

## 2. Instruction Generation Hooks

- [x] 2.1 Modify `generateInstructions` in `src/core/artifact-graph/instruction-loader.ts` to call `detectUiContentInChange` when `artifactId === 'design'` and append UI supplementary instruction block [TDD]
- [x] 2.2 Modify `generateApplyInstructions` in `src/commands/workflow/instructions.ts` to scan `<changeDir>/design-system/` for MASTER.md and add discovered `.md` files to `contextFiles` [TDD]
- [x] 2.3 Append UI-specific guidance to apply instruction text when `design-system` key is present in `contextFiles` [TDD]

## 3. Metadata and Skill Updates

- [x] 3.1 Extend `.grspec.yaml` metadata parsing in `src/utils/change-metadata.ts` to support optional `ui-detected: boolean` field [AI+review]
- [x] 3.2 Update `grspec-ui` skill template in `src/core/templates/workflows/ui.ts` to include workflow integration guidance (when to persist, how design-system feeds into apply) [AI+review]
- [x] 3.3 Add integration tests covering the full flow: proposal with UI keywords → design instructions enriched → design-system persisted → apply instructions include context [TDD]
