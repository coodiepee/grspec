---
type: design
change: agents-md-v2
created: 2026-06-15
schema: spec-driven
---
## Context

The `standardize-agent-instructions` change introduced AGENTS.md generation and DO/DO NOT code-philosophy rules. Benchmarking against 2,500+ real-world AGENTS.md files (GitHub Blog analysis, OpenAI spec, Claude Code best practices) reveals three missing consensus areas (Git Workflow, Boundaries, Tech Stack) and an opportunity to generate tool-specific pointer files that eliminate duplication across CLAUDE.md, GEMINI.md, etc.

Current `agents-md/` module: `template.ts` (section assembly), `generator.ts` (metadata detection + section builders), `index.ts` (barrel exports). Init integration in `src/core/init.ts`.

## Goals / Non-Goals

**Goals:**
- Cover all six consensus areas in AGENTS.md output (Commands, Architecture, Code Style, Testing, Git Workflow, Boundaries)
- Auto-detect tech stack from `package.json` dependencies
- Generate CLAUDE.md and GEMINI.md as lightweight pointer files referencing AGENTS.md
- Keep AGENTS.md under 100 lines for typical projects
- AGENTS.md generated unconditionally during `grspec init`, regardless of `--tools` flag

**Non-Goals:**
- Generating `.github/copilot-instructions.md` (Copilot reads AGENTS.md natively)
- Nested AGENTS.md for monorepo sub-packages (future scope)
- Dynamic AGENTS.md that varies per environment or branch
- Generating `.cursorrules` (already deprecated in favor of `.mdc` rules)
- Custom section plugins or user-defined AGENTS.md templates

## Decisions

### Decision 1: Merge Definition of Done + When Blocked into three-tier Boundaries

**Choice**: Replace separate "Definition of Done" and "When Blocked" sections with a single "Boundaries" section using the three-tier system: Always (verification commands), Ask First (schema changes, dependency additions), Never (force push, delete tests, commit secrets).

**Alternatives considered**:
- Keep separate sections — rejected because the GitHub analysis shows Boundaries as a single section in top-tier files, and splitting verification from constraints fragments related information.
- Use emoji tiers (✅/⚠️/🚫) — adopted because this is the exact convention GitHub's blog recommends and agents parse it reliably.

**Rationale**: The three-tier system is more actionable than prose paragraphs. Definition of Done items map to "Always" tier. When Blocked items map to "Never" tier. The "Ask First" tier is new and captures the middle ground that was previously missing.

### Decision 2: Tech stack detection from dependencies

**Choice**: Parse `dependencies` and `devDependencies` from `package.json` to detect framework (react, next, express, fastify, etc.), test runner (vitest, jest, mocha), bundler (vite, webpack, esbuild), and language version from `engines.node`.

Detection SHALL use explicit lookup maps — a `FRAMEWORK_PACKAGES` constant mapping package names to display names — not regex or heuristic pattern matching. The same detection mechanism SHALL identify git tooling: `commitlint`/`@commitlint/*` for Conventional Commits, `husky`/`lint-staged` for pre-commit hooks.

**Alternatives considered**:
- Detect from import statements in source files — rejected because it requires AST parsing, is slow, and fragile.
- Prompt user to declare stack — rejected because auto-detection provides better out-of-box experience and users can edit the generated file.

**Rationale**: `package.json` is the canonical dependency declaration. A lookup map is maintainable and testable. The detected stack appears as a single line under the project heading: "TypeScript · Node 22 · Vitest · pnpm". Git tooling detection uses the same pattern but feeds into the Git Workflow section rather than the header.

### Decision 3: CLAUDE.md / GEMINI.md as pointer files

**Choice**: Generate tool-specific files as minimal pointers (~10-15 lines) that reference AGENTS.md for shared context and add only tool-specific behavioral hints.

CLAUDE.md SHALL contain `Read @AGENTS.md for project context, commands, and conventions.` (uses Claude Code's `@` import syntax) plus Claude-specific tips (compact mode, TodoWrite usage).

GEMINI.md SHALL contain `Read AGENTS.md for project context` plus Gemini-specific tool mapping notes.

**Alternatives considered**:
- Duplicate all AGENTS.md content into CLAUDE.md — rejected because it causes drift and wastes context tokens.
- Only generate AGENTS.md, skip pointer files — rejected because Claude Code users expect CLAUDE.md and will create it anyway; providing a well-structured one prevents ad-hoc duplication.

**Rationale**: Pointer files follow the "AGENTS.md as single source of truth" principle. Tool-specific files add value only where the tool has unique conventions (e.g., Claude's `@` import, Gemini's tool naming).

### Decision 4: AGENTS.md generated unconditionally

**Choice**: `grspec init` SHALL always generate AGENTS.md regardless of the `--tools` flag value. The `--tools` flag only controls which tool-specific pointer files and rule directories are generated.

**Rationale**: AGENTS.md is the universal format read by 20+ tools. Skipping it when `--tools cursor` is specified would be a disservice since Cursor also reads AGENTS.md. The file is vendor-neutral by design.

### Decision 5: Section ordering follows industry convention

**Choice**: Sections SHALL appear in this order:
1. Project header (name + tech stack)
2. Commands
3. Architecture
4. Code Style
5. Testing
6. Git Workflow
7. Boundaries
8. grspec Workflow (only if grspec detected)

**Rationale**: "Commands first" is the strongest signal from the 2,500-repo analysis. Architecture and Code Style follow because agents need structural context before behavioral rules. Boundaries last because they're reference material, not primary working context.

### Decision 6: New pointer-files.ts module

**Choice**: Create `src/core/agents-md/pointer-files.ts` containing `generateClaudeMd(projectName: string): string` and `generateGeminiMd(projectName: string): string`. These are pure template functions with no I/O.

Init integration SHALL call these conditionally based on `--tools` flag value, using the same exists/force/skip pattern as AGENTS.md generation.

**Rationale**: Separating pointer file templates from the main generator keeps the module focused. The generator deals with project detection; pointer files are static templates parameterized only by project name.

## Risks / Trade-offs

- **[Breaking output format]** → Existing users who re-run `grspec init --force` will get different AGENTS.md sections. Mitigation: AGENTS.md is documentation, not executable; section renaming is not a breaking API change. The `<!-- Generated by grspec -->` comment is preserved for identification.

- **[Tech stack detection false positives]** → A package like `react-icons` could be misidentified as "React project". Mitigation: use a curated `FRAMEWORK_PACKAGES` map with exact package name matches (e.g., `react` but not `react-icons`). Keep the map small and precise.

- **[CLAUDE.md `@` import may not always work]** → Claude Code's `@` syntax is a Claude-specific convention that may evolve. Mitigation: the pointer file also includes a plain-text fallback instruction ("Read AGENTS.md..."). If `@` stops working, the file still makes sense.

- **[Pointer file becomes stale]** → If AGENTS.md is updated but CLAUDE.md still references it, no issue — the pointer just says "read AGENTS.md". If CLAUDE.md is deleted, Claude Code falls back to AGENTS.md naturally. Low-risk.
