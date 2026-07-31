---
type: plan
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## 1. Schema v2 and version resolution

- [x] 1.1 Freeze `schemas/spec-driven/v1/schema.yaml` (4-artifact v1 copy) [AI+review]
- [x] 1.2 Bump main `schemas/spec-driven/schema.yaml` to v2 with `ui` artifact; `plan.requires: [specs, design, ui]` [AI+review]
- [x] 1.3 Add `schemas/spec-driven/templates/ui.md` and extend `plan.md` template with `## UI` note [AI+review]
- [x] 1.4 Add `resolveChangeSchemaVersion` + version-aware `resolveSchema` / `loadTemplate` [TDD]
- [x] 1.5 Add `schemaVersion: 2` to `createChange`; extend `ChangeMetadataSchema` [TDD]
- [x] 1.6 Expose `schemaVersion` in `grspec status --json` [TDD]

## 2. UI artifact core

- [x] 2.1 Implement `parseUiArtifactStatus` + `isUiFoundationReady` in `src/core/ui/ui-artifact.ts` [TDD]
- [x] 2.2 Implement `resolveEffectiveUiActive` (v2 ui.md precedence, v1 metadata fallback) [TDD]
- [x] 2.3 Add `ui` to `ARTIFACT_TYPE_MAP` in instruction-loader [AI+review]

## 3. UI context paths (`grspec/ui/`)

- [x] 3.1 Add `src/core/ui/ui-context.ts` — discover change `ui.md`, `ui/pages/`, project `grspec/ui/` [TDD]
- [x] 3.2 Rewire `generateApplyInstructions`: `contextFiles.ui`, apply JSON fields, `effectiveUiActive` CRITICAL rules [TDD]
- [x] 3.3 Remove `enrichDesignInstructionWithUi` and design-system discovery from instruction-loader [AI+review]
- [x] 3.4 Update `init.ts`, `status.ts`, `persist.ts` for flat `grspec/ui/` and page-only change persist [TDD]

## 4. Metadata cleanup

- [x] 4.1 Remove `ui.autoGenerate` from `UiMetadataSchema` and all readers [TDD]
- [x] 4.2 Update workflow-integration tests for new apply/ui behavior [TDD]

## 5. Hub removal and profile multi-skill

- [x] 5.1 Add `WORKFLOW_TO_SKILL_DIRS` + `getSkillDirsForWorkflow`; update profile-sync-drift, update, init, migration [TDD]
- [x] 5.2 Remove hub `grspec-ui` / `grsx-ui` from skill-generation, COMMAND_IDS, WORKFLOW_TO_COMMAND_IDS [TDD]
- [x] 5.3 Delete `content/ui.md` hub template; update parity/skill-template tests [TDD]

## 6. Workflow content templates

- [x] 6.1 Update propose/ff/continue — detect only, no persist/autoGenerate; continue blocked→done [AI+review]
- [x] 6.2 Update apply/verify/archive/onboard templates — `effectiveUiActive`, `contextFiles.ui` [AI+review]
- [x] 6.3 Sync `workflows/*.ts` and `.cursor` deployed copies [AI+review]

## 7. Platform export

- [x] 7.1 Update `ui-platform-export` installer — multi sub-skill bundle, no monolithic hub [TDD]

## 8. Verification

- [x] 8.1 Run `pnpm run lint && pnpm run test && pnpm run build` [manual]
- [x] 8.2 Delta spec coverage checklist [AI+review]
