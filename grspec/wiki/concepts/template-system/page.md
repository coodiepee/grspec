---
title: "Template System"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/command-generation/spec.md
  - src/core/command-generation/generator.ts
  - src/core/command-generation/adapters/index.ts
  - src/core/templates/skill-templates.ts
  - src/core/shared/skill-generation.ts
related:
  - "[[command-generation]]"
  - "[[profile-tiers]]"
  - "[[ai-tool-paths]]"
---

# Template System

The template system generates skill and command files for 25+ AI coding tools. It uses a tool-agnostic content model with per-tool adapters to produce correctly formatted files in each tool's expected directory.

## Architecture

```
CommandContent (tool-agnostic)
    │
    ├── ToolCommandAdapter (per-tool formatting)
    │   ├── Claude adapter → .claude/commands/grsx/<id>.md
    │   ├── Cursor adapter → .cursor/commands/grsx-<id>.md
    │   ├── Windsurf adapter → .windsurf/workflows/grsx-<id>.md
    │   ├── Codex adapter → codex commands
    │   └── ... 20+ more adapters
    │
    └── generateCommand(content, adapter) → { path, content }
```

## Content Model

The `CommandContent` interface defines tool-agnostic command data:

- `id` — Identifier (e.g., `explore`, `apply`)
- `name` — Human-readable name
- `description` — Brief purpose description
- `category` — Grouping (e.g., `Workflow`)
- `tags` — Classification tags
- `body` — The instruction content

## Adapter System

Each AI tool has an adapter that implements:

- `toolId` — Matches the tool's identifier in `AIToolOption`
- `getFilePath(commandId)` — Returns the tool-specific file path
- `formatFile(content)` — Produces complete file with frontmatter

Supported tools include Claude Code, Cursor, Windsurf, GitHub Copilot, Codex, Cline, Roo Code, Continue, Amazon Q, Gemini, and many more.

## Skill Templates

Workflow-specific skill templates live in `src/core/templates/workflows/`. Each template function generates the instruction body for a specific workflow (propose, apply, archive, etc.), which is then wrapped by the adapter for the target tool.
