# Plan: Change Stacking & Git-Aware Coordination

## 1. Metadata Model

- [x] 1.1 [TDD] Add optional stack metadata fields (`dependsOn`, `provides`, `requires`, `touches`, `parent`) to change metadata schema
- [x] 1.2 [TDD] Upgrade `touches` schema to file-level entries: `{path, intent, mode}` format
- [x] 1.3 [TDD] Keep metadata backward compatible for existing changes without new fields (accept legacy capability-level touches with deprecation warning)
- [x] 1.4 [TDD] Add tests for valid/invalid metadata and schema evolution behavior

## 2. Stack-Aware Validation

- [x] 2.1 [TDD] Detect dependency cycles and fail validation with deterministic errors
- [x] 2.2 [TDD] Detect missing `dependsOn` targets (referenced change ID does not exist) and detect changes transitively blocked by unresolved/cyclic dependency paths
- [x] 2.3 [TDD] Add file-level overlap warnings for active changes that declare touches on the same path
- [x] 2.4 [TDD] Emit advisory warnings for unmatched `requires` markers when no provider exists in active history
- [x] 2.5 [TDD] Warn when touches exceeds 8 entries (suggest splitting)
- [x] 2.6 [TDD] Add tests for cycle, missing dependency, file-level overlap warning, max-touches warning, and unmatched `requires` cases

## 3. Sequencing Commands

- [x] 3.1 [TDD] Add `grspec change graph` to display dependency order for active changes
- [x] 3.2 [TDD] Add `grspec change next` to suggest unblocked changes in recommended order
- [x] 3.3 [TDD] Add `grspec change overlap` to display file-level overlap matrix across active changes
- [x] 3.4 [TDD] Add tests for topological ordering, deterministic tie-breaking, and overlap matrix output

## 4. Split Scaffolding

- [x] 4.1 [TDD] Add `grspec change split <change-id>` to scaffold child slices
- [x] 4.2 [TDD] Ensure generated children include parent/dependency metadata and stub proposal/tasks files
- [x] 4.3 [AI+review] Convert the source change into a parent planning container as part of split (no duplicate child implementation tasks)
- [x] 4.4 [TDD] Add tests for split output structure, source-change parent conversion, and deterministic re-split error behavior when overwrite mode is not requested
- [x] 4.5 [TDD] Implement and test explicit overwrite mode for `grspec change split` (`--overwrite` / `--force`) for controlled re-splitting

## 5. Documentation

- [x] 5.1 [AI+review] Document stack metadata and sequencing workflow in `docs/concepts.md`
- [x] 5.2 [AI+review] Document new change commands and usage examples in `docs/cli.md`
- [x] 5.3 [AI+review] Add guidance for breaking large changes into independently mergeable slices
- [x] 5.4 [AI+review] Document migration guidance for `grspec/changes/IMPLEMENTATION_ORDER.md` as optional narrative, not dependency source of truth
- [x] 5.5 [AI+review] Document git coordination workflow, structured commits, and activity commands
- [x] 5.6 [AI+review] Document anchors.yaml schema and usage for large codebases

## 6. Git Reconnaissance

- [x] 6.1 [TDD] Implement `src/core/git.ts` module with functions for: recent file activity, active branch detection, cross-branch file history
- [x] 6.2 [AI+review] Integrate git recon into propose workflow (pre-propose context injection)
- [x] 6.3 [TDD] Detect hot files (high change frequency + multiple authors within configurable window)
- [x] 6.4 [TDD] Detect unmerged branches overlapping with target area
- [x] 6.5 [TDD] Add tests for git recon parsing, hot file detection, and branch overlap detection

## 7. Touches Inference (Propose-Time)

- [x] 7.1 [AI+review] Implement two-phase inference logic: intent → domain keywords → candidate dirs → trace to specific files
- [x] 7.2 [AI+review] Integrate git history data into inference (prefer git-evidenced impact over pure speculation)
- [x] 7.3 [AI+review] Enforce precision-over-recall: omit uncertain files, cap at 8 entries
- [x] 7.4 [TDD] Implement `grspec/anchors.yaml` parsing and domain-to-file lookup (optional, graceful fallback)
- [x] 7.5 [AI+review] Auto-detect overlap with other active changes' touches during propose and surface warning in proposal
- [x] 7.6 [TDD] Add tests for inference accuracy, anchors fallback, and overlap detection at propose time

## 8. Overlap Coordination (Apply-Time)

- [x] 8.1 [TDD] Implement coordination mode selection logic: check overlapping change task status + git merge state
- [x] 8.2 [AI+review] Implement Extend mode: detect merged branch, read current file state, inject context for building on top
- [x] 8.3 [AI+review] Implement Prepare mode: detect unmerged branch, inject context for leaving extension points
- [x] 8.4 [AI+review] Implement Negotiate mode: detect incompatible intents, generate 2-3 resolution options with trade-offs
- [x] 8.5 [AI+review] Allow user to select suggestion or provide custom input in Negotiate mode; record decision in design.md
- [x] 8.6 [TDD] Implement drift detection: compare touched files' git state at propose vs apply time, warn if significant changes occurred
- [x] 8.7 [TDD] Add tests for mode selection logic, drift detection, and negotiate option generation

## 9. Structured Commit Generation

- [x] 9.1 [TDD] Implement commit message builder: conventional commit header + YAML metadata block
- [x] 9.2 [TDD] Classify files from `git diff --name-status` into added/modified/deleted
- [x] 9.3 [TDD] Match files to tasks from `tasks.md` and carry intent from touches or task description
- [x] 9.4 [TDD] Infer domain from file path (use anchors.yaml when available)
- [x] 9.5 [AI+review] Generate one commit per task group (heading-level sections in tasks.md)
- [x] 9.6 [TDD] Add tests for commit message format, file classification, and task matching

## 10. Activity Command

- [x] 10.1 [TDD] Implement `grspec activity --since=<duration> --json` parsing structured commits from git log
- [x] 10.2 [TDD] Implement `grspec activity --file <path>` for file-specific activity query
- [x] 10.3 [TDD] Implement `grspec activity --hot` for contested file ranking
- [x] 10.4 [TDD] Implement `grspec activity --change <name>` for change-specific module summary
- [x] 10.5 [TDD] Handle graceful fallback for non-structured commits (skip without error)
- [x] 10.6 [TDD] Add tests for activity parsing, aggregation, and edge cases (mixed structured/non-structured history)

## 11. Post-Apply Feedback Loop

- [x] 11.1 [TDD] Compare predicted touches (from .grspec.yaml) against actual `git diff --name-only` after apply
- [x] 11.2 [TDD] Report accuracy metrics: correct predictions, false negatives, false positives
- [x] 11.3 [AI+review] Suggest anchors.yaml updates when recurring false negative patterns are detected
- [x] 11.4 [TDD] Add tests for feedback comparison and anchors suggestion logic

## 12. Verification

- [x] 12.1 [AI+review] Run targeted tests for all new modules (git, inference, coordination, commits, activity)
- [x] 12.2 [AI+review] Run full test suite (`pnpm test`) and resolve regressions
- [x] 12.3 [AI+review] End-to-end test: propose with git recon → apply with coordination → structured commit → activity query
