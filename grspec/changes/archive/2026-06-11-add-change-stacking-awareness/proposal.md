## Why

Parallel changes often touch the same capabilities and `cli-init`/`cli-update` behavior, but today there is no machine-readable way to express sequencing, dependencies, or expected merge order. In multi-person teams, core modules are frequently modified by multiple changes simultaneously, and AI agents have no structured way to detect or coordinate around these conflicts.

This creates four recurring problems:

- teams cannot tell which change should land first
- large changes are hard to split into safe mergeable slices
- parallel work can accidentally reintroduce assumptions already removed by another change
- AI agents working on different changes modify the same files without awareness of each other's intent, causing preventable git conflicts

We need lightweight planning metadata, git-aware coordination intelligence, and structured commit conventions so contributors and their AI agents can safely stack plans on top of each other and proactively coordinate on shared modules.

## What Changes

### 1. Add lightweight stack metadata for changes

Extend change metadata to support sequencing and decomposition context, for example:

- `dependsOn`: changes that must land first
- `provides`: capability markers exposed by this change
- `requires`: capability markers needed by this change
- `touches`: file-level impact declarations with intent (see section 6)
- `parent`: optional parent change for split work

Metadata is optional and backward compatible for existing changes.

Ordering semantics:

- `dependsOn` is the source of truth for execution/archive ordering
- `provides`/`requires` are capability contracts for validation and planning visibility
- `provides`/`requires` do not create implicit dependency edges; authors must still declare required ordering via `dependsOn`

### 2. Add stack-aware validation

Enhance change validation to detect planning issues early:

- missing dependencies
- dependency cycles
- archive ordering violations (for example, attempting to archive a change before all `dependsOn` predecessors are archived)
- unmatched capability markers (for example, `requires` marker with no provider in active history emits non-blocking warning)
- overlap warnings when active changes touch the same file (based on `touches` metadata and git branch analysis)

Validation should fail only for deterministic blockers (for example cycles or missing required dependencies), and keep overlap checks as actionable warnings.

### 3. Add sequencing visibility commands

Add lightweight CLI support to inspect and execute plan order:

- `grspec change graph` to show dependency DAG/order
- `grspec change graph` validates for cycles first; when cycles are present it fails with the same deterministic cycle error as stack-aware validation
- `grspec change next` to suggest unblocked changes ready to implement/archive

### 4. Add split scaffolding for large changes

Add helper workflow to decompose large proposals into stackable slices:

- `grspec change split <change-id>` scaffolds child changes with `parent` + `dependsOn`
- generates minimal proposal/tasks stubs for each child slice
- converts the source change into a parent planning container (no duplicate child implementation tasks)
- re-running split for an already-split source change returns a deterministic actionable error unless `--overwrite` (alias `--force`) is passed
- `--overwrite` / `--force` fully regenerates managed child scaffold stubs and metadata links for the split, replacing prior scaffold content

### 5. Document stack-first workflow

Update docs to describe:

- how to model dependencies and parent/child slices
- when to split a large change
- how to use graph/next validation signals during parallel development
- migration guidance for `grspec/changes/IMPLEMENTATION_ORDER.md`:
  - machine-readable change metadata becomes the normative dependency source
  - `IMPLEMENTATION_ORDER.md` remains optional narrative context during transition

### 6. Add file-level touches with intent (AI-inferred at propose time)

Upgrade `touches` from capability-level advisory to file-level impact declarations with semantic intent:

```yaml
touches:
  - path: src/api/middleware/index.ts
    intent: "Register rate-limit middleware before auth in chain"
    mode: modify
  - path: src/config/rate-limits.ts
    intent: "Define per-environment rate limit thresholds"
    mode: create
```

Inference mechanism:

- AI infers touches automatically during `/grsx:propose` by analyzing the intent against the codebase structure
- Two-phase inference: (1) intent → domain keywords → candidate directories, (2) read entry files → trace to specific files
- Precision over recall: only include files with high or medium confidence; false negatives are acceptable, false positives create noise
- Maximum 8 files per change; if more are needed, suggest splitting the change
- Optional `grspec/anchors.yaml` provides domain-to-file mappings to improve inference accuracy for large codebases

Overlap detection:

- When a proposed change's touches overlap with another active change's touches (same file path), emit a coordination warning
- The warning includes the overlapping change name, author, and their declared intent for that file
- Overlap is advisory (does not block), but is surfaced prominently in the proposal

### 7. Add git-aware pre-propose reconnaissance

Before generating a proposal, gather structured intelligence from git history to inform impact analysis and detect in-flight parallel work:

Sources:

- `git log --since=<window> --name-only` — recent file-level activity and authors
- `git branch -r --no-merged main` — active unmerged feature branches
- `git log --all --name-only -- <target-dirs>` — cross-branch activity in the target area
- `git blame <file>` — ownership context for contested files

Output (injected into AI context for proposal generation):

- Hot files: files with high change frequency and multiple recent authors
- Active branches: unmerged branches with their last commit time and affected files
- Recent commits in target area: who changed what, with commit message context

This enables the AI to:

- Detect parallel work even from team members not using grspec (via git branch analysis)
- Recommend timing (wait for a branch to merge, or implement against its interface)
- Adjust the technical approach based on recent architectural changes
- Accurately infer touches using real activity data rather than pure speculation

### 8. Add overlap coordination modes for apply

When `/grsx:apply` encounters a file with known overlap, the AI selects a coordination mode:

- **Extend**: The overlapping change is already implemented (merged or committed). Read the current code state and build on top of it.
- **Prepare**: The overlapping change is not yet implemented. Write code that leaves extension points or uses abstractions compatible with the other change's declared intent.
- **Negotiate**: The intents are structurally incompatible. Generate 2-3 resolution options with trade-offs and allow the user to select or provide custom input.

Decision inputs:

- Overlapping change's task completion status (from their `tasks.md`)
- Git state: has the overlapping branch been merged to main?
- Both changes' delta specs and design.md for intent comparison

When negotiate mode is triggered, the AI presents options and the user can auto-select a suggestion or provide a custom approach. The chosen resolution is recorded in `design.md` as a coordination decision.

### 9. Add structured commit generation (post-apply)

After successful apply and test verification, automatically generate structured git commits that embed semantic metadata from the change lifecycle:

Commit message format:

```
feat(<change-name>): <summary from task group>

Implements task group <N>: <group heading from tasks.md>
- <task 1>
- <task 2>

---
grspec: <change-name>
task-group: <N>
modules:
  added:
    - path: <file>
      domain: <inferred from path>
      intent: <one-sentence verb-first description>
  modified:
    - path: <file>
      domain: <inferred from path>
      intent: <one-sentence verb-first description>
  deleted: []
---
```

Generation logic:

1. Read `git diff --name-status` to classify files as added/modified/deleted
2. Match each file to its corresponding task from `tasks.md`
3. Infer domain from file path conventions
4. Carry intent from `touches` metadata or generate from task description
5. Compose structured commit with YAML metadata block

Commit granularity: one commit per task group (heading-level sections in `tasks.md`). Each commit is self-contained and represents a coherent unit of work.

### 10. Add `grspec activity` command for structured git consumption

Provide a CLI command that aggregates structured commit data for fast, zero-diff consumption by agents:

```bash
grspec activity --since=2w --json
```

Output:

```json
{
  "changes": [
    {
      "name": "add-oauth",
      "author": "Alice",
      "commits": 4,
      "modules": {
        "added": ["src/auth/strategies/oauth.ts"],
        "modified": ["src/api/middleware/index.ts"],
        "deleted": []
      },
      "intents": {
        "src/api/middleware/index.ts": "Register OAuth in middleware chain"
      },
      "last_commit": "2025-01-22T14:30:00Z",
      "status": "applied"
    }
  ],
  "hot_files": [
    {
      "path": "src/api/middleware/index.ts",
      "changes": ["add-oauth", "add-rate-limiting"],
      "commits_30d": 8,
      "authors": ["Alice", "Bob"]
    }
  ]
}
```

This enables downstream agents to understand recent activity without parsing raw diffs, achieving millisecond-level context acquisition.

Additional query modes:

- `grspec activity --file <path>` — who has touched this specific file and why
- `grspec activity --change <name>` — full module-level summary of a change's commits
- `grspec activity --hot` — list contested files ranked by frequency and author count

### 11. Auto-push and branch naming conventions

After structured commit generation, integrate git push to make coordination data immediately visible to the team:

- Auto-push (configurable via `grspec.autoPush`): push structured commits to remote after generation, making touches and module metadata visible to other agents on next fetch
- Branch naming convention: suggest `grspec/<change-name>` branches for reliable branch-to-change mapping during recon; record actual branch name in `.grspec.yaml` for non-convention branches
- Touches synchronization: `.grspec.yaml` (containing touches) is committed alongside proposal.md and pushed; other agents discover touches via `git fetch` + remote branch inspection without local checkout

### 12. Dynamic touches update and configurable recon

- When post-apply feedback detects false negatives (files modified but not in touches), offer to append them to `.grspec.yaml` with inferred intent, then commit and push to keep team coordination accurate
- Configurable recon parameters: `grspec.recon.window` (time window, default 2w), `grspec.recon.hotThreshold` (min changes + authors for hot file classification), `grspec.autoPush` (auto-push after commit, default false)

## Capabilities

### New Capabilities

- `change-stacking-workflow`: Dependency-aware sequencing and split scaffolding for change planning
- `git-coordination`: Git-aware reconnaissance, structured commits, and file-level overlap coordination for multi-person parallel development

### Modified Capabilities

- `cli-change`: Adds graph/next/split planning commands, stack-aware validation messaging, and activity queries
- `change-creation`: Supports parent/dependency metadata, file-level touches inference, and git recon during proposal generation
- `openspec-conventions`: Defines optional stack metadata conventions including structured commit format and touches schema

## Impact

- `src/core/project-config.ts` and related parsing/validation utilities for change metadata loading
- `src/core/config-schema.ts` (or dedicated change schema) for stack metadata and touches validation
- `src/commands/change.ts` and/or `src/core/list.ts` for graph/next/split command behavior
- `src/core/validation/*` for dependency cycle, overlap checks, and coordination mode selection
- `src/core/git.ts` (new) for git reconnaissance, structured commit parsing, and activity aggregation
- `src/commands/activity.ts` (new) for the `grspec activity` command
- Propose skill: integrate two-phase touches inference and git recon into proposal generation prompt
- Apply skill: integrate overlap detection and coordination mode selection into apply workflow
- `docs/cli.md`, `docs/concepts.md`, and contributor guidance for stack-aware and git-coordinated workflows
- tests for metadata parsing, graph ordering, next-item suggestions, split scaffolding, git recon parsing, structured commit generation, and activity aggregation
