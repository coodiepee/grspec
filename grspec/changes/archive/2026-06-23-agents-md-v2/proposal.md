---
type: proposal
change: agents-md-v2
created: 2026-06-15
schema: spec-driven
---
## Why

The AGENTS.md template from `standardize-agent-instructions` covers basic sections but is missing three of the six consensus areas identified by GitHub's analysis of 2,500+ repositories (git workflow, boundaries, tech stack). Additionally, `grspec init` only generates AGENTS.md — projects using Claude Code, Gemini, or Copilot lack tool-specific pointer files that reference the shared context.

## What Changes

- Redesign AGENTS.md template to cover all six consensus areas: Commands, Architecture, Code Style, Testing, **Git Workflow** (new), **Boundaries** (replaces When Blocked + Definition of Done)
- Add **Tech Stack** auto-detection from `dependencies`/`devDependencies` (framework, language, test runner, bundler)
- Merge "Definition of Done" and "When Blocked" into a three-tier **Boundaries** section (Always/Ask First/Never)
- Reorder sections to match industry convention: Commands → Architecture → Code Style → Testing → Git Workflow → Boundaries → grspec Workflow
- Generate **CLAUDE.md** pointer file when `--tools claude` or `--tools all` (references AGENTS.md, adds Claude-specific hints)
- Generate **GEMINI.md** pointer file when `--tools gemini` or `--tools all`
- AGENTS.md generated **always** during init, regardless of `--tools` flag (it's the universal file)

## Capabilities

### New Capabilities
- `tool-pointer-generation`: Generate tool-specific pointer files (CLAUDE.md, GEMINI.md) that reference AGENTS.md and add tool-specific behavioral hints
- `tech-stack-detection`: Detect project tech stack (framework, language version, test runner, bundler) from package.json dependencies

### Modified Capabilities
- `agents-md-generation`: Template redesigned with new sections (Git Workflow, Boundaries), new section order, tech stack header, and always-generate behavior
- `cli-init`: AGENTS.md generated unconditionally; tool-specific pointer files generated based on `--tools` flag

## Risk Assessment

- **Impact scope**: Template module (`agents-md/`), init command, and new pointer file generators. ~4 modules touched.
- **Regression risk**: Existing AGENTS.md output format changes — projects that ran `grspec init` before get different output if they `--force` regenerate. Non-breaking since AGENTS.md is documentation, not code.
- **Performance**: Reads additional fields from package.json (dependencies) — negligible overhead.
- **Coordination**: `standardize-agent-instructions` change is complete (13/13 tasks). No overlap with `ui-init` change (different modules).

## Impact

- `src/core/agents-md/template.ts` — redesigned section interface and assembly
- `src/core/agents-md/generator.ts` — new detection logic (tech stack, git workflow defaults), redesigned section builders
- `src/core/agents-md/index.ts` — new exports for pointer generators
- `src/core/init.ts` — always-generate AGENTS.md logic, conditional pointer file generation
- New: `src/core/agents-md/pointer-files.ts` — CLAUDE.md / GEMINI.md generators
- Tests: updated and new test files for all changed modules
