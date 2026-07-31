---
type: design
change: add-rule-generation
created: 2026-06-11
schema: spec-driven
---
## Context

`grspec init` currently generates two artifact types: **skills** (SKILL.md files in `<skillsDir>/skills/`) and **commands** (tool-specific command files via `CommandAdapterRegistry`). Commands use a proven adapter pattern where tool-agnostic `CommandContent` is transformed by per-tool `ToolCommandAdapter` implementations into correctly formatted files.

AI tools have converged on per-file rules directories with tool-specific frontmatter:
- Cursor: `.cursor/rules/*.mdc` with `alwaysApply`/`description`/`globs`
- Claude Code: `.claude/rules/*.md` with optional `paths`
- Windsurf: `.windsurf/rules/*.md` with `trigger`/`description`/`globs`
- Cline: `.clinerules/*.md` with `paths`/`description`/`alwaysApply`
- RooCode: `.roo/rules/*.md` (no frontmatter, always loaded)
- GitHub Copilot: `.github/instructions/*.instructions.md` with `applyTo`/`description`
- Gemini CLI: `GEMINI.md` (monolithic; no per-file rules)
- Codex: `AGENTS.md` (monolithic discovery chain)

Rule generation fills the third and final artifact category that `grspec init` can produce.

## Goals / Non-Goals

**Goals:**
- Add a rule generation system parallel to command generation, using the same adapter pattern
- Generate a default "Code Philosophy" rule into each configured tool's native rules directory
- Use each tool's native frontmatter format for "always apply" behavior
- Design for multiple rules from the start (extensible registry)
- Rules SHALL always be generated regardless of profile or delivery settings

**Non-Goals:**
- Appending to monolithic instruction files (`GEMINI.md`, `AGENTS.md`, `CLAUDE.md`) — we write to `<skillsDir>/rules/` instead, as reference files
- Supporting rule removal or cleanup commands in this change (analogous to `removeSkillDirs` / `removeCommandFiles`)
- Profile-based filtering of rules (rules are always-on by design)
- User-authored custom rule templates (only grspec-managed rules)

## Decisions

### D1: Mirror the command-generation adapter pattern

**Choice:** Create `src/core/rule-generation/` as a peer module to `src/core/command-generation/`, with `ToolRuleAdapter`, `RuleAdapterRegistry`, and `generateRule`/`generateRules` functions.

**Alternatives considered:**
- Extending `ToolCommandAdapter` with rule methods — rejected because rules and commands have different semantics (rules have no `id`/`name`/`category`/`tags`, rules have `alwaysApply`/`trigger` instead)
- Inline rule generation in `init.ts` — rejected because per-tool formatting logic would grow with each adapter and become unmaintainable

**Rationale:** The command adapter pattern has proven to scale (26+ tools). Rules have identical cardinality (one adapter per tool) and the same "shared content → tool-specific output" transform shape. The incremental code cost is low, and the separation keeps each module focused.

### D2: RuleContent interface

```typescript
interface RuleContent {
  id: string;           // e.g., 'code-philosophy'
  description: string;  // used in frontmatter for tools that support it
  body: string;         // the markdown rule content (shared across all tools)
}
```

The `id` drives file naming (`grspec-<id>.mdc` for Cursor, `grspec-<id>.md` for others). The `description` populates tool-specific frontmatter. The `body` is identical across tools.

### D3: ToolRuleAdapter interface

```typescript
interface ToolRuleAdapter {
  toolId: string;
  getRuleFilePath(ruleId: string): string;
  formatRuleFile(content: RuleContent): string;
}
```

SHALL follow the same pattern as `ToolCommandAdapter`. Each adapter encapsulates its tool's rules directory location, file extension, and frontmatter format.

### D4: Tier-based adapter strategy

Tools fall into three tiers based on rules support:

| Tier | Tools | Adapter Type |
|------|-------|--------------|
| **Tier 1**: Documented rules directory | cursor, claude, windsurf, cline, roocode, github-copilot, kilocode | Custom adapter with native frontmatter |
| **Tier 2**: No documented rules convention | All other tools with `skillsDir` | Generic adapter: `<skillsDir>/rules/grspec-<id>.md`, no frontmatter |
| **Tier 3**: No `skillsDir` | agents (AGENTS.md-only) | No adapter (skip) |

**Alternatives considered:**
- Writing only Tier 1 adapters — rejected because Tier 2 tools would get nothing; a generic fallback is cheap and provides value
- Separate adapter files for each Tier 2 tool — rejected because they'd all be identical; a single `GenericRuleAdapter` factory suffices

**Rationale:** A `createGenericAdapter(toolId, skillsDir)` factory SHALL produce adapters for Tier 2 tools. This avoids 20+ identical adapter files while keeping the registry uniform.

### D5: Frontmatter format per Tier 1 tool

| Tool | Extension | Frontmatter |
|------|-----------|-------------|
| Cursor | `.mdc` | `description`, `alwaysApply: true` |
| Claude Code | `.md` | (none — rules without `paths` are unconditionally loaded) |
| Windsurf | `.md` | `trigger: always_on`, `description` |
| Cline | `.md` | `alwaysApply: true`, `description` |
| RooCode | `.md` | (none — all files in `.roo/rules/` are always loaded) |
| GitHub Copilot | `.instructions.md` | `applyTo: "**"`, `description` |
| Kilo Code | `.md` | `alwaysApply: true`, `description` |

### D6: Rules are NOT governed by delivery or profile

**Choice:** Rules SHALL always be generated when a tool is selected, regardless of `delivery` (`'both' | 'skills' | 'commands'`) or profile settings.

**Alternatives considered:**
- Adding `'rules'` to the delivery union type — rejected because it adds configuration complexity for something that should be universal
- Gating rules behind a feature flag — rejected as over-engineering for a default that all users benefit from

**Rationale:** Rules express coding philosophy that applies to all code generation. Unlike skills (which are interactive workflows) or commands (which are invokable actions), rules are passive context that costs nothing when loaded. There is no reason to skip them.

### D7: Rule templates registry

**Choice:** A `getRuleTemplates()` function SHALL return an array of `RuleTemplateEntry` objects, mirroring `getSkillTemplates()`. The initial registry contains one entry: `code-philosophy`.

```typescript
interface RuleTemplateEntry {
  content: RuleContent;
  ruleId: string;
}
```

**Rationale:** Designing for a registry from the start means adding future rules (e.g., `testing-conventions`, `security-guidelines`) requires only adding an entry — no structural changes.

### D8: File naming convention

**Choice:** Rule files SHALL be named `grspec-<ruleId>.<ext>` where `<ext>` is tool-specific (`.mdc` for Cursor, `.instructions.md` for GitHub Copilot, `.md` for all others).

The `grspec-` prefix clearly identifies grspec-managed rules, preventing collision with user-authored rules.

### D9: Integration in init.ts

Rule generation SHALL happen after skill and command generation in `generateSkillsAndCommands`. The result type SHALL include `rulesGenerated: number` and `rulesSkipped: string[]` fields. The success message SHALL report rule counts alongside skill/command counts.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| `rule-generation/types.ts` | Manual | `RuleContent`, `ToolRuleAdapter`, `GeneratedRule` interfaces |
| `rule-generation/generator.ts` | Manual | `generateRule`, `generateRules` — trivial adapter delegation |
| `rule-generation/registry.ts` | Manual | `RuleAdapterRegistry` — same pattern as `CommandAdapterRegistry` |
| `rule-generation/adapters/*.ts` | Manual | Tier 1 adapters (7) + generic factory |
| Rule template content | Manual | Single `code-philosophy` template with the Seven Meta-Rules body |
| `init.ts` integration | Manual | Add rule generation step in `generateSkillsAndCommands` |
| `update.ts` integration | Manual | Regenerate rules alongside skills/commands |
| Tests | TDD | Unit tests for adapters, generator, and registry |

## Risks / Trade-offs

- **[Frontmatter format drift]** → Tool vendors may change their frontmatter schemas. Mitigation: each adapter is isolated; updating one tool's format requires changing only one file. The search results used to build this design are from 2026 sources.

- **[Tier 2 generic adapter produces files tools may not read]** → Some tools may not auto-discover `<skillsDir>/rules/`. Mitigation: the files serve as documentation/reference even if not auto-loaded; users can import them manually. This matches how we handle Gemini/Codex.

- **[Overwriting user-customized rules]** → If a user manually edits `grspec-code-philosophy.mdc`, `grspec update` will overwrite it. Mitigation: the `grspec-` prefix makes ownership clear. Users who want to customize should copy and rename rather than edit in-place. This is identical to existing skill/command behavior.

- **[Adapter count scaling]** → 7 custom + ~20 generic adapters is a lot of registry entries. Mitigation: the generic factory keeps actual code minimal; the registry is just a Map lookup with O(1) cost.
