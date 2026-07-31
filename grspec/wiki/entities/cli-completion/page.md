---
title: "CLI Shell Completions"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-completion/spec.md
  - src/core/completions/completion-provider.ts
  - src/core/completions/factory.ts
related:
  - "[[cli-init]]"
---

# CLI Shell Completions

Shell completion scripts enable tab-completion for grspec commands, flags, and dynamic values across multiple shells.

## Supported Shells

| Shell | Trigger | Implementation |
|-------|---------|---------------|
| **Zsh** | Single TAB | `_arguments`, `_describe`, `compadd` |
| **Bash** | Double TAB | `complete` builtin, `COMPREPLY` |
| **Fish** | Single TAB | `complete` command with conditions |
| **PowerShell** | TAB cycling | `Register-ArgumentCompleter` |

## Dynamic Completions

Beyond static command/flag completion, the system provides dynamic completions for:

- Change IDs (scanned from `grspec/changes/`)
- Spec IDs (scanned from `grspec/specs/`)
- Schema names (resolved from available schemas)

## Installation

```bash
grspec completion install [--shell zsh|bash|fish|powershell]
```

Each shell's completion script is generated and installed into the appropriate location, respecting native completion patterns (Oh My Zsh, bash-completion v1/v2, Fish caching, PowerShell Core 7+).
