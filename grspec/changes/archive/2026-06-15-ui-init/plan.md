---
type: plan
change: ui-init
created: 2026-06-15
schema: spec-driven
---
## 1. Core Init Module

- [x] 1.1 Create `src/core/ui/init.ts` with `detectProjectStack()` — reads `package.json`, extracts project name and matches dependencies against `AVAILABLE_STACKS` [TDD]
- [x] 1.2 Add `assembleInitQuery()` — builds a query string from structured options (type, style, stack) [TDD]
- [x] 1.3 Add `checkExistingDesignSystem()` — wraps `detectDesignSystem()` with richer output for CLI warning [TDD]
- [x] 1.4 Add `generateRulesChecklist()` — loads rules filtered by platform and writes a markdown checklist file [TDD]

## 2. CLI Subcommand

- [x] 2.1 Register `init` subcommand in `src/commands/ui.ts` with all options (--type, --style, -p, --page, --with-rules, --platform, --output, --force, --json) [AI+review]
- [x] 2.2 Wire init subcommand action: auto-detect → idempotency guard → assemble query → generate → persist → optional rules checklist [TDD]
- [x] 2.3 Export new types and functions from `src/core/ui/index.ts` [AI+review]

## 3. Skill and Command

- [x] 3.1 Create `.cursor/skills/grspec-ui-init/SKILL.md` with codebase analysis flow, confidence classification, adaptive confirmation, change context detection, and CLI delegation [manual]
- [x] 3.2 Create `.cursor/commands/grsx-ui-init.md` routing to the skill [manual]
- [x] 3.3 Update `.cursor/skills/grspec-ui/SKILL.md` "How to Use" table to reference init for new projects [manual]

## 4. Integration Tests

- [x] 4.1 Add integration tests for `grspec ui init` subcommand — happy path, idempotency guard, force override, page overrides, JSON output [TDD]
