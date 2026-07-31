---
type: design
change: ui-init
created: 2026-06-15
schema: spec-driven
---
## Context

`grspec ui design-system "<query>"` requires users to construct a natural-language query string with the right product type, style keywords, and industry terms. This works in scripted or expert usage, but in agent environments the tool should analyze the codebase and pre-fill attributes, letting users confirm rather than compose from scratch.

The existing `detectDesignSystem()` in `src/core/ui/status.ts` already checks for a `design-system/` directory and reads the style from `MASTER.md`. The `generateDesignSystem()` function in `src/core/ui/design-system.ts` accepts a query string and optional project name, then runs multi-domain BM25 search across product, style, color, typography, and landing datasets.

## Goals / Non-Goals

**Goals:**
- Provide a `grspec ui init` CLI subcommand that auto-detects stack and project name, accepts structured parameters, and produces a persisted design system
- Provide a `grspec-ui-init` skill that performs deeper codebase analysis, classifies inferences by confidence, and presents adaptive confirmation
- Guard against accidental overwrites when `design-system/` already exists
- Optionally generate a platform-specific rules checklist alongside the design system

**Non-Goals:**
- Changing the `generateDesignSystem()` function signature or search algorithm — the CLI assembles a query string and calls it unchanged
- Replacing or deprecating the existing `grspec ui design-system` subcommand — it remains for direct/scripted use
- Adding interactive prompts to the CLI itself — interactivity lives in the skill layer; the CLI stays non-interactive
- Auto-detecting product type or industry at the CLI level — the CLI requires `--type` explicitly; smart inference is the skill's job

## Decisions

### D1: Two-layer architecture (CLI + Skill)

**Choice:** The CLI provides a deterministic, scriptable `init` subcommand with auto-detection limited to high-confidence signals (package.json). The skill adds agent intelligence on top — deep analysis, confidence grading, adaptive interaction — and delegates execution to the CLI.

**Alternatives considered:**
- Skill-only (no CLI change): Simpler, but init would only work in agent contexts. Users running CLI directly or in CI would get no benefit.
- CLI-only with interactive prompts: Would make the CLI non-scriptable and violate the convention that CLI commands are deterministic.

**Rationale:** Separating deterministic detection (CLI) from probabilistic inference (skill) keeps each layer testable and independently useful. The CLI SHALL remain non-interactive.

### D2: CLI auto-detection scope

**Choice:** The CLI SHALL auto-detect:
- `projectName` from `package.json` `name` field
- `stack` from `package.json` `dependencies` and `devDependencies` (matching against `AVAILABLE_STACKS`)

The CLI SHALL NOT attempt to infer product type, style preference, or audience — these require `--type` or default to a generic value.

**Rationale:** `package.json` parsing is deterministic and cross-platform. Product type inference from README content is probabilistic and belongs in the skill layer where the agent can present confidence levels and ask for confirmation.

### D3: Query assembly

**Choice:** The CLI SHALL assemble a query string from structured parameters and pass it to `generateDesignSystem()`:
```
query = [type, style keywords, stack].filter(Boolean).join(' ')
```

**Alternatives considered:**
- New structured API on `generateDesignSystem()`: Cleaner but changes existing interfaces and requires updating all callers. Deferred until validated.

**Rationale:** Reuses the existing BM25 search pipeline without modification. The query assembly is a thin adapter between structured input and the existing string-based API.

### D4: Idempotency guard

**Choice:** When `design-system/` exists in the output directory and `--force` is not set, the CLI SHALL exit with a warning message and non-zero exit code. The message SHALL include the detected style name (via `detectDesignSystem()`).

**Rationale:** Prevents accidental overwrites. The existing `detectDesignSystem()` function already handles detection and style extraction.

### D5: Rules config generation

**Choice:** When `--with-rules` is passed, the CLI SHALL generate a rules checklist filtered by detected platform (web/app) and write it alongside the design system. The output format SHALL be a markdown checklist using `formatChecklist()`.

**Rationale:** Reuses existing `loadRules()` and `formatChecklist()` from `src/core/ui/rules.ts`. Placing the checklist next to the design system makes it discoverable during implementation.

### D6: Skill confidence classification

**Choice:** The skill SHALL classify detected attributes into three tiers:

| Tier | Confidence | Behavior |
|------|-----------|----------|
| HIGH (≥ 0.9) | Source is deterministic (package.json field) | Auto-fill, display as confirmed |
| MEDIUM (0.5–0.9) | Source is heuristic (README keywords, CSS patterns) | Auto-fill with source citation, present for bulk confirmation |
| LOW (< 0.5) | Cannot infer from codebase | Ask user explicitly |

**Rationale:** Reduces interaction friction for clear signals while ensuring uncertain inferences get user validation. The three-tier model avoids both "ask everything" (annoying) and "assume everything" (error-prone).

### D7: New module location

**Choice:** Core init logic SHALL live in `src/core/ui/init.ts`. This module exports:
- `detectProjectStack(projectRoot: string): DetectedStack` — reads package.json, returns stack and project name
- `assembleInitQuery(options: InitOptions): string` — builds query string from structured params
- `checkExistingDesignSystem(projectRoot: string): ExistingDesignSystemInfo | null` — wraps `detectDesignSystem()` with richer output for the CLI warning message

The CLI registration goes in the existing `src/commands/ui.ts` as a new `init` subcommand, consistent with how all other `ui` subcommands are registered.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| `src/core/ui/init.ts` | TDD | Core detection logic, testable without CLI |
| `src/commands/ui.ts` (init subcommand) | TDD | Integration with Commander.js |
| `.cursor/skills/grspec-ui-init/SKILL.md` | Manual | Skill markdown, no code |
| `.cursor/commands/grsx-ui-init.md` | Manual | Command markdown, no code |
| `.cursor/skills/grspec-ui/SKILL.md` | Manual | Minor update to How to Use table |

## Risks / Trade-offs

**[Risk: Query assembly quality]** Structured parameters joined as a space-separated string may not produce optimal BM25 results compared to a human-crafted natural-language query.
→ Mitigation: The `type` parameter maps directly to product type names in the dataset (which are the BM25 corpus). Style keywords are passed through unchanged. Test with representative queries and compare results against direct `design-system` usage.

**[Risk: Stack detection false positives]** A project with `react` in devDependencies (e.g., for testing) could be misidentified as a React project.
→ Mitigation: The CLI auto-fills stack but the user can override with `--stack`. The skill's confidence system handles this at the MEDIUM tier, presenting the inference for confirmation.

**[Risk: Skill maintenance burden]** The skill's codebase analysis logic is expressed in markdown instructions, making it harder to test than TypeScript code.
→ Mitigation: The skill delegates all execution to the CLI, which is fully tested. The skill only controls the interaction flow and parameter assembly — its "correctness" is in producing the right CLI arguments, not in generating design system content.
