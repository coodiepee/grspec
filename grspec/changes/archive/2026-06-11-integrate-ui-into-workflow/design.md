---
type: design
change: integrate-ui-into-workflow
created: 2026-06-11
schema: spec-driven
---
## Context

grspec-ui currently integrates with the workflow through two narrow code paths:

1. **`enrichDesignInstructionWithUi()`** in `instruction-loader.ts` — scans `proposal.md` for UI keywords (≥1 match threshold) and appends an advisory "consider running design-system generator" to the design artifact instruction. The LLM may or may not act on this.

2. **Design-system context discovery** in `instructions.ts` — during apply instruction generation, checks for `design-system/MASTER.md` in the change directory and, if found, adds it to `contextFiles` and appends generic guidance to the instruction.

Both paths are passive: they suggest actions rather than execute them. The `ui-detected` field in `ChangeMetadataSchema` is defined but never read. No workflow phase automatically generates design tokens, embeds rules, or runs quality checks.

The ≥1 keyword threshold causes false positives (our own proposal triggered detection because it mentions "style", "ui", and "component" in a non-UI context).

## Goals / Non-Goals

**Goals:**
- Detection SHALL only trigger when the change genuinely involves UI work (≥3 keywords threshold)
- The propose phase SHALL auto-generate `design-system/MASTER.md` when UI is detected, with transparent output
- The design phase SHALL provide token-aware guidance when `design-system/` already exists
- The apply phase SHALL surface CRITICAL-severity UI rules inline when `ui-detected` is set
- The verify phase SHALL include UI quality findings in its Coherence check
- The cursor command surface SHALL collapse from 7 commands to 2
- The `ui-detected` metadata field SHALL be actively consumed by downstream hooks

**Non-Goals:**
- Task-aware per-task rule matching (Level 2 apply hook) — deferred until Level 1 proves the pattern
- Generic `concerns` abstraction for arbitrary domain hooks (i18n, security, etc.) — wire UI directly first
- Changes to the CLI subcommand surface (`grspec ui search`, `grspec ui rules`, etc.) — these stay intact
- Modifying design-system generation logic itself — we reuse existing `generateDesignSystem()`
- Wiki integration with design decisions — interesting but separate

## Decisions

### Detection threshold: count-based ≥3 (not weighted scoring)

The detection function SHALL require ≥3 distinct keyword matches to set `detected: true`.

**Alternatives considered:**
- Weighted scoring (strong/medium/weak signals, threshold ≥4): More nuanced but adds complexity (weight management, threshold tuning) without proportional benefit. The ≥3 count achieves similar false-positive reduction.
- Keep ≥1: Status quo. Triggers on "component" alone. Unacceptable for auto-generation.

**Tradeoff:** ≥3 may miss edge cases like "Build a dashboard with charts" (only 2 keywords). Accepted because 2-keyword matches also catch false positives like "Fix the CSS layout bug". Users can manually set `ui-detected: true` for edge cases.

### Propose hook: auto-generate with rich inform (not prompt/suggest)

When UI is detected during propose, the system SHALL automatically generate `design-system/MASTER.md` and display a summary of what was generated. It SHALL NOT prompt the user for confirmation.

**Alternatives considered:**
- Prompt (ask y/n): Interrupts flow, especially in `/grsx:ff`. The generation is local, fast (~100ms), and reversible (delete directory).
- Suggest only: Returns to the current "consider running" advisory that nobody reads.
- Silent: Generates without informing. Users wouldn't know about the directory.

**Tradeoff:** Auto-generation creates files the user didn't ask for. Mitigated by: (a) transparent output showing what was generated, (b) easy reversal (delete `design-system/`), (c) ≥3 threshold making false triggers rare, (d) project-level opt-out.

### Hook implementation: skill-level generation, CLI-level detection

Detection SHALL be a CLI command (`grspec ui detect`) returning structured JSON. Design-system generation SHALL be invoked by the skill layer (LLM crafts the query from proposal context).

**Rationale:** Detection is deterministic (keyword scan) — belongs in CLI for consistency and testability. Generation benefits from LLM crafting a richer query string from proposal semantics — belongs in skill layer.

### Design enrichment: conditional on design-system existence

The design instruction enrichment SHALL check whether `design-system/MASTER.md` exists before deciding what guidance to append.

- If `design-system/` exists: provide specific token references (extracted from MASTER.md)
- If not, but UI detected: keep the current "consider running" advisory
- If no UI: no enrichment

This replaces the current unconditional "consider running" behavior when any single keyword matches.

### Apply enrichment: static CRITICAL rules (Level 1)

When `ui-detected` is true and the apply state is `ready`, the instruction SHALL embed the text of all CRITICAL-severity rules from the rules database. This replaces the current generic "Run `grspec ui rules`" suggestion.

**Why not per-task rules (Level 2):** Requires BM25 search against task descriptions, new CLI flags, changes to `TaskItem` or `ApplyInstructions` interfaces. Higher complexity for uncertain benefit until Level 1 validates the approach.

### Verify hook: skill-level only

The UI quality check in verify SHALL be implemented in the skill/workflow layer (the `/grsx:verify` command), not in the CLI library. The skill reads `ui-detected` from `.grspec.yaml`, runs `grspec ui review` on touched files, and maps findings into the Coherence dimension.

**Rationale:** The verify command is already skill-driven. Adding a CLI-level verify hook would require a new command or flag with no clear standalone use case outside the skill workflow.

### Command collapse: 7 → 2 cursor commands

The cursor command surface SHALL reduce to:
- `/grsx:ui` — smart entry point that routes to CLI subcommands based on natural language input
- `/grsx:ui-review` — kept separate as a common standalone action

**Why keep `/grsx:ui-review`:** Review is the most frequent standalone action and has a distinct verb ("review" vs "search/reference/install"). Folding it into `/grsx:ui` would lose the discoverability of the dedicated command.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| Detection threshold upgrade | AI+review | Modify `detect.ts`, update existing tests |
| `grspec ui detect` command | AI+review | New subcommand in `ui.ts` |
| Propose skill hook | AI+review | Update propose workflow template/skill |
| Design enrichment upgrade | AI+review | Modify `instruction-loader.ts` |
| Apply CRITICAL rules | AI+review | Modify `instructions.ts` |
| Verify skill hook | AI+review | Update verify workflow template/skill |
| Command collapse | AI+review | Delete 5 cursor commands, rewrite 1 |
| SKILL.md update | AI+review | Update Workflow Integration section |

## Risks / Trade-offs

- **[Detection regression]** Raising the threshold from 1 to 3 may cause changes that currently trigger enrichment to stop triggering. → **Mitigation:** Review existing changes in `grspec/changes/archive/` to count how many would be affected. The current enrichment is advisory-only and rarely acted on, so regression impact is minimal.

- **[Auto-generation surprise]** Users who don't expect auto-generated files may be confused by `design-system/` appearing. → **Mitigation:** Rich inform output clearly shows what was generated and why. The directory is trivially deletable. Project-level opt-out available.

- **[Propose latency]** Adding design-system generation to propose adds ~100ms. → **Mitigation:** Local BM25 search, no network. Negligible compared to LLM artifact generation time.

- **[CRITICAL rules noise]** Embedding all CRITICAL rules in apply instruction adds text to every UI-flagged change, even if the current task is non-UI. → **Mitigation:** Level 1 is intentionally broad; Level 2 (deferred) will scope rules per task. For now, the rules are short (a few lines each) and serve as guardrails.

- **[Command collapse discoverability]** Users who learned `/grsx:ui-rules` will need to learn the new `/grsx:ui` routing. → **Mitigation:** CLI subcommands are unchanged. The collapse only affects cursor command surface. The skill SKILL.md documents the new routing.
