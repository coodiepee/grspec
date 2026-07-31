---
type: design
change: standardize-agent-instructions
created: 2026-06-15
schema: spec-driven
---
## Context

grspec init generates skills, commands, and rules for 30+ AI tools. Rules currently consist of a single "code-philosophy" template written as prose paragraphs. Research (ICLR 2026 AMBIG-SWE, GitHub's analysis of 2,500+ repos, practitioner reports) demonstrates that:

- Prose paragraphs without commands are ignored by AI agents
- DO/DO NOT format with code examples produces measurable behavioral change
- AGENTS.md (project-root, plain Markdown) is the universal standard for AI agent context, read natively by Codex, Cursor, Copilot, Gemini CLI, Amp, Windsurf, and 20+ other tools
- Effective AGENTS.md files are command-first, closure-defined, and task-organized

grspec does not generate AGENTS.md, leaving users without the most universally consumed project context file.

## Goals / Non-Goals

**Goals:**
- Code-philosophy rule template produces output that AI agents demonstrably follow (DO/DO NOT + examples)
- `grspec init` generates an AGENTS.md that gives any AI tool immediate operational context for the user's project
- AGENTS.md content is project-aware: detected build/test/lint commands, directory structure, and grspec workflow context
- Generation fits within existing `rule-templates.ts` and `init.ts` architecture

**Non-Goals:**
- Rewriting the rule adapter system (adapters remain unchanged — they format the same `RuleContent.body`)
- Generating tool-specific instruction files (CLAUDE.md, .cursorrules) — AGENTS.md is the cross-tool standard
- Auto-detecting full project architecture beyond top-level directories and package.json
- Supporting AGENTS.md in subdirectories (monorepo scoping) — out of scope for initial implementation
- Changing Cursor's `alwaysApply` to path-scoped rules — separate change

## Decisions

### Decision 1: Code-philosophy format — DO/DO NOT with examples

**Choice**: Replace prose paragraphs with structured DO/DO NOT bullets and ✓/✗ code examples.

**Alternatives considered**:
- *Keep prose, add examples*: Prose still gets skipped. Research shows the instruction format matters more than examples alone.
- *Reduce to a numbered checklist*: Loses the intent explanation. DO/DO NOT preserves both the rule and its boundary.

**Rationale**: GitHub's repo analysis found that "vagueness, not technical limitations, causes most failures." DO/DO NOT is specific and verifiable. ✓/✗ examples make rules unambiguous. The format matches what Claude Code, Codex, and Cursor documentation recommend for instruction files.

The 7 rules SHALL be preserved in meaning but restructured into 7 sections with DO/DO NOT bullets.

### Decision 2: AGENTS.md generation — project-aware template

**Choice**: Detect project metadata from `package.json` (or fallback placeholders) and generate AGENTS.md with standard sections.

**Alternatives considered**:
- *Static template with TODO comments*: Low value — users still do all the work. Barely better than a README link.
- *Full project analysis (AST, dependency graph)*: Over-engineered for init. Diminishing returns beyond package.json + directory listing.

**Rationale**: package.json provides name, description, scripts (build/test/lint), and engine requirements. Combined with a `readdir` of top-level source directories, this yields 80% of what AGENTS.md needs. The remaining 20% (architecture narrative, conventions) uses grspec-aware defaults plus TODO markers.

The generator SHALL read `package.json` scripts for Commands and Definition of Done sections. The generator SHALL scan top-level `src/` directories for Architecture section. The generator SHALL NOT require package.json — projects without it get a placeholder template.

### Decision 3: AGENTS.md section order — command-first

**Choice**: Follow the industry-standard priority order: Commands → Definition of Done → When Blocked → Architecture → Code Style → Testing → Conventions → Constraints.

**Rationale**: Research (Blake Crosley's AGENTS.md Patterns study) found that "most AGENTS.md files fail because they start with style guidance and never get to commands." Command-first ensures agents can build and test before they read style rules. This matches Codex's official guide and Claude Code's best practices.

### Decision 4: AGENTS.md placement — project root only

**Choice**: Generate at project root as `AGENTS.md`. Never overwrite an existing file in extend mode.

**Alternatives considered**:
- *Generate inside `grspec/`*: Not discoverable by any tool. AGENTS.md spec requires project root or subdirectory root.
- *Always overwrite*: Destroys user edits. The file is meant to be a living document.

**Rationale**: AGENTS.md spec defines root as the primary location. Extend mode (re-running `grspec init`) SHALL skip if the file already exists. `--force` flag SHALL regenerate it.

### Decision 5: Architecture — new module parallel to rule-generation

**Choice**: Create `src/core/agents-md/` module with `template.ts` and `generator.ts`, following the pattern established by `src/core/rule-generation/`.

**Alternatives considered**:
- *Add to `rule-templates.ts`*: AGENTS.md is not a rule — it's a project-level context file. Mixing them conflates two distinct concepts.
- *Add to `init.ts` directly*: Violates single-responsibility. Init orchestrates; generators generate.

**Rationale**: The rule-generation module separates content templates from tool-specific formatting. AGENTS.md has no tool-specific formatting (it's plain Markdown for all tools), so the module is simpler: template + project detection + assembly. No adapter registry needed.

### Decision 6: Code-philosophy summary in AGENTS.md

**Choice**: AGENTS.md SHALL include a condensed 8-10 line summary of the code philosophy rules, referencing the full rules file for detail.

**Rationale**: Every AI tool reads AGENTS.md. Not all tools read `.cursor/rules/` or `.claude/rules/`. The summary ensures code philosophy reaches all 20+ tools, while the detailed DO/DO NOT version lives in tool-specific rules for agents that support them. This avoids duplication: the summary is a pointer, not a copy.

## Risks / Trade-offs

**[Rule content change breaks existing user overrides]** → Users who modified the generated `grspec-code-philosophy.*` file will see their changes overwritten on next `grspec init`. Mitigation: this is existing behavior for all grspec-generated rules — init always regenerates. Document in CHANGELOG.

**[AGENTS.md conflicts with user's existing AGENTS.md]** → If user already has an AGENTS.md, generation silently skips in extend mode. Mitigation: display a log message "AGENTS.md exists, skipping (use --force to regenerate)."

**[Code-philosophy DO/DO NOT format is longer than prose]** → Increases from ~35 lines to ~60-70 lines. This consumes more context window. Mitigation: research shows shorter-but-ignored prose wastes more effective context than longer-but-followed instructions. Net gain in agent accuracy outweighs the ~30 extra lines.

**[package.json detection assumes Node.js ecosystem]** → Non-Node projects (Python, Go, Rust) get fallback placeholders. Mitigation: phase 1 targets Node.js (grspec's own ecosystem). Future enhancement: detect pyproject.toml, Makefile, Cargo.toml.
