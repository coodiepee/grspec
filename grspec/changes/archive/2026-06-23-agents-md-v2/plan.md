---
type: plan
change: agents-md-v2
created: 2026-06-15
schema: spec-driven
---
## 1. Tech Stack & Git Tooling Detection

- [x] 1.1 Create FRAMEWORK_PACKAGES, TEST_RUNNER_PACKAGES, BUNDLER_PACKAGES lookup maps in generator.ts [AI+review]
- [x] 1.2 Implement detectTechStack function that reads dependencies/devDependencies and returns display names [TDD]
- [x] 1.3 Add engines.node version extraction to detectProjectMetadata [TDD]
- [x] 1.4 Detect git tooling: commitlint/@commitlint/* for Conventional Commits, husky/lint-staged for pre-commit hooks [TDD]
- [x] 1.5 Add techStack, usesConventionalCommits, hasPreCommitHooks fields to ProjectMetadata interface [AI+review]

## 2. AGENTS.md Template Redesign

- [x] 2.1 Replace AgentsMdSections interface: remove definitionOfDone/whenBlocked, add gitWorkflow/boundaries/techStack [AI+review]
- [x] 2.2 Implement buildGitWorkflowSection: Conventional Commits when detected, branch naming, pre-commit commands, merge strategy, hooks note [TDD]
- [x] 2.3 Implement buildBoundariesSection with three-tier emoji system (Always/Ask First/Never) merging old DoD + When Blocked [TDD]
- [x] 2.4 Add tech stack line to assembleAgentsMd header (between description and first section) [AI+review]
- [x] 2.5 Reorder sections in assembleAgentsMd: Commands → Architecture → Code Style → Testing → Git Workflow → Boundaries → grspec Workflow [AI+review]
- [x] 2.6 Update existing generator.test.ts for new sections, section order, and removed sections [TDD]

## 3. Pointer File Generation

- [x] 3.1 Create src/core/agents-md/pointer-files.ts with generateClaudeMd and generateGeminiMd functions [TDD]
- [x] 3.2 Export pointer file generators from agents-md/index.ts [AI+review]
- [x] 3.3 Write pointer-files.test.ts covering content structure, line count, and @AGENTS.md reference [TDD]

## 4. Init Integration

- [x] 4.1 Update init.ts: generate AGENTS.md unconditionally (remove tools-flag dependency if any) [AI+review]
- [x] 4.2 Add pointer file generation to init.ts: conditional on --tools flag matching claude/gemini/all [AI+review]
- [x] 4.3 Update displaySuccessMessage to include pointer file statuses [AI+review]
- [x] 4.4 Write init integration tests for always-generate AGENTS.md and conditional pointer files [TDD]

## 5. Verification

- [x] 5.1 Run pnpm build && pnpm lint && pnpm test — all must pass [manual]
- [x] 5.2 Verify generated AGENTS.md for a sample project stays under 100 lines (72 lines) [manual]
