---
title: "Command Generation"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/command-generation/spec.md
  - src/core/command-generation/generator.ts
  - src/core/command-generation/registry.ts
  - src/core/command-generation/adapters/index.ts
related:
  - "[[template-system]]"
  - "[[ai-tool-paths]]"
  - "[[cli-init]]"
---

# Command Generation

The command generation module produces tool-specific command/skill files from a tool-agnostic content model. It's the execution layer of the [[template-system]].

## Architecture

- **`CommandContent`** — Tool-agnostic data (id, name, description, category, tags, body)
- **`ToolCommandAdapter`** — Per-tool formatting (file path, frontmatter format)
- **`generateCommand(content, adapter)`** — Combines content with adapter to produce `{ path, content }`
- **Registry** — Maps tool IDs to their adapter implementations

## Supported Adapters

The system includes adapters for 25+ AI tools:

Claude Code, Cursor, Windsurf, GitHub Copilot, Codex, Cline, Roo Code, Continue, Amazon Q, Gemini, Auggie, Bob, CodeBuddy, Costrict, Crush, GrCode, IFlow, Junie, KiloCode, Kiro, Lingma, OpenCode, Pi, Qoder, Qwen, and Antigravity.

Each adapter knows the tool's expected directory structure, frontmatter format, and naming conventions.

## File Path Patterns

| Tool | Path Pattern |
|------|-------------|
| Claude Code | `.claude/commands/grsx/<id>.md` |
| Cursor | `.cursor/commands/grsx-<id>.md` |
| Windsurf | `.windsurf/workflows/grsx-<id>.md` |
| GitHub Copilot | `.github/copilot/grsx-<id>.md` |
