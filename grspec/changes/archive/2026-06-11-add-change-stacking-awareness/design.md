# Design: Change Stacking & Git-Aware Coordination

## Technical Approach

This change introduces two complementary systems:

1. **Stack ordering** — metadata-driven dependency graph for sequencing changes
2. **Git coordination** — file-level overlap detection, structured commits, and AI-assisted coordination for parallel work on shared modules

Both systems share the same metadata layer (`.grspec.yaml`) and validation pipeline, but operate at different points in the lifecycle.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         grspec core                                      │
│                                                                         │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────────────┐   │
│  │ Metadata     │   │ Validation    │   │ Git Intelligence         │   │
│  │ Parser       │   │ Pipeline      │   │                          │   │
│  │              │   │               │   │  ┌────────────────────┐  │   │
│  │ .grspec.yaml │──▶│ cycles        │   │  │ Reconnaissance    │  │   │
│  │ touches      │   │ missing deps  │   │  │ (pre-propose)     │  │   │
│  │ dependsOn    │   │ overlaps      │   │  └────────────────────┘  │   │
│  │ provides     │   │ max-touches   │   │  ┌────────────────────┐  │   │
│  │ requires     │   │               │   │  │ Commit Builder     │  │   │
│  │              │   │               │   │  │ (post-apply)       │  │   │
│  └──────────────┘   └───────────────┘   │  └────────────────────┘  │   │
│                                          │  ┌────────────────────┐  │   │
│                                          │  │ Activity Parser    │  │   │
│                                          │  │ (query)            │  │   │
│                                          │  └────────────────────┘  │   │
│                                          └──────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Commands                                                          │   │
│  │                                                                   │   │
│  │  change graph | change next | change split | change overlap       │   │
│  │  activity --since | activity --file | activity --hot              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Architecture Decisions

### Decision: File-level touches (not capability-level)

Using file paths as the overlap unit instead of abstract capability names because:

- File paths are unambiguous and automatically matchable
- Reduces coordination to a set-intersection problem (O(1) lookup)
- Aligns with what git actually tracks
- Enables direct integration with `git diff --name-only` for feedback loop

Trade-off: Renames break overlap detection until touches are refreshed. Acceptable because renames are infrequent relative to modifications.

### Decision: Two-phase inference for touches

Phase A (coarse): intent → domain keywords → candidate directories
Phase B (precise): read entry/key files → trace to specific file paths

Why not single-phase:
- Single-phase with full codebase context → token explosion for large projects
- Single-phase with directory-only → too imprecise, high false-positive rate
- Two-phase balances token cost with accuracy

### Decision: Precision over recall in inference

The system prefers false negatives (missed files) over false positives (noisy overlap warnings) because:

- False positives erode trust and cause teams to ignore warnings
- False negatives are caught at apply time (drift detection) or post-apply (feedback loop)
- The feedback loop self-corrects recurring false negatives over time

### Decision: YAML metadata block in commit body (not trailers or separate files)

Embedding structured data in commit messages as YAML between `---` delimiters because:

- Git-native: no extra files, works with any git hosting
- Human-readable: developers can see context in `git log`
- Machine-parseable: simple regex extraction + YAML parse
- Survives rebases, cherry-picks, and squash merges (metadata is in the message body)

Alternatives considered:
- Git trailers: no nested structure support
- Separate `.grspec-commit.json`: requires checkout to read, not visible in git log
- Conventional commit footer only: insufficient space for module-level detail

### Decision: One commit per task group (not per task, not per change)

Task groups (heading-level sections in `tasks.md`) represent coherent units of work:

- Per-task: too granular, creates commit noise
- Per-change: too coarse, loses traceability
- Per-group: matches logical "I finished this chunk" moments and review boundaries

### Decision: Git branch analysis for non-grspec participants

Analyzing unmerged remote branches enables detection of parallel work even from team members not using grspec. This is critical for incremental adoption in teams where not everyone uses the tool.

### Decision: Coordination modes are AI-selected, user-confirmed

The AI determines the coordination mode (Extend/Prepare/Negotiate) based on observable state:

- Extend: overlapping branch merged → deterministic, no user input needed
- Prepare: overlapping branch not merged → deterministic, no user input needed
- Negotiate: intents incompatible → requires user selection from generated options

Only Negotiate mode requires explicit user interaction. Extend and Prepare are automatic but logged for transparency.

## Data Flow

### Propose-Time Flow

```
User: /grsx:propose "add rate limiting"
         │
         ▼
┌─────────────────────────────────┐
│ 1. Git Reconnaissance           │
│                                 │
│ git log --since=2w --name-only  │
│ git branch -r --no-merged main  │
│ git log --all -- <target-dirs>  │
│                                 │
│ Output: hot_files, active_branches, recent_commits
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 2. Touches Inference            │
│                                 │
│ Phase A: intent → domains       │
│   "rate limiting" → api, auth,  │
│   config                        │
│                                 │
│ Phase B: domains → files        │
│   Read entry files              │
│   Trace dependencies            │
│   Cross-reference with git data │
│                                 │
│ Output: touches[] with path,    │
│   intent, mode                  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 3. Overlap Detection            │
│                                 │
│ Compare touches paths with      │
│ all active changes' touches     │
│                                 │
│ Also compare with active        │
│ branch file lists (non-grspec)  │
│                                 │
│ Output: overlaps[] with change  │
│   name, author, their intent    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 4. Generate Proposal            │
│                                 │
│ AI has full context:            │
│ - git recon data                │
│ - inferred touches              │
│ - detected overlaps             │
│                                 │
│ Writes: proposal.md (with       │
│   coordination notes),          │
│   .grspec.yaml (with touches)   │
└─────────────────────────────────┘
```

### Apply-Time Flow

```
User: /grsx:apply
         │
         ▼
┌─────────────────────────────────┐
│ 1. Pre-Apply Check              │
│                                 │
│ For each touched file with      │
│ known overlap:                  │
│                                 │
│ git fetch origin                │
│ git log main..<overlap-branch>  │
│ Read overlap change's tasks.md  │
│                                 │
│ Determine: merged? tasks done?  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 2. Mode Selection               │
│                                 │
│ Branch merged? → EXTEND         │
│ Branch not merged? → PREPARE    │
│ Intents incompatible? →         │
│   NEGOTIATE                     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 3. Context Injection            │
│                                 │
│ EXTEND: inject current file     │
│   state + other change's spec   │
│                                 │
│ PREPARE: inject other change's  │
│   intent + suggest abstractions │
│                                 │
│ NEGOTIATE: present options,     │
│   await user selection          │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 4. Implement Task               │
│                                 │
│ AI writes code with             │
│ coordination awareness          │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 5. Test + Structured Commit     │
│                                 │
│ Tests pass → generate commit    │
│ with YAML metadata block        │
└─────────────────────────────────┘
```

### Activity Query Flow

```
Agent B: grspec activity --since=2w --json
              │
              ▼
┌─────────────────────────────────┐
│ 1. Read git log                 │
│                                 │
│ git log --since=2w --format=... │
│ Extract YAML blocks between     │
│ --- delimiters                  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 2. Aggregate                    │
│                                 │
│ Group by change name            │
│ Merge module lists              │
│ Compute hot_files               │
│ Skip non-structured commits     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ 3. Return JSON                  │
│                                 │
│ { changes: [...],               │
│   hot_files: [...] }            │
│                                 │
│ Zero diff parsing required      │
│ by consuming agent              │
└─────────────────────────────────┘
```

## Prompt Engineering: Touches Inference

### System Prompt Structure

The inference prompt uses a three-section design: Context → Task → Format.

**Context section** (injected dynamically):
- Project directory tree (depth 2-3, src/ only)
- Key entry/registration files (app.ts, router.ts, middleware/index.ts)
- Relevant existing specs (if available)
- Active changes' touches (for overlap detection)
- Git recon data (hot files, active branches, recent commits)

**Task section** (static template):
```
You are analyzing the implementation impact of a proposed change.

TASK: Identify the SOURCE CODE files that would need to be
created or modified to implement this intent.

RULES:
- Only include files where code logic changes (not tests, docs, configs)
- For each file, describe WHY it needs to change in one sentence
- Classify as: create (new file) | modify (existing file)
- Rate confidence: high (directly implements intent) | medium (coordinating changes)
- Do NOT include files you're uncertain about
- Prefer false negatives over false positives

REASONING APPROACH:
1. What is the core behavior being added/changed?
2. Where in this codebase does that behavior currently live (or would naturally live)?
3. What other files need to change to support it?
4. Stop. Do not speculate beyond what the architecture demands.
```

**Format section** (strict output schema):
```
OUTPUT FORMAT (strict JSON):
{
  "reasoning": "Brief chain of thought explaining the trace",
  "touches": [
    { "path": "...", "intent": "...", "mode": "create|modify", "confidence": "high|medium" }
  ],
  "overlaps": [
    { "path": "...", "with_change": "...", "conflict_nature": "..." }
  ]
}
CONSTRAINTS:
- Maximum 8 files
- "intent" must start with a verb
- "path" must be an existing file (modify) or plausible new path (create)
```

### Key Prompt Design Principles

1. **"Stop. Do not speculate."** — Prevents AI from entering infinite expansion mode
2. **Explicit reasoning chain** — Forces step-by-step trace instead of pattern matching
3. **Confidence gating** — Only high/medium make it to output; low is omitted entirely
4. **Hard cap at 8 files** — Both a quality signal (too many = split) and a token budget control
5. **Active changes in context** — Enables overlap detection as part of inference, not post-processing

### Pre-Propose Reconnaissance Prompt

```
You are performing pre-proposal reconnaissance for a change.
Analyze git activity to identify:
1. Hot files in the target area (high change frequency, multiple authors)
2. Active parallel work that may conflict (unmerged branches)
3. Recent architectural changes that affect the approach

Output as structured JSON:
{
  "risks": [{ "source": "...", "conflict": "...", "severity": "high|medium|low" }],
  "timing_advice": "...",
  "approach_impact": "...",
  "hot_files": [{ "path": "...", "heat": "high|medium", "reason": "..." }]
}
```

## File Changes

### New Files

- `src/core/git.ts` — Git intelligence module (recon, parsing, activity aggregation)
- `src/core/git-commit-builder.ts` — Structured commit message generation
- `src/core/coordination.ts` — Overlap detection and coordination mode selection
- `src/core/touches-inference.ts` — Two-phase touches inference logic
- `src/core/feedback-loop.ts` — Post-apply accuracy comparison
- `src/commands/activity.ts` — `grspec activity` command handler

### Modified Files

- `src/core/project-config.ts` — Parse file-level touches schema
- `src/core/config-schema.ts` — Touches validation (path/intent/mode structure, max 8)
- `src/commands/change.ts` — Add graph/next/split/overlap subcommands
- `src/core/validation/*` — Cycle detection, file-level overlap checks, coordination mode logic

### Skill Files (AI instruction updates)

- Propose skill — Inject git recon + two-phase inference + overlap detection
- Apply skill — Inject coordination mode selection + context for Extend/Prepare/Negotiate

## Architecture Decisions (continued)

### Decision: Auto-push with opt-in default

Auto-push defaults to OFF (`grspec.autoPush: false`) because:

- Pushing changes a shared remote — this should be intentional
- Some workflows batch multiple task groups before pushing
- Teams with CI/CD hooks may not want frequent pushes

But when enabled, auto-push is critical for team coordination: other agents can only see your touches after push. The prompt-before-push default balances safety with visibility.

### Decision: Branch naming convention `grspec/<change-name>`

Using a predictable branch naming convention enables zero-config branch-to-change mapping:

- Git recon can match `grspec/add-rate-limiting` → change `add-rate-limiting` without reading `.grspec.yaml` from the remote branch
- Falls back to recorded branch name in `.grspec.yaml` for non-convention cases
- Does not enforce — merely suggests and records

### Decision: Remote touches discovery via `git fetch` + show-ref

Reading touches from remote branches without local checkout:

```
git fetch origin
git show origin/grspec/add-oauth:.grspec.yaml
```

This avoids polluting the local workspace with other changes' branches while still accessing their metadata. The only requirement is that `.grspec.yaml` is committed to the branch.

### Decision: Dynamic touches update is user-confirmed

When the feedback loop detects false negatives, the system offers to update (not auto-updates) because:

- Adding touches post-hoc changes the overlap surface for other changes
- The user should confirm the intent description is accurate
- Avoids runaway accumulation of stale touches entries

## Migration and Compatibility

- Existing changes without `touches` metadata continue to work (no migration required)
- Legacy capability-level touches values (string arrays) are accepted with a deprecation warning
- Structured commits are additive; non-structured commits in history are gracefully skipped
- `grspec/anchors.yaml` is optional; the system degrades gracefully without it
- `grspec activity` returns empty results (not errors) when no structured commits exist

## Performance Considerations

- Git recon queries are bounded by `--since` window (configurable, default 2 weeks) to avoid scanning entire history
- Activity parsing caches results per session to avoid repeated git log calls
- Touches inference uses two-phase approach to minimize token consumption (coarse pass filters before expensive file reads)
- Overlap detection is a set intersection on file paths (O(n) in number of active changes)
- Remote touches discovery uses `git show` on specific files (not full checkout), minimizing I/O
- Auto-push batches: if multiple task groups complete in one session, push once at the end (not per commit)

## Configuration Surface

```yaml
# Project-level .grspec.yaml (or grspec config)
coordination:
  autoPush: false                    # Auto-push after structured commit
  recon:
    window: "2w"                     # Git recon time window
    hotThreshold:
      changes: 3                     # Min changes for hot file
      authors: 2                     # Min authors for hot file
  branch:
    convention: "grspec/<name>"      # Branch naming pattern
  touches:
    maxEntries: 8                    # Max touches before split warning
```
