---
type: proposal
change: add-rule-generation
created: 2026-06-11
schema: spec-driven
---
## Why

`grspec init` generates skills and commands for AI tools, but has no mechanism for generating **rules** — tool-native instruction files that govern coding behavior across all sessions. Users must manually create these for each tool. Adding rule generation closes this gap, letting grspec install a default "Code Philosophy" rule (and future rules) into each tool's native rules directory with the correct format and frontmatter.

## What Changes

- New `rule-generation` module (`src/core/rule-generation/`) following the same adapter pattern as `command-generation`
- `ToolRuleAdapter` interface with per-tool adapters for file path, extension, and frontmatter formatting
- `RuleAdapterRegistry` for looking up adapters by tool ID
- Default "Code Philosophy — Seven Meta-Rules" rule template
- `init.ts` integration: generate rules after skills/commands, always (not filtered by profile or delivery)
- `update.ts` integration: rules regenerated on `grspec update`
- Adapters for all tools with known rules directory conventions (Cursor `.mdc`, Claude `.md`, Windsurf `.md` with `trigger`, Cline `.md`, RooCode `.md`, GitHub Copilot `.instructions.md`, etc.)
- Generic fallback adapter for tools without documented rules conventions (`<skillsDir>/rules/<name>.md`)

## Capabilities

### New Capabilities
- `rule-generation`: Define tool-agnostic rule content, per-tool rule adapters, and a registry for generating rule files during init/update

### Modified Capabilities
- `cli-init`: Init flow gains a rule generation step that runs after skills/commands, independent of profile and delivery settings

## Domain Context

Affects the **Template System** bounded context (`src/core/templates/`, `src/core/command-generation/`). The new `rule-generation` module is a peer of `command-generation` — both transform shared content through tool-specific adapters. Also touches **CLI Interface** (`src/core/init.ts`, `src/core/update.ts`) for integration.

## Risk Assessment

- **Impact scope**: New module (`rule-generation/`) plus integration in `init.ts` and `update.ts`. Existing skill/command generation is untouched.
- **Regression risk**: Low. Rule generation is additive — it writes new files to rules directories that grspec has not previously touched. No existing files are modified.
- **Cross-platform**: File paths must use `path.join()` throughout. Rule adapters follow the same cross-platform pattern as command adapters.
- **User file conflicts**: If a user already has a `grspec-code-philosophy.mdc` (or equivalent) in their rules dir, `init` will overwrite it. This matches existing skill/command behavior (idempotent regeneration).
- **Monolithic tools**: Gemini (`GEMINI.md`) and Codex (`AGENTS.md`) use hierarchical file discovery, not per-file rules directories. These tools get rules written to `<skillsDir>/rules/` as reference files the user can optionally import.

## Impact

- **New files**: `src/core/rule-generation/` module (types, registry, generator, adapters, templates)
- **Modified files**: `src/core/init.ts` (add rule generation step), `src/core/update.ts` (regenerate rules), `src/core/shared/` (optional: rule status tracking)
- **Generated output**: One rule file per configured tool in their native rules directory (e.g., `.cursor/rules/grspec-code-philosophy.mdc`, `.claude/rules/grspec-code-philosophy.md`)
- **No dependency changes**: Pure TypeScript, no new packages
