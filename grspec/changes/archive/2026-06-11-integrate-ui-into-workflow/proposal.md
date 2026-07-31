---
type: proposal
change: integrate-ui-into-workflow
created: 2026-06-11
schema: spec-driven
---
## Why

The grspec-ui subsystem has rich capabilities (67 styles, 205 rules, BM25 search, design-system generation) but is disconnected from the core workflow. The propose, apply, and verify steps have no automatic UI awareness: detection exists but only produces advisory text nobody reads, `ui-detected` metadata is defined but never consumed, and `grspec ui review` is never called during verification. Users must manually remember to invoke UI commands at the right moments, which they don't.

## What Changes

- **Upgrade detection threshold**: Require ≥3 distinct keyword matches instead of 1, reducing false positives (e.g., "component" alone no longer triggers detection)
- **Add propose-phase UI hook**: After proposal is created, detect UI content and auto-generate `design-system/MASTER.md` with a rich informational summary; set `ui-detected: true` in `.grspec.yaml`
- **Upgrade design-phase enrichment**: When `design-system/` already exists (from propose hook), provide token-aware guidance instead of the current "consider running" advisory
- **Add CRITICAL rules to apply instructions**: When `ui-detected` is true, embed CRITICAL-severity rules inline in the apply instruction rather than only suggesting the command
- **Add UI quality sub-check to verify**: Run `grspec ui review` on touched files and include findings in the Coherence dimension of the verification report
- **Collapse cursor command surface**: Reduce from 7 `/grsx:ui*` cursor commands to 2 (`/grsx:ui` as smart router, `/grsx:ui-review` as standalone action)
- **Add `grspec ui detect` CLI command**: Thin wrapper exposing detection result for skill-layer consumption

## Capabilities

### New Capabilities
- `propose-ui-hook`: Auto-detection and design-system generation during propose phase
- `verify-ui-quality`: UI quality sub-check within the verify workflow's Coherence dimension
- `cli-ui-detect`: New `grspec ui detect` subcommand for programmatic detection

### Modified Capabilities
- `ui-content-detection`: Detection threshold changes from ≥1 keyword to ≥3 keywords; `detected` boolean semantics change
- `design-phase-ui-hook`: Instruction enrichment becomes conditional on whether design-system already exists
- `apply-ui-context`: Apply instruction gains inline CRITICAL rules when `ui-detected` is set, not only when `design-system/` directory exists

## Domain Context

- **Artifact Workflow**: Propose, apply, and verify phases gain UI-aware behavior via hooks
- **CLI Interface**: New `ui detect` subcommand; cursor command surface restructured
- **Template System**: Skill and command templates for UI collapse from 7 to 2

## Risk Assessment

- **Impact scope**: Touches 3 workflow phases (propose, apply, verify) and the command surface. Core workflow logic is additive — existing non-UI changes are unaffected because ≥3 keyword threshold avoids false triggers.
- **Regression risk**: The ≥3 threshold is more conservative than the current ≥1, meaning some changes that currently trigger the design enrichment will stop triggering it. This is intentional (false positives were the problem) but worth verifying against existing changes.
- **Performance**: Detection is a substring scan (~0ms). Design-system generation is local BM25 search (~100ms). `grspec ui review` is file I/O + regex (~200ms per file). No API calls. No network. Negligible impact.
- **False positive risk for auto-generation**: ≥3 threshold + rich inform output + easy deletion (remove `design-system/` directory) mitigates unwanted file creation.

## Impact

- `src/core/ui/detect.ts` — threshold logic change
- `src/core/artifact-graph/instruction-loader.ts` — conditional design enrichment
- `src/commands/workflow/instructions.ts` — inline CRITICAL rules in apply instruction
- `src/commands/ui.ts` — new `detect` subcommand
- `.cursor/commands/grsx-ui*.md` — collapse from 7 to 2 files
- `.cursor/skills/grspec-ui/SKILL.md` — update Workflow Integration section
- `.cursor/skills/grspec-propose/SKILL.md` or propose workflow template — add UI detection step
- `.cursor/skills/grspec-verify-change/SKILL.md` or verify workflow template — add UI quality check
