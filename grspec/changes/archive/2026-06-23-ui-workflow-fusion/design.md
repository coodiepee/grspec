---
type: design
change: ui-workflow-fusion
created: 2026-06-23
schema: spec-driven
---
## Context

The grspec workflow (propose → apply → verify) and the UI module (detect, design-system, review, rules) have been developed in parallel. The CLI already has partial integration:

- `instruction-loader.ts`: `enrichDesignInstructionWithUi()` enriches design artifact instructions with UI context
- `instructions.ts`: `generateApplyInstructions()` discovers `design-system/` in contextFiles and appends UI guidance
- `detect.ts`: `detectUiContentInChange()` scans proposal/design for 22 UI keywords with threshold ≥3

But the content templates (`content/propose.md`, `content/apply-change.md`, `content/verify-change.md`) that agents actually follow have zero UI references. The command template in `propose.ts` already has a UI detection step (Step 6), but this was never ported to the content template used by skills.

### Constraint: Content templates vs command templates

Two parallel template systems exist:
1. **Content templates** (`src/core/templates/content/*.md`) — loaded by `loadWorkflowTemplate()`, used to generate `.cursor/skills/` via `grspec init`
2. **Command templates** (`src/core/templates/workflows/*.ts` inline `content`) — used by `/grsx:` Cursor commands

Both need to be kept in sync. The propose command template already has UI detection; the content template does not.

## Goals

- Content templates include UI-aware steps so deployed skills guide agents to leverage existing CLI integration
- Apply instructions embed CRITICAL rules inline when `ui-detected: true`, reducing agent round-trips
- Verify template includes UI Quality as a conditional fourth dimension
- All changes are additive and conditional — non-UI changes are unaffected

## Non-Goals

- **Not** changing the artifact graph or schema definition — UI is handled via metadata flags, not formal artifacts
- **Not** auto-generating design systems at CLI level — the content template instructs the agent to run the command; the CLI doesn't do it automatically during `grspec new change`
- **Not** making UI detection mandatory — opt-out via `ui-auto-generate: false`
- **Not** adding semantic UI review to verify — static analysis only (`grspec ui review --json`)
- **Not** modifying `instruction-loader.ts` or `detect.ts` — these already work correctly

## Decisions

### Decision 1: Structured yaml metadata over boolean flag
**Choice**: `ui: { detected: true, keywords: [...] }` in `.grspec.yaml`
**Rationale**: Keywords provide downstream context (apply can use them to compose `grspec ui rules --search` queries). A plain boolean loses the signal about which UI aspects are involved.
**Alternative considered**: Simple `ui: true` boolean — rejected because it discards actionable information that makes apply/verify smarter.

### Decision 2: Content template changes only (not CLI-level auto-generation in propose)
**Choice**: The content template instructs the agent to run `grspec ui detect` and update yaml. The CLI's `grspec new change` does not auto-detect or auto-generate.
**Rationale**: Agents can make contextual decisions (summarize for the user, offer opt-out) that CLI pipes cannot. The propose-ui-hook spec says detection happens after proposal creation, which is agent-driven in our workflow.
**Alternative considered**: Adding `--detect-ui` flag to `grspec new change` — rejected because proposal content doesn't exist yet at `new change` time; detection needs proposal text.

### Decision 3: Inline CRITICAL rules in apply instructions via CLI code
**Choice**: Modify `generateApplyInstructions()` in `instructions.ts` to read `.grspec.yaml` for `ui-detected: true` and embed CRITICAL-severity rules inline.
**Rationale**: Agents can't run CLI commands mid-instruction-parsing. Embedding rules in the instruction field means agents see them without extra tool calls, reducing latency and improving compliance.
**Alternative considered**: Only mentioning `grspec ui rules` command in the template — already exists, but agents frequently skip optional commands.

### Decision 4: Static-only UI review in verify
**Choice**: `grspec ui review <paths> --json` only. No semantic review, no rules spot-checking.
**Rationale**: The 4 static checks (cursor-pointer, emoji icons, transition timing, reduced-motion) are fast, deterministic, and high-signal. Semantic review is expensive and better suited to dedicated `grspec-ui-review` skill invocations.
**Alternative considered**: Full semantic audit (grspec-ui-review skill) — rejected as too slow for a verify gate; users can run it separately.

### Decision 5: Port from command template, not rewrite
**Choice**: Take the existing Step 6 from `propose.ts` command template as the reference implementation for the content template.
**Rationale**: The command template has been reviewed and tested. Porting it avoids divergence and ensures both template systems are consistent.

## Data Flow

```
.grspec.yaml (source of truth for UI state)
     │
     ├── Written by: agent following propose/ff content template
     │   └── grspec ui detect → { detected, keywords } → yaml update
     │
     ├── Read by: instructions.ts (generateApplyInstructions)
     │   └── ui-detected: true → embed CRITICAL rules inline
     │
     ├── Read by: instruction-loader.ts (enrichDesignInstructionWithUi)
     │   └── Already implemented, no changes needed
     │
     └── Read by: agent following verify content template
         └── ui-detected: true → run grspec ui review → map findings
```

## Implementation Approach

### Phase 1: Content template updates (skill-level)
Update `content/propose.md`, `content/ff-change.md`, `content/apply-change.md`, `content/verify-change.md` to include UI-aware steps. This is the primary deliverable — it makes agents aware of the UI integration that already exists at the CLI level.

### Phase 2: CLI enhancement (code-level)
Modify `instructions.ts` to read `ui-detected` from `.grspec.yaml` and embed inline CRITICAL rules. This closes the gap between "suggest running a command" and "provide the information directly."

### Phase 3: Sync command templates
Ensure the inline command templates in `workflows/*.ts` files match the updated content templates for propose and apply.

### Phase 4: Regenerate deployed skills
Run `grspec init` or manually copy updated content to `.cursor/skills/` to deploy the changes.
