---
type: proposal
change: workflow-ux-optimization
created: 2026-06-15
schema: spec-driven
---
## Why

Users face unnecessary cognitive overhead when choosing workflow paths, miss quality gates because they're optional and gated behind profile switches, and get no feedback loop at completion. The current profile system forces a binary choice between simplicity and power, but real usage is a continuous spectrum.

## What Changes

- **Progressive disclosure over profile gates**: All commands available regardless of profile; profiles become "recommended defaults" not access control
- **Lightweight verify on archive**: Archive automatically runs a non-blocking verify summary, surfacing critical gaps without requiring explicit `/grsx:verify`
- **Explore crystallization signals**: Structured detection of when exploration has converged enough to transition to a formal proposal
- **Archive completion feedback**: Rich summary at archive time showing change lifecycle stats, spec impact, and next-step suggestions
- **Parallel change awareness at apply-time**: Proactive overlap detection when starting implementation, not just via CLI commands

## Capabilities

### New Capabilities
- `archive-completion-feedback`: Rich lifecycle summary displayed at archive time (change stats, spec impact, next steps)
- `explore-crystallization`: Structured criteria for detecting when explore conversation has converged to actionable intent

### Modified Capabilities
- `profile-tiers`: Profiles become recommendation tiers rather than command access gates; all commands remain accessible regardless of tier
- `cli-archive`: Archive gains automatic lightweight verify summary output (non-blocking)
- `grsx-verify-skill`: Verify produces a compact summary variant consumable by the archive flow

## Domain Context

**Artifact Workflow** — core lifecycle changes: archive gains verify pre-check and feedback output; explore gains transition detection.

**Configuration** — profile system changes from access control to recommendation engine.

## Risk Assessment

- **Impact scope**: Touches Configuration (profile resolution), Artifact Workflow (archive + verify), Template System (skill templates for explore/archive)
- **Regression risk**: Profile changes could confuse existing users who rely on `core` meaning "only these commands". Mitigation: existing behavior preserved during transition via alias.
- **Performance**: Lightweight verify at archive time adds a pass over specs and tasks. Should be negligible for typical change sizes (<20 tasks, <5 specs).
- **Breaking potential**: Profile semantics change is conceptually breaking but functionally additive (users gain access, lose nothing). `profile-tiers` spec already defines the four-tier system with backward compat for `core`.

## Impact

- `src/core/global-config.ts` — profile resolution logic
- `src/commands/archive.ts` — add verify summary + completion feedback
- Skill templates: `grspec-archive-change`, `grspec-explore`, `grspec-verify-change`
- `docs/workflows.md`, `docs/cheatsheet.md` — documentation updates
- `grspec/specs/profile-tiers/spec.md` — requirement changes
- `grspec/specs/cli-archive/spec.md` — requirement additions
