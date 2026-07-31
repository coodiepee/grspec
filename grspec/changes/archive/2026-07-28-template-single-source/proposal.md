---
type: proposal
change: template-single-source
created: 2026-07-28
schema: spec-driven
---
## Why

Workflow slash commands and skills diverge because command bodies are still inlined in TypeScript while skills load `content/*.md`. Agents on `delivery=commands` vs `delivery=skills` follow different apply/archive/verify behavior. UI subcommands already use one Markdown source; core workflows and wiki did not. Close the gap now, while merging the better wording from both forks and stripping legacy/compat noise from agent-facing text.

## What Changes

- **BREAKING (agent-facing text only):** Slash command bodies become byte-identical to the shared Markdown source (same as skills). Shorter/forked INLINE command copy is removed.
- All workflow `getGrsx*CommandTemplate()` implementations that currently embed template literals SHALL load the same `content/<name>.md` as the paired skill (pattern: UI subcommands + onboard).
- Wiki slash subcommands SHALL each have a dedicated `content/wiki-*.md` loaded by the command template (no INLINE bodies).
- Content cleanup while consolidating:
  - Merge best-of-both (keep skill depth; absorb richer archive output templates from former INLINE where superior).
  - Delivery-neutral primary verbs (`grspec …`); slash examples only where teaching Cursor profile (e.g. onboard cheat sheets).
  - Remove agent-facing v1 / `ui-detected` dual-read teaching; gate language uses `effectiveUiActive` / apply JSON / `ui.md` Status.
  - Remove `Task` / subagent dispatch instructions from archive (and any other workflow templates).
  - Unify confirmation language on **AskUserQuestion**.
  - Deduplicate structural noise (e.g. archive Verification Gate double heading; normalize step numbering).
- Tests: extend UI-style **byte-identity** parity to every skill↔command pair that shares a content file; add content-guard tests for forbidden smells; refresh `skill-templates-parity` hashes; regenerate deployed `.cursor` skills/commands from generators only.
- **Validate ↔ verify alignment (cut redundancy):** Remove redundant `verify-gate` workflow and separate `grspec-verify-change` skill. Merge evidence-gate into `content/verify.md` under skill `grspec-verify` + `/grsx:verify`. Add `grspec-validate` + `/grsx:validate` paired with CLI `grspec validate` (structural only). Standard/full profiles include both `validate` and `verify`.
- **Non-goal:** Removing CLI schema v1 resolution or metadata dual-read (`ui-detected` / `ui.detected`) in runtime code — templates stop teaching it; CLI cleanup is a separate change.

## Capabilities

### New Capabilities
- `workflow-template-content`: Agent-facing workflow Markdown quality contract (single narrative, delivery neutrality, no legacy dual-read teaching, no subagent dispatch, AskUserQuestion consistency, merge rules).

### Modified Capabilities
- `template-extraction`: Require command bodies to load the same standalone Markdown as skills (not only skills); replace weak “phrase present on both sides” / separate hash locking of divergent payloads with byte-identity skill↔command↔file parity.
- `grsx-wiki-skill`: Each wiki slash subcommand body SHALL come from a dedicated content Markdown file loaded at runtime (same loader path as other workflows).
- `profile-tiers`: Standard profile installs `validate` + `verify` (not `verify-gate`).
- `execution-discipline`: Single `grspec-verify` skill (artifact + evidence); new `grspec-validate` aligned with CLI validate.

## Domain Context

Affects the **agent instruction packaging** surface (skills + slash commands) in the tooling/workflow bounded context. No product domain entities change.

## Risk Assessment

- **Impact scope:** High for agent behavior — every regenerated command file changes; medium for TypeScript (delete INLINE, wire `loadWorkflowTemplate`).
- **Regression risk:** Agents that relied on shorter slash wording (compressed strategy routing, “Prompt user” vs AskUserQuestion) will see the full skill text. Mitigate by intentional merge review per workflow and parity tests that lock the chosen source.
- **Hash / snapshot churn:** `skill-templates-parity` expected hashes will all update — plan includes one coordinated refresh after content freeze.
- **Deployed `.cursor` drift:** Hand-edited command/skill files in this repo must be regenerated; risk of reintroducing dual source if anyone edits `.cursor` by hand after.
- **Performance:** Negligible (same file reads skills already do).

## Impact

- `src/core/templates/workflows/*.ts` — remove INLINE command bodies; wiki split content files
- `src/core/templates/content/*.md` — consolidated + optimized bodies; new `wiki-*.md`
- `test/core/templates/*parity*.ts` — strict identity + content guards
- Generated artifacts under `.cursor/commands/` and `.cursor/skills/` (via init/update generators)
- Specs: `template-extraction`, `grsx-wiki-skill`; new `workflow-template-content`
