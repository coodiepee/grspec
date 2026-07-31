---
type: proposal
change: standardize-agent-instructions
created: 2026-06-15
schema: spec-driven
---
## Why

grspec init generates rule files (code-philosophy) as prose paragraphs that AI agents demonstrably ignore, and omits AGENTS.md entirely — the universal project context file now read by 20+ AI tools and adopted by 60,000+ repositories. Users get a code philosophy no agent follows and no operational context any agent can use.

## What Changes

- **Rewrite code-philosophy rule template** from prose paragraphs to DO/DO NOT format with code examples — the format research shows agents actually follow
- **Add AGENTS.md generation** to `grspec init` — a project-level operational context file with Commands, Definition of Done, When Blocked, Architecture, Code Style summary, and Testing sections
- **Add AGENTS.md template** system parallel to existing rule-templates, detecting project metadata (package.json, test runner, directory structure) to generate actionable content
- **Deprecate `.cursorrules` generation** if grspec currently generates it (Cursor natively reads AGENTS.md since 2025)

## Capabilities

### New Capabilities
- `agents-md-generation`: AGENTS.md template and project-aware generation during `grspec init`

### Modified Capabilities
- `rule-generation`: Code-philosophy rule body changes from prose to DO/DO NOT operational format

## Risk Assessment

- **Impact scope**: `rule-templates.ts` body content change affects all 30+ tool adapters that consume it. AGENTS.md generation adds a new file to every `grspec init` run.
- **Regression risk**: Low for rule content — body format changes within existing `RuleContent` interface. AGENTS.md generation is additive (new file, never overwrites existing).
- **Behavioral risk**: Medium — code-philosophy wording change affects how every AI agent interprets coding standards. The new format is shorter per-rule but includes examples, so total line count increases. Research supports this format but real-world validation is needed.
- **Cross-tool risk**: AGENTS.md is read natively by Codex, Cursor, Copilot, Amp, Windsurf, Gemini CLI. Tool-specific rules (`.cursor/rules/`, `.claude/rules/`) remain unchanged in structure.

## Impact

- `src/core/rule-generation/rule-templates.ts` — rewrite `getCodePhilosophyRuleContent()` body
- `src/core/agents-md/` (new module) — template and generator for AGENTS.md
- `src/core/init.ts` — add AGENTS.md generation step
- Test files for new module and updated template content
- All 30+ tool rule adapters consume the updated body unchanged (format-agnostic)
