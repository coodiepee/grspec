## 1. Metadata Model

- [ ] 1.1 Add optional stack metadata fields (`dependsOn`, `provides`, `requires`, `touches`, `parent`) to change metadata schema
- [ ] 1.2 Upgrade `touches` schema to file-level entries: `{path, intent, mode}` format
- [ ] 1.3 Keep metadata backward compatible for existing changes without new fields (accept legacy capability-level touches with deprecation warning)
- [ ] 1.4 Add tests for valid/invalid metadata and schema evolution behavior

## 2. Stack-Aware Validation

- [ ] 2.1 Detect dependency cycles and fail validation with deterministic errors
- [ ] 2.2 Detect missing `dependsOn` targets (referenced change ID does not exist) and detect changes transitively blocked by unresolved/cyclic dependency paths
- [ ] 2.3 Add file-level overlap warnings for active changes that declare touches on the same path
- [ ] 2.4 Emit advisory warnings for unmatched `requires` markers when no provider exists in active history
- [ ] 2.5 Warn when touches exceeds 8 entries (suggest splitting)
- [ ] 2.6 Add tests for cycle, missing dependency, file-level overlap warning, max-touches warning, and unmatched `requires` cases

## 3. Sequencing Commands

- [ ] 3.1 Add `grspec change graph` to display dependency order for active changes
- [ ] 3.2 Add `grspec change next` to suggest unblocked changes in recommended order
- [ ] 3.3 Add `grspec change overlap` to display file-level overlap matrix across active changes
- [ ] 3.4 Add tests for topological ordering, deterministic tie-breaking, and overlap matrix output

## 4. Split Scaffolding

- [ ] 4.1 Add `grspec change split <change-id>` to scaffold child slices
- [ ] 4.2 Ensure generated children include parent/dependency metadata and stub proposal/tasks files
- [ ] 4.3 Convert the source change into a parent planning container as part of split (no duplicate child implementation tasks)
- [ ] 4.4 Add tests for split output structure, source-change parent conversion, and deterministic re-split error behavior when overwrite mode is not requested
- [ ] 4.5 Implement and test explicit overwrite mode for `grspec change split` (`--overwrite` / `--force`) for controlled re-splitting

## 5. Documentation

- [ ] 5.1 Document stack metadata and sequencing workflow in `docs/concepts.md`
- [ ] 5.2 Document new change commands and usage examples in `docs/cli.md`
- [ ] 5.3 Add guidance for breaking large changes into independently mergeable slices
- [ ] 5.4 Document migration guidance for `grspec/changes/IMPLEMENTATION_ORDER.md` as optional narrative, not dependency source of truth
- [ ] 5.5 Document git coordination workflow, structured commits, and activity commands
- [ ] 5.6 Document anchors.yaml schema and usage for large codebases

## 6. Git Reconnaissance

- [ ] 6.1 Implement `src/core/git.ts` module with functions for: recent file activity, active branch detection, cross-branch file history
- [ ] 6.2 Integrate git recon into propose workflow (pre-propose context injection)
- [ ] 6.3 Detect hot files (high change frequency + multiple authors within configurable window)
- [ ] 6.4 Detect unmerged branches overlapping with target area
- [ ] 6.5 Add tests for git recon parsing, hot file detection, and branch overlap detection

## 7. Touches Inference (Propose-Time)

- [ ] 7.1 Implement two-phase inference logic: intent → domain keywords → candidate dirs → trace to specific files
- [ ] 7.2 Integrate git history data into inference (prefer git-evidenced impact over pure speculation)
- [ ] 7.3 Enforce precision-over-recall: omit uncertain files, cap at 8 entries
- [ ] 7.4 Implement `grspec/anchors.yaml` parsing and domain-to-file lookup (optional, graceful fallback)
- [ ] 7.5 Auto-detect overlap with other active changes' touches during propose and surface warning in proposal
- [ ] 7.6 Add tests for inference accuracy, anchors fallback, and overlap detection at propose time

## 8. Overlap Coordination (Apply-Time)

- [ ] 8.1 Implement coordination mode selection logic: check overlapping change task status + git merge state
- [ ] 8.2 Implement Extend mode: detect merged branch, read current file state, inject context for building on top
- [ ] 8.3 Implement Prepare mode: detect unmerged branch, inject context for leaving extension points
- [ ] 8.4 Implement Negotiate mode: detect incompatible intents, generate 2-3 resolution options with trade-offs
- [ ] 8.5 Allow user to select suggestion or provide custom input in Negotiate mode; record decision in design.md
- [ ] 8.6 Implement drift detection: compare touched files' git state at propose vs apply time, warn if significant changes occurred
- [ ] 8.7 Add tests for mode selection logic, drift detection, and negotiate option generation

## 9. Structured Commit Generation

- [ ] 9.1 Implement commit message builder: conventional commit header + YAML metadata block
- [ ] 9.2 Classify files from `git diff --name-status` into added/modified/deleted
- [ ] 9.3 Match files to tasks from `tasks.md` and carry intent from touches or task description
- [ ] 9.4 Infer domain from file path (use anchors.yaml when available)
- [ ] 9.5 Generate one commit per task group (heading-level sections in tasks.md)
- [ ] 9.6 Add tests for commit message format, file classification, and task matching

## 10. Activity Command

- [ ] 10.1 Implement `grspec activity --since=<duration> --json` parsing structured commits from git log
- [ ] 10.2 Implement `grspec activity --file <path>` for file-specific activity query
- [ ] 10.3 Implement `grspec activity --hot` for contested file ranking
- [ ] 10.4 Implement `grspec activity --change <name>` for change-specific module summary
- [ ] 10.5 Handle graceful fallback for non-structured commits (skip without error)
- [ ] 10.6 Add tests for activity parsing, aggregation, and edge cases (mixed structured/non-structured history)

## 11. Post-Apply Feedback Loop & Dynamic Touches Update

- [ ] 11.1 Compare predicted touches (from .grspec.yaml) against actual `git diff --name-only` after apply
- [ ] 11.2 Report accuracy metrics: correct predictions, false negatives, false positives
- [ ] 11.3 On false negatives: offer to append newly-discovered files to `.grspec.yaml` touches with inferred intent
- [ ] 11.4 Commit and push updated touches so team sees corrections immediately
- [ ] 11.5 Suggest anchors.yaml updates when recurring false negative patterns are detected
- [ ] 11.6 Add tests for feedback comparison, dynamic update, and anchors suggestion logic

## 12. Auto-Push Integration

- [ ] 12.1 Implement auto-push after structured commit when `grspec.autoPush` is enabled
- [ ] 12.2 Default to prompt-before-push when `autoPush` is not configured
- [ ] 12.3 Handle push failures gracefully (warn, do not roll back local commit, suggest retry)
- [ ] 12.4 Ensure `.grspec.yaml` (with touches) is included in pushed commits for team visibility
- [ ] 12.5 Add tests for auto-push behavior, failure handling, and configuration toggle

## 13. Branch Naming Convention

- [ ] 13.1 Suggest `grspec/<change-name>` branch creation when starting apply without a feature branch
- [ ] 13.2 Record branch name in `.grspec.yaml` under `branch` field (for non-convention branch names)
- [ ] 13.3 Use branch naming convention in git recon for automatic branch-to-change association
- [ ] 13.4 Fall back to `.grspec.yaml` recorded branch name when convention does not match
- [ ] 13.5 Add tests for branch naming suggestion, recording, and recon association

## 14. Touches Synchronization

- [ ] 14.1 Ensure `.grspec.yaml` is committed alongside proposal.md during propose
- [ ] 14.2 Implement remote touches discovery: `git fetch` + read `.grspec.yaml` from remote branches (without local checkout)
- [ ] 14.3 Include fetched remote touches in overlap detection alongside local active changes
- [ ] 14.4 Handle stale/unreachable remote branches gracefully (warn, skip)
- [ ] 14.5 Add tests for remote touches fetch, parsing, and overlap integration

## 15. Configurable Recon Parameters

- [ ] 15.1 Add `grspec.recon.window` config (default "2w", accept git duration format)
- [ ] 15.2 Add `grspec.recon.hotThreshold` config (default: 3 changes, 2 authors)
- [ ] 15.3 Add `grspec.autoPush` config (default: false)
- [ ] 15.4 Read configs from project-level `.grspec.yaml` or global grspec config
- [ ] 15.5 Add tests for config parsing and default fallback behavior

## 16. Verification

- [ ] 16.1 Run targeted tests for all new modules (git, inference, coordination, commits, activity, push, sync)
- [ ] 16.2 Run full test suite (`pnpm test`) and resolve regressions
- [ ] 16.3 End-to-end test: propose with git recon → apply with coordination → structured commit → auto-push → activity query from another agent perspective
