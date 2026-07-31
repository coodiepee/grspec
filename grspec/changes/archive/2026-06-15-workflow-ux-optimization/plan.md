---
type: plan
change: workflow-ux-optimization
created: 2026-06-15
schema: spec-driven
---
## 1. Profile Resolution — Remove CLI Command Gating

- [x] 1.1 Audit CLI command dispatch to confirm no profile-based blocking exists [manual]
- [x] 1.2 Modify profile resolution to clearly separate "skill generation list" from "available commands" [TDD]
- [x] 1.3 Add one-time hint output when a user invokes a CLI command for a workflow not in their profile [TDD]
- [x] 1.4 Update `grspec config profile` help text to describe profiles as recommendation tiers [manual]

## 2. Archive Lightweight Verify Summary

- [x] 2.1 Create `compactVerifySummary(changeDir)` function that returns task-count and requirement-coverage [TDD]
- [x] 2.2 Integrate compact verify call into the archive flow (after spec merge, before move) [TDD]
- [x] 2.3 Add `--skip-verify` flag to `grspec archive` command [TDD]
- [x] 2.4 Write tests for edge cases: no plan, no specs, empty plan, all complete [TDD]

## 3. Archive Completion Feedback

- [x] 3.1 Create `archiveCompletionFeedback(changeDir, mergeResult)` function [TDD]
- [x] 3.2 Extract change age from proposal frontmatter created date [TDD]
- [x] 3.3 List remaining active changes with task progress after archive [TDD]
- [x] 3.4 Integrate feedback output into archive command after successful move [manual]

## 4. Explore Crystallization Criteria

- [x] 4.1 Define crystallization criteria structure in explore skill SKILL.md [manual]
- [x] 4.2 Add crystallization summary format template to SKILL.md [manual]
- [x] 4.3 Add guidance for partial crystallization handling (which criteria are unmet) [manual]
- [x] 4.4 Add re-offer suppression guidance (don't repeat offer until new info) [manual]

## 5. Documentation Updates

- [x] 5.1 Update `docs/workflows.md` to reflect profiles as recommendation tiers [manual]
- [x] 5.2 Update `docs/cheatsheet.md` decision reference to remove profile gate language [manual]
- [x] 5.3 Update `docs/getting-started.md` to present all commands as accessible [manual]
- [x] 5.4 Add archive feedback example to `docs/workflows.md` completion section [manual]
