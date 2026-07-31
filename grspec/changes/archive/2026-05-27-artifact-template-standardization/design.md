## Context

GrSpec's spec-driven schema defines four artifact types — proposal, spec, design, plan — each with a markdown template and schema-level instruction. Currently these templates share no structural metadata (no frontmatter), use inconsistent normative language (only specs enforce SHALL/MUST), and the plan artifact has a naming split: the schema generates `plan.md` but `task-progress.ts` and 7+ skill templates still reference `tasks.md` as a fallback candidate. Strategy tags in plan tasks are ad-hoc strings with no validation.

The instruction generation pipeline (`instruction-loader.ts` → `instructions.ts`) loads templates verbatim from `schemas/spec-driven/templates/` and passes them through unchanged. There is no injection or transformation step between template loading and output — this is the integration point for frontmatter.

## Goals / Non-Goals

**Goals:**
- Every artifact template SHALL include YAML frontmatter with machine-readable metadata
- Design and plan templates SHALL use normative terminology (SHALL/SHOULD/MAY) for constraints
- `tasks.md` SHALL be retired as a recognized filename — `plan.md` is the sole plan artifact
- Plan strategy tags SHALL use a controlled vocabulary with clear definitions

**Non-Goals:**
- Retroactively adding frontmatter to existing completed artifacts in `grspec/archive/` — archive is immutable
- Changing spec template structure — specs already use normative terminology correctly
- Enforcing frontmatter in user-written content — frontmatter is injected by tooling, not manually authored
- Runtime validation that blocks `grspec instructions` if frontmatter is missing — validation is advisory

## Decisions

### D1: Frontmatter schema

**Choice:** Four fields: `type`, `change`, `created`, `schema`.

```yaml
---
type: proposal | spec | design | plan
change: <change-name>
created: <ISO-8601 date>
schema: <schema-name>
---
```

**Alternatives considered:**
- Include `version` field — rejected because artifacts are not independently versioned; the schema version suffices
- Include `status` field (draft/final) — rejected because completion state is already tracked by file existence in the artifact graph (`state.ts`)
- Include `depends_on` list — rejected because dependency information already lives in `schema.yaml` and duplicating it creates drift risk

**Rationale:** Minimal metadata that enables tooling (type-based routing, change association) without duplicating information already present in the schema or filesystem. Four fields cover identification (type + change), provenance (created), and schema binding (schema).

### D2: Frontmatter injection point

**Choice:** Inject frontmatter in `generateInstructions()` within `instruction-loader.ts`, prepending it to the `template` field before returning `ArtifactInstructions`.

**Alternatives considered:**
- Inject at CLI output time in `printInstructionsText()` — rejected because JSON consumers (`--json`) would not receive the frontmatter
- Store frontmatter directly in template files — rejected because `change` and `created` are dynamic values that differ per invocation
- Inject in a new post-processing step — rejected as unnecessary complexity; `generateInstructions` already assembles all artifact data

**Rationale:** Injecting at the `generateInstructions` level ensures all consumers (text output, JSON output, future API) receive consistent frontmatter. The template files remain static scaffolds.

### D3: Normative terminology in design and plan templates

**Choice:** Add normative keywords to template comments and schema instructions for design.md and plan.md. The proposal template remains advisory (proposals describe intent, not requirements).

Specifically:
- **design.md** template: Decisions section comments SHALL use "Decision X SHALL..." phrasing; Risks section SHALL use "Mitigation MUST address..."
- **plan.md** template: No template-level normative changes (plan is a checklist, not prose). Schema instruction for plan SHALL note that task descriptions SHOULD use imperative mood.
- **Schema instructions** for design and plan artifacts SHALL include a note: "Use SHALL for hard requirements, SHOULD for recommendations, MAY for optional items."

**Alternatives considered:**
- Add normative terms to proposal template — rejected because proposals are exploratory documents; premature normative language constrains ideation
- Require normative terms in all artifact content — rejected because enforcement in free-form markdown is fragile and creates false positives

**Rationale:** Design documents make architectural decisions that downstream implementors must follow — normative language makes the binding force explicit. Plans are mechanical checklists where normative language adds noise.

### D4: Retire tasks.md

**Choice:** Two-phase deprecation.

**Phase 1 (this change):**
- `getTaskProgressForChange` and `getIncompleteItemsForChange` in `task-progress.ts`: keep reading both files but emit a `console.warn` when `tasks.md` is found and `plan.md` is absent
- All skill templates: update references from `tasks.md` to `plan.md`
- Schema `apply.tracks` already points to `plan.md` — no change needed

**Phase 2 (future change):**
- Remove `tasks.md` from candidate arrays entirely
- This is a separate change to give users one release cycle to rename their files

**Alternatives considered:**
- Hard remove immediately — rejected because existing in-progress changes with `tasks.md` would silently lose task tracking
- Keep both forever — rejected because dual-path logic adds maintenance burden and confuses new users about which file to create
- Auto-rename `tasks.md` to `plan.md` — rejected because automatic file renames are surprising and could conflict with version control

**Rationale:** Deprecation-then-removal follows semver conventions. The warning gives clear guidance while maintaining backward compatibility for one cycle.

### D5: Strategy tag vocabulary

**Choice:** Define four canonical tags as a TypeScript string union: `codegen`, `TDD`, `AI+review`, `manual`. No runtime validation in this change — standardize at the template and documentation level only.

**Alternatives considered:**
- Add Zod validation to parse strategy tags from plan.md content — rejected because plan parsing (`parseTasksFile` in `instructions.ts`) only extracts checkbox status, not tag content; adding tag extraction is scope creep
- Expand vocabulary with `test`, `docs`, `config` — rejected because the current four cover all implementation modalities; content categories (test, docs) are orthogonal to strategy

**Rationale:** Controlled vocabulary in templates guides AI agents to use consistent tags. Runtime validation can be added later if tag consistency becomes a quality issue.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| Template files (`schemas/spec-driven/templates/*.md`) | AI+review | Add frontmatter placeholder + normative comments |
| `instruction-loader.ts` frontmatter injection | TDD | Unit test: template output includes frontmatter with correct values |
| `task-progress.ts` deprecation warning | TDD | Unit test: warning emitted when tasks.md found without plan.md |
| Skill template updates (7+ files) | AI+review | Bulk find-replace `tasks.md` → `plan.md` |
| Schema instruction updates | manual | Review and edit normative language in schema.yaml |

## Risks / Trade-offs

- [Risk: Breaking existing changes with tasks.md] → Mitigation: Phase 1 is warn-only; no behavioral change. Phase 2 is a separate future change.
- [Risk: Frontmatter injection changes template hash/fingerprint] → Mitigation: Template content is not hashed anywhere in the codebase; `detectCompleted` uses file existence, not content comparison.
- [Risk: Normative terminology in templates may confuse non-spec artifacts] → Mitigation: Only design.md gets normative terms in Decisions/Risks sections. Plan and proposal remain in natural language.
- [Risk: Skill template bulk update may miss references] → Mitigation: `rg 'tasks\.md' src/` identifies all 12 occurrences across 10 files; comprehensive test coverage on skill generation ensures no regression.

## Migration Plan

1. Ship Phase 1 with deprecation warnings — users see guidance in CLI output
2. Document the change in CHANGELOG under "Deprecations"
3. After one release cycle, ship Phase 2 (remove tasks.md support) as a separate change

## Open Questions

- Should `grspec validate` also check for frontmatter presence on completed artifacts? Currently deferred to a future change to keep scope bounded.
- Should the frontmatter `created` field use the file's mtime or the current timestamp at instruction generation time? Recommendation: current timestamp, since the instruction is for artifact creation, not file modification.
