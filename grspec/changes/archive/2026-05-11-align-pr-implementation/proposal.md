## Why

`docs/pr.md` claims "Implemented in grspec v2.0" but a cross-audit reveals ~40-50% actual implementation. Config keys exist without consuming code, execution discipline workflows aren't in the default install, gates are defined but never enforced, and the collaboration infrastructure section implies CLI automation that doesn't exist. This erodes trust in the document as an architectural reference and leaves users without the execution discipline that is the framework's core differentiator from plain OpenSpec.

## What Changes

- **pr.md status annotations** — Every design point in pr.md gets an implementation status tag (`[Implemented]`, `[Partial]`, `[Planned]`, `[Deferred]`) so the document is honest about what exists vs what's aspirational.
- **CLI gate enforcement** — Wire `workflow.gates` config into `grspec instructions` and `grspec archive` so the artifact dependency chain is a hard block (not just a status display) and archive checks plan checkbox completion before proceeding.
- **Profile restructuring** — Replace the binary `core`/`custom` profile system with four tiers: `minimal` (current core 5), `standard` (adds TDD/verify/debug/review), `full` (adds parallel/subagent), `custom` (arbitrary selection). `standard` becomes the new default.
- **Apply skill strategy routing** — Rewrite the apply skill to read each task's strategy tag (`[codegen | TDD | AI+review | manual]`) and route to the appropriate sub-workflow (reference grspec-tdd, grspec-review, etc.) instead of treating all tasks uniformly.
- **Template enrichment** — Add Domain Context and Risk Assessment sections to the proposal template; add Schema Changes and Implementation Strategy sections to the design template.
- **Collaboration infrastructure scope clarification** — Update pr.md §2.6 to explicitly state that subagent/parallel/worktree/model-selection are Skill-layer guidance, not CLI automation. Remove or mark as `reserved` the unused `collaboration` config keys.

## Capabilities

### New Capabilities
- `artifact-gate-enforcement`: CLI blocks artifact creation when upstream dependencies are incomplete, and blocks archive when plan checkboxes are incomplete
- `profile-tiers`: Four-tier profile system (minimal/standard/full/custom) replacing the binary core/custom system

### Modified Capabilities
- `cli-archive`: Archive gains hard gate on plan checkbox completion (currently only warns)
- `execution-discipline`: Execution discipline skills become part of the `standard` profile (default install) instead of requiring custom profile
- `collaboration-infra`: Scope clarification — these are Skill templates only, not CLI automation; unused config keys marked as reserved or removed

## Impact

- **CLI commands affected**: `grspec instructions` (gate checking), `grspec archive` (plan completion gate), `grspec init` (profile selection)
- **Config schema**: Profile field changes from `core | custom` to `minimal | standard | full | custom`; collaboration keys may be removed or marked reserved
- **Skill files**: apply skill rewritten with strategy routing; proposal/design templates updated
- **Documentation**: pr.md receives per-section status annotations
- **Breaking**: Profile rename from `core` to `minimal`; existing `core` profile users need migration (suggest treating `core` as alias for `standard` during transition)

### Domain Context

This change touches the `artifact-graph`, `cli-archive`, `cli-init`, `execution-discipline`, and `collaboration-infra` bounded contexts. The core entities involved are `ArtifactGraph` (state detection + gate logic), `Profile` (workflow selection), and `ProjectConfig` (gate/execution/collaboration settings).

### Risk Assessment

- **Impact scope**: Moderate — touches CLI commands, config parsing, profile system, skill templates, and documentation. No changes to the artifact graph data model itself; gates layer on top of existing state detection.
- **Regression risk**: Low-to-moderate — profile rename is the only breaking change; mitigated by aliasing `core` → `standard` during transition. Gate enforcement is additive (currently no enforcement exists).
- **Performance implications**: Negligible — gate checks read files that are already read by existing commands.
