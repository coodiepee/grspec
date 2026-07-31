# workflow-template-content Specification

## Purpose
Quality contract for agent-facing workflow Markdown after single-source consolidation: one narrative per workflow, delivery-neutral CLI verbs, no legacy UI dual-read teaching, no Task/subagent dispatch, AskUserQuestion consistency, and content-guard tests.
## Requirements
### Requirement: Single narrative per workflow content file
Each workflow content Markdown file SHALL be the sole agent-facing narrative for that workflow’s skill and slash command. When consolidating former INLINE command text with skill Markdown, the file SHALL retain the more complete operational guidance (strategy routing tables, UI unblock steps, gates) and SHALL absorb superior structured output examples from the former INLINE copy when those examples are more complete.

#### Scenario: Apply retains full strategy routing
- **WHEN** `content/apply-change.md` is the shared source
- **THEN** it SHALL include the strategy routing table for `[codegen]`, `[TDD]`, `[AI+review]`, and `[manual]`
- **AND** SHALL include UI plan-task gates using `effectiveUiActive`, `uiArtifactStatus`, and `uiFoundationReady`

#### Scenario: Archive absorbs multi-outcome summaries
- **WHEN** `content/archive-change.md` is consolidated
- **THEN** it SHALL include distinct success / warnings / archive-exists error output templates when those outcomes are part of the workflow
- **AND** SHALL NOT lose the UI soft-gate step

### Requirement: Delivery-neutral primary verbs
Workflow content SHALL instruct agents using CLI verbs (`grspec <verb> …`) as the primary action language. Slash-only paths (`/grsx:…`) MAY appear in onboard cheat sheets or as optional overrides, but SHALL NOT be the only way a critical step is expressed in apply, archive, verify, propose, continue, or ff content.

#### Scenario: Apply override example allows CLI or slash
- **WHEN** apply content tells the agent how to announce the selected change
- **THEN** the primary workflow steps SHALL reference `grspec` CLI commands where actions are invoked
- **AND** any slash example SHALL be optional/illustrative, not required for correctness of the step

### Requirement: No legacy UI dual-read teaching in templates
Agent-facing workflow templates SHALL NOT instruct agents to interpret `ui-detected` or “v1 metadata dual-read” when determining UI-active gates. UI-active behavior SHALL be expressed via `effectiveUiActive` from apply JSON and/or `ui.md` Status (`na` | `blocked` | `done` | `unknown`).

#### Scenario: Archive soft gate language
- **WHEN** archive content describes the UI soft gate
- **THEN** it SHALL key off `effectiveUiActive` and/or `ui.md` Status
- **AND** SHALL NOT mention `ui-detected` or “v1: ui.detected” as agent instructions

#### Scenario: Verify UI Quality gate language
- **WHEN** verify content describes when UI Quality runs
- **THEN** it SHALL use `effectiveUiActive` / apply JSON fields / `ui.md` Status
- **AND** SHALL NOT require agents to dual-read legacy metadata keys

#### Scenario: Continue catch-up detection predicate
- **WHEN** continue content describes UI catch-up detection
- **THEN** it SHALL key off absence of a structured `ui:` block (and/or `ui.md` as appropriate for schema v2)
- **AND** SHALL NOT require checking legacy flat `ui-detected: true` as a primary condition

### Requirement: No Task or subagent dispatch in workflow templates
Workflow content Markdown SHALL NOT instruct agents to spawn a Task tool subagent (or equivalent) to run another grspec skill. Cross-workflow work SHALL be described as in-process steps or “follow the `<workflow>` skill/content”.

#### Scenario: Archive sync step
- **WHEN** archive content describes syncing delta specs before archive
- **THEN** it SHALL NOT reference `Task tool` or `subagent_type`
- **AND** SHALL direct the agent to perform sync per the sync-specs workflow (skill or content) in the same session

### Requirement: Consistent confirmation interaction
Where workflow content requires structured user choice, it SHALL specify the **AskUserQuestion** tool (same phrasing family as existing skill content). It SHALL NOT mix “Prompt user for confirmation” and AskUserQuestion for the same class of gate within a single content file.

#### Scenario: Archive confirmation gates
- **WHEN** archive content asks for incomplete-artifact, incomplete-task, or UI soft-gate confirmation
- **THEN** each of those gates SHALL use AskUserQuestion wording
- **AND** SHALL NOT use a weaker “Prompt user” substitute for those same gates

### Requirement: Content guard tests
The test suite SHALL fail if shared workflow content reintroduces forbidden smells: `Task tool` / `subagent_type` in archive (and other workflow content files in scope), or agent-facing `ui-detected` dual-read teaching phrases in apply/archive/verify/continue content after this change.

#### Scenario: Guard test rejects Task tool in archive content
- **WHEN** `content/archive-change.md` contains `Task tool` or `subagent_type`
- **THEN** the content guard test SHALL fail

#### Scenario: Guard test rejects ui-detected teaching in gate templates
- **WHEN** apply, archive, verify, or continue content contains legacy dual-read teaching of the form `v1: ui.detected` or `legacy ui-detected`
- **THEN** the content guard test SHALL fail

