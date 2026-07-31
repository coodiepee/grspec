---
type: plan
change: expand-ui-subcmd-system
created: 2026-06-05
schema: spec-driven
---
## 1. Data Preparation

- [x] 1.1 Extract Quick Reference rules from ui-ux-pro-max-skill into `assets/ui/data/rules.csv` (columns: Category, RuleID, Platform, Severity, Short, Do, Dont, Reference) [manual]
- [x] 1.2 Create `assets/ui/UPSTREAM.md` with version 2.5.0, sync date, source metadata [manual]
- [x] 1.3 Remove `assets/ui/data/draft.csv` (confirmed duplicate of design.csv) [manual]
- [x] 1.4 Copy platform template JSONs from ui-ux-pro-max-skill to `assets/ui/templates/` (cursor, windsurf, copilot, kiro, roocode, claude, codex, opencode, trae, qoder, etc.) and adapt for grspec output [manual]

## 2. Core Modules — Rules

- [x] 2.1 Create `src/core/ui/rules.ts` — loadRules, filterByCategory, filterByPlatform, filterBySeverity, searchRules (BM25), formatChecklist [TDD]
- [x] 2.2 Create `test/core/ui/rules.test.ts` — unit tests for all filter/search combinations [TDD]

## 3. Core Modules — Reference

- [x] 3.1 Create `src/core/ui/reference.ts` — parseDesignCsv (split into style blocks), buildStyleIndex, getStyleSpec, searchStyles, listStyles [TDD]
- [x] 3.2 Create `test/core/ui/reference.test.ts` — unit tests for parsing, indexing, lookup [TDD]

## 4. Core Modules — Review

- [x] 4.1 Create `src/core/ui/review.ts` — scanFiles, checkCursorPointer, checkEmojiIcons, checkTransitionTiming, checkReducedMotion, aggregateFindings [TDD]
- [x] 4.2 Create `test/core/ui/review.test.ts` — unit tests with fixture code snippets [TDD]

## 5. Core Modules — Status

- [x] 5.1 Create `src/core/ui/status.ts` — detectDesignSystem, detectActiveChangeUi, readUpstreamVersion, buildStatusReport [TDD]
- [x] 5.2 Create `test/core/ui/status.test.ts` — unit tests with mock filesystem [TDD]

## 6. Core Modules — Installer

- [x] 6.1 Create `src/core/ui/installer.ts` — loadPlatformTemplate, assembleSkillContent, writePlatformSkill, listPlatforms [TDD]
- [x] 6.2 Create `test/core/ui/installer.test.ts` — unit tests for template assembly and path generation [TDD]

## 7. Core Modules — Sync

- [x] 7.1 Create `src/core/ui/sync.ts` — resolveUpstreamPath, diffFiles, copyFiles, updateUpstreamMd [TDD]
- [x] 7.2 Create `test/core/ui/sync.test.ts` — unit tests for diff logic and UPSTREAM.md generation [TDD]

## 8. CLI Registration

- [x] 8.1 Register `grspec ui rules` subcommand in `src/commands/ui.ts` with all options (--platform, --severity, --search, --checklist, --json) [AI+review]
- [x] 8.2 Register `grspec ui reference` subcommand with options (--list, --search, --section, --json) [AI+review]
- [x] 8.3 Register `grspec ui review` subcommand with options (--platform, --checklist, --json) [AI+review]
- [x] 8.4 Register `grspec ui status` subcommand with --json option [AI+review]
- [x] 8.5 Register `grspec ui install` subcommand with options (--platform, --list, --output, --with-rules, --force) [AI+review]
- [x] 8.6 Register `grspec ui sync` subcommand with options (--check, --force, --from) [AI+review]
- [x] 8.7 Update `src/core/ui/index.ts` to export all new modules [AI+review]

## 9. Command & Skill Templates

- [x] 9.1 Add `getGrsxUiRulesCommandTemplate`, `getGrsxUiReferenceCommandTemplate`, `getGrsxUiReviewCommandTemplate`, `getGrsxUiStatusCommandTemplate`, `getGrsxUiInstallCommandTemplate`, `getGrsxUiSyncCommandTemplate` to `src/core/templates/workflows/ui.ts` [AI+review]
- [x] 9.2 Update `getUiSkillTemplate()` to include all new subcommands and restore complete Quick Reference (100+ rules with [App]/[Web]/[Both] markers) [AI+review]
- [x] 9.3 Export new command templates from `src/core/templates/skill-templates.ts` [AI+review]

## 10. Skills

- [x] 10.1 Update `.cursor/skills/grspec-ui/SKILL.md` — add rules, reference, review, status, install, sync documentation + restore full Quick Reference [AI+review]
- [x] 10.2 Create `.cursor/skills/grspec-ui-review/SKILL.md` — agent-driven UX review workflow [AI+review]

## 11. Modified Capabilities

- [x] 11.1 Update `src/core/artifact-graph/instruction-loader.ts` — add rules recommendation to apply instruction when design-system context is present [AI+review]
- [x] 11.2 Update design-phase UI hook to recommend `grspec ui reference` after style is chosen [AI+review]
- [x] 11.3 Update tests in `test/core/ui/workflow-integration.test.ts` for new instruction content [TDD]

## 12. Integration Testing

- [x] 12.1 Create `test/commands/ui-expanded.test.ts` — CLI integration tests for rules, reference, review, status subcommands [TDD]
- [x] 12.2 Run full test suite and verify no regressions (existing 102 UI tests + new tests pass) [manual]
- [x] 12.3 Manual smoke test: `grspec ui rules accessibility`, `grspec ui reference "Bauhaus"`, `grspec ui status`, `grspec ui sync --check` [manual]
