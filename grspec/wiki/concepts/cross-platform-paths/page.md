---
title: "Cross-Platform Paths"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/constitution.md
  - grspec/grspec.yaml
related:
  - "[[grspec-conventions]]"
  - "[[ci-nix-validation]]"
---

# Cross-Platform Paths

grspec runs on macOS, Linux, and Windows. All path handling follows strict cross-platform rules to prevent platform-specific bugs.

## Core Rules

1. **Always use `path.join()` or `path.resolve()`** for constructing file paths — never hardcode slashes
2. **Never assume forward-slash separators** — Windows uses backslashes
3. **Tests must use `path.join()`** for expected path values, not hardcoded strings
4. **Consider case sensitivity differences** across file systems (macOS HFS+ is case-insensitive, Linux ext4 is case-sensitive)

## Enforcement

These rules are enforced at multiple levels:

- **Constitution** — Listed as an architecture principle
- **grspec.yaml rules** — Specs must include scenarios for Windows path handling; design docs must prefer Node.js path module
- **CI** — Windows CI verification is added as a task when changes involve file paths
- **Gate checks** — Artifact gate enforcement uses `path.join()` for all existence checks

## Impact on Specs

When writing specs that deal with file paths:

- Include explicit Windows path handling scenarios
- Requirements must specify cross-platform behavior
- The `path` module is always preferred over string manipulation
