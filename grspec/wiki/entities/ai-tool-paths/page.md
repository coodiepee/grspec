---
title: "AI Tool Paths"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/ai-tool-paths/spec.md
  - src/core/shared/tool-detection.ts
  - src/core/available-tools.ts
related:
  - "[[command-generation]]"
  - "[[template-system]]"
  - "[[cli-init]]"
---

# AI Tool Paths

AI tool path metadata defines where grspec skills and commands are installed for each supported AI coding tool. This metadata drives the [[command-generation]] adapter system.

## Supported Tools (25+)

Each tool has a defined path pattern for skills and commands:

| Tool | Skill/Rule Location | Command Location |
|------|-------------------|-----------------|
| Claude Code | `CLAUDE.md` | `.claude/commands/grsx/` |
| Cursor | `.cursor/rules/`, `.cursor/skills/` | `.cursor/commands/` |
| Windsurf | `.windsurfrules` | `.windsurf/workflows/` |
| GitHub Copilot | `.github/copilot-instructions.md` | `.github/copilot/` |
| Codex | `AGENTS.md` | global commands |

## Tool Detection

The `src/core/shared/tool-detection.ts` module detects which AI tools are configured in a project by checking for their characteristic files and directories. This enables the "already configured" indicator during `grspec init`.

## Tool Registry

The `src/core/available-tools.ts` module maintains the canonical list of supported tools with their metadata (display name, value, description, path patterns).
