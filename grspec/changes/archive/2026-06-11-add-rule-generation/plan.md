---
type: plan
change: add-rule-generation
created: 2026-06-11
schema: spec-driven
---
## 1. Core Types and Interfaces

- [x] 1.1 Create `src/core/rule-generation/types.ts` with `RuleContent`, `ToolRuleAdapter`, and `GeneratedRule` interfaces [AI+review]

## 2. Generator and Registry

- [x] 2.1 Create `src/core/rule-generation/generator.ts` with `generateRule` and `generateRules` functions [TDD]
- [x] 2.2 Create `src/core/rule-generation/registry.ts` with `RuleAdapterRegistry` class [TDD]

## 3. Tier 1 Adapters (tools with documented rules conventions)

- [x] 3.1 Create Cursor adapter (`adapters/cursor.ts`): `.cursor/rules/grspec-<id>.mdc`, frontmatter with `description` + `alwaysApply: true` [TDD]
- [x] 3.2 Create Claude Code adapter (`adapters/claude.ts`): `.claude/rules/grspec-<id>.md`, no frontmatter [TDD]
- [x] 3.3 Create Windsurf adapter (`adapters/windsurf.ts`): `.windsurf/rules/grspec-<id>.md`, frontmatter with `trigger: always_on` + `description` [TDD]
- [x] 3.4 Create Cline adapter (`adapters/cline.ts`): `.clinerules/grspec-<id>.md`, frontmatter with `alwaysApply: true` + `description` [TDD]
- [x] 3.5 Create RooCode adapter (`adapters/roocode.ts`): `.roo/rules/grspec-<id>.md`, no frontmatter [TDD]
- [x] 3.6 Create GitHub Copilot adapter (`adapters/github-copilot.ts`): `.github/instructions/grspec-<id>.instructions.md`, frontmatter with `applyTo: "**"` + `description` [TDD]
- [x] 3.7 Create Kilo Code adapter (`adapters/kilocode.ts`): `.kilocode/rules/grspec-<id>.md`, frontmatter with `alwaysApply: true` + `description` [TDD]

## 4. Generic Adapter and Registration

- [x] 4.1 Create generic adapter factory (`adapters/generic.ts`): `createGenericRuleAdapter(toolId, skillsDir)` → `<skillsDir>/rules/grspec-<id>.md`, no frontmatter [TDD]
- [x] 4.2 Create adapter barrel export (`adapters/index.ts`) [AI+review]
- [x] 4.3 Register all Tier 1 adapters and Tier 2 generic adapters in `RuleAdapterRegistry` static initializer [AI+review]

## 5. Rule Templates

- [x] 5.1 Create `src/core/rule-generation/rule-templates.ts` with `getRuleTemplates()` returning the `code-philosophy` rule content [AI+review]

## 6. Module Export

- [x] 6.1 Create `src/core/rule-generation/index.ts` barrel export [AI+review]

## 7. Init Integration

- [x] 7.1 Integrate rule generation into `init.ts` `generateSkillsAndCommands` method: generate rules after commands, add `rulesGenerated` and `rulesSkipped` to result type [AI+review]
- [x] 7.2 Update `displaySuccessMessage` to include rule counts [AI+review]

## 8. Update Integration

- [x] 8.1 Integrate rule generation into `update.ts` so rules are regenerated alongside skills/commands [AI+review]

## 9. Shared Infrastructure

- [x] 9.1 Add `RULE_IDS` constant to `src/core/shared/tool-detection.ts` for tracking generated rules [AI+review]
- [x] 9.2 Export new rule-generation types and functions from `src/core/shared/index.ts` [AI+review]

## 10. Tests

- [x] 10.1 Add unit tests for all Tier 1 adapters (file path and format verification) [TDD]
- [x] 10.2 Add unit tests for generic adapter factory [TDD]
- [x] 10.3 Add unit tests for `RuleAdapterRegistry` [TDD]
- [x] 10.4 Add unit tests for `generateRule` and `generateRules` [TDD]
- [x] 10.5 Add unit test for `getRuleTemplates()` [TDD]
