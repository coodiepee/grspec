---
type: plan
change: standardize-agent-instructions
created: 2026-06-15
schema: spec-driven
---
## 1. Rewrite code-philosophy rule template

- [x] 1.1 Rewrite `getCodePhilosophyRuleContent()` body in `src/core/rule-generation/rule-templates.ts` from prose to DO/DO NOT format with ✓/✗ code examples [AI+review]
- [x] 1.2 Update description field to reflect new format [AI+review]
- [x] 1.3 Update rule-template unit tests in `test/core/` to assert DO/DO NOT structure [TDD]

## 2. Create AGENTS.md generation module

- [x] 2.1 Create `src/core/agents-md/template.ts` with AGENTS.md section templates and code-philosophy summary extractor [AI+review]
- [x] 2.2 Create `src/core/agents-md/generator.ts` with project metadata detection (package.json scripts, src/ dirs) and AGENTS.md assembly [AI+review]
- [x] 2.3 Create `src/core/agents-md/index.ts` barrel export [AI+review]
- [x] 2.4 Write unit tests for metadata detection: package.json with scripts, without scripts, missing package.json, src/ directory scanning [TDD]
- [x] 2.5 Write unit tests for AGENTS.md content assembly: section ordering, placeholder fallbacks, grspec workflow section [TDD]

## 3. Integrate AGENTS.md generation into init

- [x] 3.1 Add AGENTS.md generation step to `InitCommand.execute()` in `src/core/init.ts` — generate on first init, skip in extend mode if file exists, regenerate with --force [AI+review]
- [x] 3.2 Add success message for AGENTS.md in `displaySuccessMessage()` [AI+review]
- [x] 3.3 Write integration test for init with AGENTS.md generation: first run creates file, extend mode skips, --force regenerates [TDD]

## 4. Validation and cross-platform

- [x] 4.1 Run `pnpm build && pnpm lint && pnpm test` and fix any failures [manual]
- [x] 4.2 Verify generated AGENTS.md content manually for a sample project [manual]
