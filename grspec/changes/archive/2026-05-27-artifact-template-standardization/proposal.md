## Why

Artifact templates (proposal, spec, design, plan) lack structural consistency: no YAML frontmatter for machine-readable metadata, inconsistent normative terminology (only specs use SHALL/MUST), and a `plan.md` vs `tasks.md` naming split that adds confusion and unnecessary fallback code. Standardizing these templates improves both AI agent comprehension and automated tooling.

## What Changes

- Add YAML frontmatter to all 4 artifact templates with `type`, `change`, `created`, `schema` fields
- Enforce normative vocabulary (SHALL/SHOULD/MAY per RFC 2119) in spec, design, and plan templates — not just specs
- Resolve `plan.md` vs `tasks.md` naming: retire `tasks.md`, remove dual-path fallback from `task-progress.ts` and skill templates
- Define a controlled vocabulary enum for plan strategy tags replacing ad-hoc `[codegen|TDD|AI+review|manual]` strings
- Update `grspec instructions` output to validate frontmatter presence on completed artifacts

## Capabilities

### New Capabilities
- `artifact-frontmatter`: YAML frontmatter schema for artifacts with type, change, created, and schema fields
- `normative-terminology`: Enforced normative vocabulary (SHALL/SHOULD/MAY) in design and plan templates
- `strategy-tags`: Controlled vocabulary for plan task strategy tags with validation

### Modified Capabilities
- `artifact-template-resolution`: Template resolution SHALL include frontmatter injection with change-specific metadata
- `task-progress-parsing`: Task progress parser SHALL read only `plan.md` and reject `tasks.md` fallback

## Risk Assessment

- **Impact scope**: Touches schema templates (4 files), instruction generation, task-progress parser, and all skill templates that reference `tasks.md`
- **Regression risk**: Removing `tasks.md` fallback is **BREAKING** for existing changes that use `tasks.md` — requires migration path or deprecation period
- **Performance**: No performance impact — changes are template/validation layer only
- **Coordination**: Skill templates that mention `tasks.md` need updating in the same change

## Impact

- `schemas/spec-driven/templates/*.md` — all 4 templates modified
- `schemas/spec-driven/schema.yaml` — frontmatter schema definition added
- `src/utils/task-progress.ts` — remove `tasks.md` candidate path
- `src/core/templates/workflows/*.ts` — update references from `tasks.md` to `plan.md`
- `src/commands/validate.ts` — add frontmatter validation for completed artifacts
