---
type: proposal
change: ui-workflow-fusion
created: 2026-06-23
schema: spec-driven
---
## Why

The grspec UI module and the change workflow exist as disconnected systems. Specs for their integration (`propose-ui-hook`, `design-phase-ui-hook`, `apply-ui-context`, `verify-ui-quality`) already exist, and the CLI has partial code-level integration (design instruction enrichment, contextFiles discovery), but the skill templates that agents actually follow contain zero UI references. This means agents never trigger UI detection, never suggest design-system generation, and never run UI quality checks — even though the plumbing is partially built.

## What Changes

- **Port UI detection step** from the command template (`propose.ts` inline) to the content template (`content/propose.md`) and `content/ff-change.md`, so deployed skills include it
- **Add UI context guidance** to `content/apply-change.md` — instruct agents to read design-system contextFiles and run `grspec ui review` after UI tasks
- **Add UI Quality dimension** to `content/verify-change.md` — run `grspec ui review --json` on UI files and map findings to verification severity levels
- **Implement propose-ui-hook** in CLI workflow — set `ui-detected: true` + keywords in `.grspec.yaml` after proposal creation, with opt-out support
- **Close apply-ui-context gap** — embed inline CRITICAL-severity rules in apply instructions when `ui-detected: true`
- **Redeploy skills** — regenerate `.cursor/skills/` from updated content templates

## Capabilities

### New Capabilities
- `propose-ui-metadata`: CLI-level yaml marking (`ui-detected: true`, keywords) after proposal creation, with opt-out via `ui-auto-generate: false`

### Modified Capabilities
- `apply-ui-context`: Close gap — embed inline CRITICAL rules when `ui-detected: true` (spec exists, partial implementation)
- `verify-ui-quality`: Add UI Quality sub-check to verify workflow's Coherence dimension (spec exists, zero implementation)

## Domain Context

This change spans two bounded contexts:
- **Workflow Orchestration** — skill templates that guide agent behavior through the change lifecycle (propose → apply → verify → archive)
- **UI Intelligence** — design-system generation, search, rules, and review capabilities

The integration points are:
1. Propose phase → UI Detection (workflow calls into UI)
2. Apply phase → Design-system contextFiles + rules (workflow reads UI output)
3. Verify phase → UI Review (workflow calls into UI)

## Risk Assessment

- **Impact scope**: 4 content templates + 1 CLI file (`instructions.ts`) + skill regeneration. No schema or artifact graph changes.
- **Regression risk**: Low — all UI integration is additive and conditional (only activates when UI is detected). Non-UI changes are completely unaffected.
- **Performance**: `grspec ui detect` is keyword matching (~22 keywords), near-zero overhead. `grspec ui review` is file scanning, only triggered during verify.
- **Coordination**: The existing code in `instruction-loader.ts` (design enrichment) and `instructions.ts` (contextFiles discovery) stays intact — we build on top, not replace.
- **Breaking**: None. Existing workflows without UI content see no behavioral change.

## Impact

- `src/core/templates/content/propose.md` — add UI detection step
- `src/core/templates/content/ff-change.md` — add UI detection step
- `src/core/templates/content/apply-change.md` — add design-system context + UI review guidance
- `src/core/templates/content/verify-change.md` — add UI Quality dimension
- `src/commands/workflow/instructions.ts` — implement propose-ui-hook yaml marking + inline CRITICAL rules
- `.cursor/skills/grspec-propose/SKILL.md` — regenerated
- `.cursor/skills/grspec-ff-change/SKILL.md` — regenerated
- `.cursor/skills/grspec-apply-change/SKILL.md` — regenerated
- `.cursor/skills/grspec-verify-change/SKILL.md` — regenerated
