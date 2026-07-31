## Context

The `grspec ui` module was migrated from `ui-ux-pro-max-skill` as a standalone CLI subcommand. It provides BM25-powered search across 31 CSV data files (styles, colors, typography, UX guidelines, etc.) and a design system generator that synthesizes multi-domain recommendations with persistence (MASTER.md + page overrides).

Currently, the UI module has no awareness of the change lifecycle. The `grspec-ui` skill template tells agents about `grspec ui` commands, but integration is passive — agents must independently decide to invoke it. There is no automatic detection of UI-related content in proposals, no injection of design-system context during the apply phase, and no convention for where design-system artifacts live relative to a change.

The instruction generation pipeline has two distinct paths:
- **Artifact instructions** (`generateInstructions` in `instruction-loader.ts`): assembles schema instruction, template, project context, rules, and dependency info for a single artifact
- **Apply instructions** (`generateApplyInstructions` in `instructions.ts`): discovers all existing artifact files as `contextFiles`, parses plan.md for task progress, and returns state-aware instructions

Both paths are extensible without schema changes — they can be enriched with additional context at runtime.

## Goals / Non-Goals

**Goals:**
- Automatically detect UI-related content in proposals and designs during instruction generation
- Enrich design-phase instructions with a recommendation to run `grspec ui design-system` when UI content is detected
- Enrich apply-phase instructions with design-system context files when they exist in the change directory
- Establish a convention for design-system persistence within change directories

**Non-Goals:**
- Adding `design-system` as a formal artifact in `schema.yaml` — this would add dependency graph complexity for what is an optional, supplementary output
- Auto-executing `grspec ui design-system` during instruction generation — the system provides guidance, the agent decides
- Modifying the BM25 search algorithm or data layer — the UI module's core logic is unchanged
- Making UI detection mandatory — non-UI changes SHALL experience zero behavioral difference

## Decisions

### D1: UI content detection via keyword matching

**Choice:** Scan the text content of completed proposal.md and design.md files for UI-related keywords drawn from the existing `DOMAIN_KEYWORDS` in `src/core/ui/config.ts`. Detection returns a boolean and the matched domain(s).

Keywords to scan: a curated subset from `DOMAIN_KEYWORDS` focused on high-signal terms — `color`, `palette`, `style`, `ui`, `layout`, `font`, `typography`, `component`, `responsive`, `animation`, `dark mode`, `landing`, `dashboard`, `icon`, `accessibility`, `wcag`, `chart`, `visualization`.

**Alternatives considered:**
- Use the full `DOMAIN_KEYWORDS` map (179 terms) — rejected because low-signal terms like `page`, `form`, `input` match nearly every proposal, producing false positives
- Use NLP/embedding-based detection — rejected as over-engineered for a keyword heuristic; the BM25 engine is already available for ranked search if needed later
- Add a `ui: true` field to `.grspec.yaml` that users manually set — rejected because it requires user awareness; auto-detection is more ergonomic

**Rationale:** Keyword matching is deterministic, fast (<1ms), and transparent. The curated keyword list avoids false positives while catching genuine UI-related changes. Users can still run `grspec ui` manually for edge cases the heuristic misses.

### D2: Design-phase instruction enrichment

**Choice:** In `generateInstructions`, when `artifactId === 'design'` and UI content is detected in the completed proposal, append a supplementary instruction block to the `instruction` field recommending the agent run `grspec ui design-system "<query>"` and embed the results.

The supplementary block is appended to the existing schema instruction (not replacing it) and includes:
- A note that UI content was detected with matched keywords
- The recommended `grspec ui design-system` command with a suggested query derived from the proposal
- Guidance to persist results to `design-system/` in the change directory using `--persist --output <changeDir>/design-system`

**Alternatives considered:**
- Modify the design.md template to include a UI section — rejected because not all changes have UI content; a static template section would be noise for non-UI changes
- Add a separate `ui-design` artifact to the schema — rejected per Non-Goals; formal artifacts add dependency graph weight
- Inject the design-system output directly into the instruction — rejected because the generation depends on a query string that the agent should formulate

**Rationale:** Instruction enrichment is the lightest integration point. It leverages the existing `instruction` field without schema changes, and the agent retains full control over whether and how to invoke the UI module.

### D3: Apply-phase context injection

**Choice:** In `generateApplyInstructions`, after building `contextFiles` from schema artifacts, additionally scan the change directory for `design-system/MASTER.md`. If found, add it (and any sibling `.md` files) to `contextFiles` under a `design-system` key.

**Alternatives considered:**
- Only inject if `.grspec.yaml` has `ui-detected: true` — rejected because this adds a metadata dependency; file existence is sufficient and simpler
- Inject all files in `design-system/` recursively — rejected because the directory may contain non-markdown artifacts in the future; restricting to `.md` files is safer
- Rely entirely on the skill template to tell the agent to read design-system files — rejected because apply instructions are the canonical context source; omitting design-system files means agents using `--json` won't discover them

**Rationale:** The apply instruction path already scans for artifact outputs by file existence (`resolveArtifactOutputs`). Extending this scan to include `design-system/*.md` follows the existing pattern with minimal code.

### D4: Design-system artifact convention

**Choice:** Design-system output is stored at `<changeDir>/design-system/` as a directory containing `MASTER.md` and optional page override files. This is NOT a schema-level artifact — it has no entry in `schema.yaml`, no dependency edges, and no completion detection.

Directory structure:
```
grspec/changes/<name>/
  proposal.md
  design.md
  specs/...
  plan.md
  design-system/        ← optional, created by grspec ui
    MASTER.md
    landing.md           ← optional page override
    dashboard.md         ← optional page override
```

**Alternatives considered:**
- Store design-system output outside the change directory (e.g. `grspec/design-systems/<name>/`) — rejected because it breaks locality; change-scoped artifacts should live in the change directory
- Add `design-system` as a formal schema artifact with `generates: design-system/MASTER.md` — rejected because it would make design-system a required gate for the plan artifact (via the dependency graph), which is incorrect for non-UI changes

**Rationale:** Convention-over-configuration. The directory exists if the agent created it; the apply phase discovers it by file existence. No schema changes, no migration, no breaking changes.

### D5: Metadata flag in .grspec.yaml

**Choice:** Add an optional `ui-detected: boolean` field to `.grspec.yaml` change metadata. This is set by the design-phase skill (or manually) and read by apply-phase instructions to include a UI-specific note in the apply guidance.

This field is advisory — the apply phase discovers design-system files by existence regardless of this flag. The flag's purpose is to enable the skill template to include UI-specific workflow guidance without re-scanning the proposal.

**Alternatives considered:**
- Skip the metadata flag entirely — rejected because skills that run after design (verify, archive) benefit from knowing whether UI was involved without re-parsing the proposal
- Use a more general `detected_domains: string[]` field — rejected as premature generalization; `ui-detected` is the only domain integration planned

**Rationale:** A boolean flag is trivial to implement (one YAML field), has no performance cost, and provides a clean signal for downstream workflow steps.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| `src/core/ui/detect.ts` — keyword detection module | TDD | New file: `detectUiContent(text): { detected: boolean, keywords: string[] }` |
| `instruction-loader.ts` — design-phase enrichment | TDD | Modify `generateInstructions` to call detection + append UI block |
| `instructions.ts` — apply-phase context injection | TDD | Modify `generateApplyInstructions` to scan `design-system/` |
| `src/utils/change-metadata.ts` — ui-detected field | AI+review | Extend metadata reader/writer for optional boolean |
| `src/core/templates/workflows/ui.ts` — skill update | AI+review | Add workflow integration guidance to skill instructions |

## Risks / Trade-offs

- [Risk: False positive UI detection on non-UI changes] → Mitigation: Curated keyword list excludes generic terms; detection is advisory, not blocking. False positive only adds a suggestion the agent can ignore.
- [Risk: design-system/ directory conflicts with user-created files] → Mitigation: The `design-system/` name is specific and unlikely to collide. Document the convention in skill instructions.
- [Risk: Apply-phase context injection increases instruction payload] → Mitigation: Only markdown files are included; MASTER.md is typically <200 lines. The instruction payload is already dominated by spec and design artifact content.
- [Risk: Metadata flag drift — ui-detected set but design-system/ deleted] → Mitigation: Apply phase checks file existence regardless of flag; flag is informational only.

## Open Questions

- Should `grspec verify-change` check consistency between `ui-detected: true` and the presence of `design-system/MASTER.md`? Deferred to a follow-up change.
- Should the keyword detection use weighted scoring (more matches = higher confidence) or binary detection? Current design uses binary (any match = detected) for simplicity.
