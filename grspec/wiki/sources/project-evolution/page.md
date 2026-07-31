---
title: "Project Evolution"
type: source-summary
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/changes/archive/
related:
  - "[[spec-driven-workflow]]"
  - "[[grspec-conventions]]"
  - "[[recent-milestones]]"
---

# Project Evolution

grspec has evolved through 85 archived changes, growing from a basic TypeScript scaffold to a comprehensive specification management system supporting 25+ AI coding tools.

## Timeline

### Foundation Phase (2025-01 to 2025-08)
- **2025-01** — Initial update and list commands
- **2025-08-05** — TypeScript project initialization
- **2025-08-06** — Init command, future-state storage model
- **2025-08-11** — Complexity guidelines for spec authoring
- **2025-08-13** — Archive and diff commands
- **2025-08-19** — Major expansion: change commands, spec commands, delta-based changes, verb-noun CLI structure, Zod validation, structured spec format, interactive show command, bulk validation

### Multi-Tool Expansion (2025-09 to 2025-10)
- **2025-09** — Slash command support, multi-agent init, AGENTS.md config, markdown parser CRLF handling
- **2025-10** — Windsurf, Cline, Crush, Codex support; factory slash commands; non-interactive init options

### Architecture Maturation (2025-12 to 2026-01)
- **2025-12** — Artifact graph core, instruction loader, change manager, global config, config command, shell completions, Antigravity support, schema directory restructure
- **2026-01** — Schema management CLI, per-change schema metadata, apply instructions schema-awareness, PostHog analytics, Nix CI validation

### Refinement Phase (2026-02 to 2026-05)
- **2026-02** — Project config, project-local schemas, multi-provider skill generation, feedback command, verify skill, onboard skill, init merge with experimental workflow
- **2026-04** — Kimi CLI support
- **2026-05** — Workspace foundation, vibe coding framework, simplified skill installation, graceful status handling

## Patterns

- **Adapter-based extensibility** — Each new AI tool is added via a command generation adapter, not core changes
- **Incremental capability growth** — New CLI commands follow the established verb-noun pattern
- **Spec-first development** — The project dogfoods its own workflow for all changes
