## Context

grspec v2.0 ships with a comprehensive design document (`docs/pr.md`) describing a Vibe Coding Framework that fuses OpenSpec, Spec-Kit, and Superpowers. However, the implementation is uneven: knowledge layer and core workflow chain work well, but gate enforcement, profile system, execution discipline defaults, and collaboration infrastructure are either partial or paper-only. The `workflow.gates` config section is parsed by Zod but never consumed. The profile system is binary (`core`/`custom`) rather than the tiered approach needed to graduate users into execution discipline workflows.

Current state of key files:
- `src/core/profiles.ts` — defines `CORE_WORKFLOWS` (5 items) and `ALL_WORKFLOWS` (16 items), resolves via `getProfileWorkflows()`
- `src/core/project-config.ts` — Zod schema for `grspec.yaml` including `workflow.gates`, `execution`, `collaboration` sections (all parsed, none consumed)
- `src/core/archive.ts` — archive with task completion reminder but no hard block
- `src/core/artifact-graph/` — state detection + build order (no gate enforcement in `instructions` command)
- `schemas/spec-driven/schema.yaml` — artifact chain with plan.md strategy annotations

## Goals / Non-Goals

**Goals:**
- Make `pr.md` an honest architectural reference by annotating each section with implementation status
- Add structural gate enforcement to the CLI (artifact dependency checks, plan completion checks) that works purely from file-system state — no external tool execution
- Replace the binary profile system with four tiers so execution discipline workflows ship by default
- Enhance skill templates (apply, propose, design) with strategy routing and domain context
- Clarify the CLI vs Skill responsibility boundary for collaboration infrastructure

**Non-Goals:**
- CLI does not execute tests, builds, lints, or any external commands as part of gate checks
- CLI does not manage git worktrees, spawn subagents, or select models
- No changes to the artifact graph data model or schema YAML format
- No new CLI top-level commands (no `grspec explore` CLI command; explore remains a Skill)
- No metrics/telemetry system

## Decisions

### D1: Gate enforcement via `instructions` command

**Choice**: Add a dependency check at the start of `grspec instructions <artifact-id>` that reads the artifact graph state and refuses to output instructions when upstream dependencies are incomplete.

**Why over alternatives**:
- Alternative: gate at `grspec status` — rejected because status is informational, not a write operation
- Alternative: gate at file write time — rejected because grspec doesn't write artifacts (AI does)
- `instructions` is the natural chokepoint: it's the command AI skills call before creating each artifact, so blocking here blocks the entire downstream chain

**Implementation**: In `src/commands/instructions.ts` (or wherever the instructions command is handled), after loading the artifact graph, check `artifact.requires` against `completedArtifacts`. If any required artifact is not complete, print error and exit(1). Add `--force` flag to bypass.

### D2: Archive plan completion as hard block

**Choice**: Strengthen the existing archive task-completion check to be a hard block that prevents archiving when unchecked plan items remain, unless `--force` is passed.

**Why**: The current behavior (warn + prompt with default "No") is functionally equivalent to a warning, easily bypassed. A hard block with explicit `--force` makes the gate meaningful while still allowing override for legitimate edge cases.

**Implementation**: In `src/core/archive.ts`, after reading `plan.md` (and `tasks.md` for backward compat), if incomplete items exist and `--force` is not set, display the list and exit(1). If `--force` is set, display warning and continue.

### D3: Four-tier profiles via constant arrays

**Choice**: Define `MINIMAL_WORKFLOWS`, `STANDARD_WORKFLOWS`, `FULL_WORKFLOWS` as cumulative constant arrays in `src/core/profiles.ts`. Update `getProfileWorkflows()` to accept the new tier names. Treat `core` as a deprecated alias for `standard`.

**Why over config-driven approach**: Constants are testable, explicit, and don't require parsing additional config. The profile is a global setting (not per-project), so a simple enum + constant mapping is sufficient.

**Migration**: `core` → `standard` alias with deprecation warning. This is non-breaking since `standard` is a superset of `core`.

### D4: Apply skill strategy routing via skill text

**Choice**: Rewrite the apply skill (`grspec-apply-change/SKILL.md`) to include a strategy routing section that reads each task's `[codegen | TDD | AI+review | manual]` annotation and references the appropriate sub-skill.

**Why not CLI-level routing**: The CLI doesn't execute tasks — the AI agent does. Strategy routing is fundamentally an agent behavior concern. The apply skill is the right place because it's the instruction set the agent follows during apply.

### D5: Template enrichment via schema templates

**Choice**: Add Domain Context and Risk Assessment sections to `schemas/spec-driven/templates/proposal.md`; add Schema Changes and Implementation Strategy sections to `schemas/spec-driven/templates/design.md`.

**Why in schema templates**: These are the source-of-truth templates that `grspec instructions` outputs. Changing them automatically affects all new artifacts created with the spec-driven schema.

### D6: Collaboration config keys — keep as reserved

**Choice**: Keep the `collaboration` section in `ProjectConfigSchema` but do not consume it. Add a code comment marking it as reserved for future use.

**Why not remove**: Removing validated keys from the schema would cause users with existing `grspec.yaml` files to see warnings/errors on upgrade. Keeping them parsed-but-unused is harmless and preserves forward compatibility.

## Risks / Trade-offs

- **[Profile migration]** Renaming `core` to `minimal` and defaulting to `standard` means existing `core` users get more workflows on next `grspec init --tools`. → Mitigation: `core` alias + deprecation warning; `minimal` available for users who want the old behavior.
- **[Gate strictness]** Hard-blocking `instructions` could frustrate users who want to explore out of order. → Mitigation: `--force` flag on both `instructions` and `archive` commands.
- **[Apply skill size]** Strategy routing makes the apply skill longer and more complex. → Mitigation: route to sub-skills by reference rather than inlining their full content.
- **[pr.md maintenance]** Status annotations in pr.md need to be maintained as features land. → Mitigation: include a "last audited" date and review pr.md status as part of release process.

## Open Questions

- Should the `--force` flag on `grspec instructions` share the same flag name as the existing `--force` on `grspec archive`, or should it use a different name (e.g., `--skip-gates`)? Leaning toward `--force` for consistency.
- Should the standard profile include `verify-gate` as distinct from `verify`? Currently both exist in `ALL_WORKFLOWS` — need to clarify whether they're redundant or complementary.
