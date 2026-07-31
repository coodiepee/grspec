---
type: proposal
change: ui-init
created: 2026-06-15
schema: spec-driven
---
## Why

Users must manually construct query strings for `grspec ui design-system` — they need to know product types, style keywords, and industry terms upfront. In agent environments, the tool should analyze the codebase and infer these attributes, presenting findings at varying confidence levels for user confirmation rather than requiring precise manual input.

## What Changes

- Add `grspec ui init` CLI subcommand that auto-detects stack and project name from `package.json`, accepts structured parameters (`--type`, `--style`, `--audience`), generates a design system with `--persist`, and optionally sets up a rules config
- Add `grspec-ui-init` Cursor skill that performs deep codebase analysis (CSS patterns, component structure, theme detection), classifies inferred attributes by confidence level (HIGH/MEDIUM/LOW), presents an adaptive confirmation dialog, and calls the CLI to execute
- Add `/grsx-ui-init` Cursor command as the routing entry point to the skill
- Detect existing `design-system/` directory and warn with update/reset/skip options instead of silently overwriting
- Integrate with change workflow context: when a change is active, offer to place design system artifacts in the change directory

## Capabilities

### New Capabilities
- `cli-ui-init`: CLI subcommand `grspec ui init` with auto-detection, structured parameters, idempotency guard, and optional rules config generation
- `ui-init-skill`: Agent skill that performs deep codebase analysis, confidence-graded attribute inference, adaptive user confirmation, and delegates to CLI for execution
- `ui-init-command`: Cursor command `/grsx-ui-init` routing to the skill

### Modified Capabilities

## Risk Assessment

- **Impact scope**: Adds a new subcommand to `src/commands/ui.ts` and new core module(s) under `src/core/ui/`. Does not modify existing subcommands or core logic.
- **Regression risk**: Low — new additive functionality. The `generateDesignSystem` function is called with assembled parameters, same as `design-system` subcommand. No changes to existing design-system generation, search, or review code paths.
- **Performance implications**: The CLI auto-detection reads `package.json` and optionally `tailwind.config.*` — negligible I/O. The skill's deeper analysis (scanning component files, CSS variables) runs only in agent context and is bounded by file count.
- **Cross-platform**: File detection must use `path.join()` for all config file lookups. `package.json` parsing is platform-neutral.

## Impact

- `src/commands/ui.ts` — register new `init` subcommand
- `src/core/ui/` — new `init.ts` module for auto-detection and init orchestration
- `.cursor/skills/grspec-ui-init/SKILL.md` — new skill file
- `.cursor/commands/grsx-ui-init.md` — new command file
- `.cursor/skills/grspec-ui/SKILL.md` — minor update to reference init in "How to Use" table
