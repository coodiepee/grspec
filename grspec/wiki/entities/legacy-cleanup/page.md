---
title: "Legacy Cleanup"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/legacy-cleanup/spec.md
  - src/core/legacy-cleanup.ts
related:
  - "[[cli-init]]"
  - "[[cli-update]]"
---

# Legacy Cleanup

The legacy cleanup module detects and removes artifacts from previous grspec init versions during `init` and `update` workflows.

## Detected Artifacts

### Legacy Config Files
Root-level tool config files with grspec markers: `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.kilocode_rules`, `.github/copilot-instructions.md`, `.amazonq/instructions.md`, `CODEBUDDY.md`, `IFLOW.md`, and equivalents for all legacy tools.

### Legacy Slash Command Directories
Old command directory structures: `.claude/commands/grspec/`, `.cursor/commands/grspec-*.md`, `.windsurf/workflows/grspec-*.md`, and equivalents for all legacy tools.

### Legacy Structure Files
`grspec/AGENTS.md`, `grspec/project.md` (detection only, not deleted).

## Behavior

During `init` or `update`, the system scans for legacy artifacts, displays what was found, and removes them with user confirmation. This ensures clean transitions between grspec versions without manual cleanup.
