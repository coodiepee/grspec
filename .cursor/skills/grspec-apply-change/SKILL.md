---
name: grspec-apply-change
description: Implement plan items from an grspec change. Use when the user wants to start implementing, continue implementation, or work through the plan.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

Implement plan items from an grspec change.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `grspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `grspec apply <other>` / `/grsx:apply <other>`).

2. **Check status to understand the schema**
   ```bash
   grspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifact contains the plan (typically "plan" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   grspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/plan or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Plan checklist with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using grspec-continue-change
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, plan
   - **ui** (if present in `contextFiles`): change `ui.md`, project `grspec/ui/MASTER.md`, and change/project `ui/pages/*.md` — reference design tokens when implementing UI-related tasks. Change pages override project pages for the same screen slug.
   - Other schemas: follow the contextFiles from CLI output

5. **Check for file-level overlaps (coordination)**

   If the change has `touches` in `.grspec.yaml`, check for coordination needs:
   ```bash
   grspec change overlap --json
   ```

   For each overlapping file, select a coordination mode:
   - **Extend**: The overlapping change is already merged/complete → read current file state, build on top
   - **Prepare**: The overlapping change is still in progress → leave extension points, use compatible abstractions
   - **Negotiate**: Intents are structurally incompatible → present 2-3 resolution options to the user

   If no overlaps exist, proceed normally.

6. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M plan items complete"
   - Remaining plan items overview
   - Dynamic instruction from CLI
   - Any coordination notes for overlapping files

7. **Implement plan items (loop until done or blocked)**

   For each pending plan item:
   - Show which plan item is being worked on
   - **Detect the strategy tag** from the task line: `[codegen]`, `[TDD]`, `[AI+review]`, `[manual]`
   - **Route by strategy** (see below)
   - When modifying a file with known overlap, apply the selected coordination mode
   - Mark the plan item complete in the plan file: `- [ ]` → `- [x]`
   - Continue to the next plan item

   **Strategy routing:**

   | Tag | Workflow | Key constraint |
   |-----|---------|---------------|
   | `[codegen]` | Run the codegen command (e.g., `make gen`). Review output. Do NOT hand-write generated code. | If codegen fails, fix the schema input, not the output. |
   | `[TDD]` | **Write test FIRST** (RED), then implement minimal code to pass (GREEN), then refactor. Follow grspec-tdd skill if installed. | NEVER write implementation before the failing test exists. Anti-check: if you're about to write code without a test, STOP. |
   | `[AI+review]` | Implement the change, then self-review against the spec. Check: does every SHALL statement in the relevant spec have corresponding code? | After implementing, re-read the spec and verify coverage. |
   | `[manual]` | Flag for user attention. Describe what needs to be done and pause. | Do NOT implement manual tasks — the user handles these. |
   | (no tag) | Treat as `[AI+review]`. |  |

   **UI plan tasks (read from apply JSON):**
   - Use `effectiveUiActive`, `uiArtifactStatus`, and `uiFoundationReady` from `grspec instructions apply --json`
   - Do NOT mark tasks under plan `## UI` complete when `uiArtifactStatus` is `blocked` or `unknown`
   - When `uiArtifactStatus` is `blocked` and `uiFoundationReady` is false, run `/grsx-ui-init` or update `ui.md` before completing UI tasks

   **After EVERY task (regardless of strategy):**
   - Run project verification if available (`make test`, `pnpm test`, etc.)
   - When `effectiveUiActive` is true — also run `grspec ui review <changed-file-paths>` and report any CRITICAL/HIGH findings before marking complete
   - Do NOT mark complete if verification fails

   **Pause if:**
   - Plan item is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts
   - Strategy is `[manual]` → describe and pause
   - Coordination mode is `negotiate` → present options and wait for selection

8. **On completion or pause, show status**

   Display:
   - Plan items completed this session
   - Overall progress: "N/M plan items complete"
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

**Guardrails**
- Keep going through plan items until done or blocked
- Always read context files before starting (from the apply instructions output)
- If a plan item is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each plan item
- Update the plan checkbox immediately after completing each plan item
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names
- NEVER skip verification after a task — evidence before assertions
- When modifying overlapping files, respect coordination mode (extend/prepare/negotiate)

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if the plan artifact exists), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
