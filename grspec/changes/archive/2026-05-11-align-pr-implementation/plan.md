## 1. Profile System Restructuring

- [x] 1.1 Define `MINIMAL_WORKFLOWS`, `STANDARD_WORKFLOWS`, `FULL_WORKFLOWS` constant arrays in `src/core/profiles.ts` [TDD]
- [x] 1.2 Update `Profile` type to accept `minimal | standard | full | custom` (plus deprecated `core`) [TDD]
- [x] 1.3 Update `getProfileWorkflows()` to resolve the four tiers and handle `core` → `standard` alias with deprecation warning [TDD]
- [x] 1.4 Update global config schema/types to accept new profile values [AI+review]
- [x] 1.5 Update `grspec init --tools` to use new profile resolution when determining which skills to generate [TDD]

## 2. Artifact Gate Enforcement

- [x] 2.1 Add dependency completeness check in `grspec instructions` command — refuse output when upstream artifacts are missing [TDD]
- [x] 2.2 Add `--force` flag to `grspec instructions` to bypass dependency check with warning [TDD]
- [x] 2.3 Wire `workflow.gates` config reading into instruction gate logic (read from `readProjectConfig`) [TDD]
- [x] 2.4 Ensure gate file-existence checks use `path.join()` for cross-platform compatibility [TDD]

## 3. Archive Gate Strengthening

- [x] 3.1 Refactor archive task-completion check to hard-block by default (exit non-zero when incomplete items in plan.md or tasks.md) [TDD]
- [x] 3.2 Add `--force` flag to archive that overrides the hard block with a warning [TDD]
- [x] 3.3 Add plan.md checkbox parsing alongside existing tasks.md parsing in archive [TDD]

## 4. Schema Template Enrichment

- [x] 4.1 Add Domain Context and Risk Assessment sections to `schemas/spec-driven/templates/proposal.md` [AI+review]
- [x] 4.2 Add Schema Changes and Implementation Strategy sections to `schemas/spec-driven/templates/design.md` [AI+review]
- [x] 4.3 Update proposal instruction text in `schemas/spec-driven/schema.yaml` to reference new sections [AI+review]
- [x] 4.4 Update design instruction text in `schemas/spec-driven/schema.yaml` to reference new sections [AI+review]

## 5. Apply Skill Strategy Routing

- [x] 5.1 Rewrite `.cursor/skills/grspec-apply-change/SKILL.md` to include strategy detection and routing logic [AI+review]
- [x] 5.2 Add per-strategy sub-sections that reference grspec-tdd, grspec-review, grspec-verify skills [AI+review]
- [x] 5.3 Update the apply skill template in `src/core/templates/workflows/apply.ts` to match the rewritten skill [AI+review]

## 6. Documentation Alignment

- [x] 6.1 Add per-section status annotations to `docs/pr.md` (`[Implemented]`, `[Partial]`, `[Planned]`, `[Deferred]`) [manual]
- [x] 6.2 Update pr.md §2.6 collaboration infrastructure to clarify CLI vs Skill responsibility boundary [manual]
- [x] 6.3 Add "last audited" date to pr.md header and update status line from "Implemented in v2.0" to accurate description [manual]

## 7. Collaboration Config Cleanup

- [x] 7.1 Add code comment in `src/core/project-config.ts` marking `collaboration` section as reserved for future use [AI+review]
- [x] 7.2 Verify no code in `src/` consumes collaboration config values (audit and document) [manual]
