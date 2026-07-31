---
title: "CLI Config Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-config/spec.md
  - src/commands/config.ts
related:
  - "[[global-config]]"
  - "[[profile-tiers]]"
---

# CLI Config Command

`grspec config` provides a user-friendly CLI interface for viewing and modifying global configuration settings without manually editing JSON files.

## Usage

```bash
grspec config list
grspec config get <key>
grspec config set <key> <value>
grspec config path
```

## Key Behaviors

- **List** — Shows all current global config values
- **Get** — Retrieves a specific config value by key
- **Set** — Updates a config value (validates before writing)
- **Path** — Shows the filesystem path to the global config file
- Wraps `~/.config/grspec/config.json` with a friendly interface
