---
type: design
change: expand-ui-subcmd-system
created: 2026-06-05
schema: spec-driven
---
## Context

The `grspec ui` module was ported from the Python-based `ui-ux-pro-max-skill` (v2.5.0) to TypeScript and integrated as a CLI subcommand with BM25-powered search, design-system generation, and workflow hooks (auto-detect UI content in changes, inject design-system context during apply). The existing implementation covers 4 subcommands (`search`, `design-system`, `domains`, `stacks`) backed by `src/core/ui/` (9 modules, 102 passing tests).

The expansion adds 6 new subcommands plus corresponding Skills and Command Templates, following the same patterns established by `grspec wiki` (which has `lint`, `status`, and agent-only commands like `init`, `ingest`, `query`, `sync`).

**Constraints:**
- Cross-platform (macOS, Linux, Windows) — use `path.join()` everywhere
- No new runtime dependencies — reuse internal BM25, csv-loader, fs utilities
- CLI-driven commands SHALL produce useful output without an LLM; agent-driven commands (review) MAY delegate to LLM for semantic analysis
- Existing command behavior MUST NOT change — all additions are additive

## Goals / Non-Goals

**Goals:**
- Expose 100+ UX rules as structured, searchable, filterable data via `grspec ui rules`
- Unlock the 1775-line `design.csv` dataset through `grspec ui reference`
- Provide static UX code analysis via `grspec ui review`
- Give project-level UI status visibility via `grspec ui status`
- Enable multi-platform skill export via `grspec ui install`
- Establish upstream data synchronization via `grspec ui sync`
- Restore complete Quick Reference content in `grspec-ui` Skill (with platform scope markers)

**Non-Goals:**
- Real-time browser rendering or visual regression testing (out of scope)
- LLM-powered design generation (existing `design-system` already uses BM25 heuristics, not LLM)
- Modifying the BM25 search algorithm or CSV data format (existing infra is sufficient)
- Bundling the grspec-ui module as a standalone npm package (it stays internal to @coodiepee/grspec)
- Supporting platform-specific IDE APIs (install generates static files, not IDE plugins)

## Decisions

### D1: Rules data format — CSV with flat schema

**Choice:** Store rules in `assets/ui/data/rules.csv` with columns: `Category,RuleID,Platform,Severity,Short,Do,Dont,Reference`

**Alternatives:**
- JSON array — more flexible but harder to diff/edit, breaks the consistent CSV pattern
- Embedded in TypeScript constants — couples data to code, makes upstream sync harder

**Rationale:** All existing UI data uses CSV (styles, colors, typography, etc.). The BM25 engine already handles CSV. Maintaining one format reduces cognitive overhead and enables the same `csv-loader.ts` for rules.

### D2: `reference` command parses design.csv as free-text blocks

**Choice:** `design.csv` is NOT a standard tabular CSV — it's a plaintext file with style names as headers and multi-paragraph design system specs as bodies (separated by blank lines). The `reference` module SHALL parse it as a document-per-style format, splitting on style name headers.

**Alternatives:**
- Convert `design.csv` to actual CSV format — destructive, loses rich formatting (code blocks, bullet lists)
- Load entire file every call — wasteful for single-style queries

**Rationale:** The file is already 1775 lines of structured prose. Parsing it into style blocks on-demand (with caching) preserves the rich content while enabling targeted access. A title index SHALL be built on first load for O(1) lookup by style name.

### D3: `review` — hybrid static + agent architecture

**Choice:** `grspec ui review` SHALL perform automated static checks (regex/AST-lite patterns) and output findings directly. Deep semantic analysis (design-system compliance, UX pattern correctness) SHOULD be delegated to the calling LLM agent via the `grspec-ui-review` Skill.

**Alternatives:**
- Full AST parsing with TypeScript compiler API — heavy dependency, complex setup
- Pure agent (no static checks) — loses value when run non-interactively or in CI

**Rationale:** Static checks (emoji detection, transition timing regex, cursor-pointer presence) can run instantly without an LLM and provide immediate value in CI or quick audits. Semantic checks require reading and understanding code context, which is the LLM agent's strength. The hybrid approach delivers value at both layers.

### D4: `install` — template-based generation with platform JSON configs

**Choice:** Each platform's output format SHALL be defined in `assets/ui/templates/<platform>.json` containing: output path pattern, frontmatter format, section flags, and content assembly rules. The installer reads the template and assembles the SKILL content from the canonical `getUiSkillTemplate()` instructions.

**Alternatives:**
- Hardcoded format per platform in TypeScript — inflexible, hard to add platforms
- Single universal Markdown output — platforms have different conventions (frontmatter, file location, naming)

**Rationale:** The original `ui-ux-pro-max-skill` already solved this with 18 platform JSON templates. Reusing this pattern (adapted for TypeScript loading) enables easy addition of new platforms without code changes.

### D5: `sync` — local path comparison, not network fetch

**Choice:** `grspec ui sync` SHALL operate by comparing a local upstream source path (defaulting to a sibling `ui-ux-pro-max-skill/` directory or configurable path) against the current `assets/ui/data/` contents. It SHALL NOT fetch from a remote URL.

**Alternatives:**
- GitHub API fetch — requires network access, authentication, adds dependency
- git submodule — adds complexity, not all users have the upstream repo

**Rationale:** The tool already runs locally. The sync target is a local checkout of the upstream repo. `UPSTREAM.md` tracks the version for manual reference. If remote sync is needed later, it can be added as `--remote` flag without changing the core architecture.

### D6: `status` — convention-based file discovery

**Choice:** `grspec ui status` SHALL discover UI state by checking:
1. `design-system/*/MASTER.md` relative to cwd (project-level)
2. Active change's `design-system/` directory (change-level, via `grspec list --json`)
3. `assets/ui/UPSTREAM.md` for data version
4. `detectUiContentInChange()` for active change UI detection

No configuration file needed — pure file-system convention.

**Alternatives:**
- Config in `.grspec.yaml` — adds schema complexity for minimal gain
- Cache file — stale data risk

**Rationale:** Convention over configuration. The design-system persistence already uses predictable paths. Status discovery should mirror what the workflow integration already does.

### D7: Skill architecture — single expanded Skill + one new Review Skill

**Choice:** Expand the existing `grspec-ui` Skill to document all CLI-driven subcommands (rules, reference, status, install, sync) in one file. Create a separate `grspec-ui-review` Skill for the agent-driven UX review workflow.

**Alternatives:**
- One Skill per subcommand (6 new SKILL.md files) — excessive fragmentation, dilutes discovery
- Everything in one Skill including review — review has a distinct multi-step agent workflow that benefits from dedicated instructions

**Rationale:** `grspec-wiki` uses one Skill for all operations. CLI-driven commands are simple enough to document inline. Review requires step-by-step agent orchestration (read code → run static checks → apply rules → cross-reference design-system → generate report) which merits its own Skill for clarity.

## Implementation Strategy

| Component | Strategy | Notes |
|-----------|----------|-------|
| `rules.ts` | TDD | Simple: CSV load + filter + BM25 search. Well-defined inputs/outputs. |
| `reference.ts` | TDD | Parse design.csv into style blocks, build index. |
| `review.ts` | AI+review | Regex patterns for static checks; needs careful false-positive tuning. |
| `status.ts` | TDD | Pure file-system detection, deterministic outputs. |
| `installer.ts` | TDD | Template assembly from JSON configs. |
| `sync.ts` | Manual | File comparison logic, user prompts for confirmation. |
| `rules.csv` | Manual | Extract from Quick Reference markdown into CSV (one-time data migration). |
| Platform templates | Manual | Adapt from original `ui-ux-pro-max-skill/cli/assets/templates/`. |
| Skill SKILL.md | AI+review | Restore Quick Reference + document new commands. |
| Command templates | Manual | Follow existing patterns from `workflows/ui.ts`. |

## Risks / Trade-offs

**[Risk: rules.csv data drift]** — Rules are manually maintained; upstream Quick Reference may evolve independently.
→ Mitigation: `UPSTREAM.md` tracks synced version. `grspec ui sync` SHALL compare `rules.csv` row count and warn if upstream has changed.

**[Risk: design.csv parsing fragility]** — The file uses informal structure (style name on one line, paragraphs below). Format changes could break the parser.
→ Mitigation: Parser SHALL use robust delimiter detection (style names match `styles.csv` "Style Category" column). Integration test validates all 67 styles parse correctly.

**[Risk: review false positives]** — Regex-based static checks may flag intentional patterns (e.g., emoji in user-generated content, 0ms transition for specific UX reasons).
→ Mitigation: Review output SHALL include rule IDs so developers can understand the check. Future: support `.grspec-ui-ignore` for suppression.

**[Risk: install template staleness]** — AI platform formats evolve (new file conventions, path changes).
→ Mitigation: Templates are JSON data, easily updatable without code changes. Include `lastVerified` date in each template.

**[Risk: cross-platform path handling in install/sync]** — Output paths for different platforms use different separators.
→ Mitigation: `installer.ts` SHALL normalize paths using `path.join()` for local writes and preserve platform-specific forward slashes only in documentation/template content (e.g., `.cursor/skills/...`).
