## Why

The newly migrated `grspec ui` module (BM25 search, design system generator, persistence) is a standalone CLI tool with no awareness of the change lifecycle. When a developer works on a UI-heavy feature, there is no systematic trigger to invoke design intelligence — the agent only uses it if the grspec-ui skill happens to be installed and the user or skill mentions it. Integrating the UI module with the change workflow ensures design-system recommendations are surfaced automatically for UI-related changes.

## What Changes

- Add UI content detection to the change analysis phase: scan proposal/design for UI keywords (color, style, layout, font, component, responsive, animation)
- During design artifact creation: when UI content is detected, auto-suggest `grspec ui design-system` and embed the result as a design-system section in `design.md`
- During apply phase: inject UI design-system context (MASTER.md, page overrides) into apply instructions so the agent references concrete design tokens
- Persist `design-system/` folder alongside change artifacts when `--persist` is used during design phase
- Keep `grspec ui` fully functional as a standalone module — workflow integration is additive, not replacing

## Capabilities

### New Capabilities
- `ui-content-detection`: Automatic detection of UI-related content in proposals and designs, triggering design-system generation
- `design-phase-ui-hook`: During design artifact creation, auto-invoke `grspec ui design-system` when UI content is detected and embed structured recommendations
- `apply-ui-context`: During apply phase, inject persisted design-system artifacts (MASTER.md, page overrides) as context for the implementing agent
- `design-system-artifact`: Design-system persistence folder treated as a change artifact alongside proposal, specs, design, and plan

### Modified Capabilities
*(none — existing capabilities are unchanged; all integration points are additive)*

## Risk Assessment

- **Impact scope**: Touches instruction generation (`grspec instructions design`, `grspec instructions apply`), change metadata (`.grspec.yaml`), and the UI module's persistence layer
- **Regression risk**: Low — integration is opt-in, triggered only when UI keywords are detected. Existing non-UI changes are unaffected.
- **Performance**: `grspec ui design-system` adds ~50ms of BM25 search across CSV files — negligible for a design-phase operation
- **Coordination**: Depends on the `grspec ui` module being present (completed in the current migration). If the `artifact-template-standardization` change adds frontmatter, the design-system artifact should follow the same pattern.

## Impact

- `schemas/spec-driven/schema.yaml` — optional `design-system` artifact definition
- `src/core/instructions.ts` — inject UI context during design and apply phases
- `src/core/ui/persist.ts` — support change-relative output directory
- `src/core/templates/workflows/ui.ts` — update skill instructions to reference workflow integration
- `.grspec.yaml` per change — new `ui-detected: true` metadata flag
