---
type: plan
change: ui-subcommand-skills
created: 2026-06-30
schema: spec-driven
---
## 1. Content templates (single source)

- [x] 1.1 Add `content/ui-search.md`, `ui-design-system.md`, `ui-rules.md`, `ui-reference.md`, `ui-review.md` [AI+review]
- [x] 1.2 Add `content/ui-status.md`, `ui-detect.md`, `ui-install.md`, `ui-sync.md` [AI+review]
- [x] 1.3 Slim `content/ui.md` to hub index; update `ui-init.md` cross-refs to granular slashes [AI+review]

## 2. Template registration

- [x] 2.1 Add subcommand skill/command factories in `workflows/ui-subcommands.ts` (content → skill + slash, same body) [TDD]
- [x] 2.2 Register all UI skills/commands in `skill-generation.ts` and `skill-templates.ts` [TDD]
- [x] 2.3 Update hub `getGrsxUiCommandTemplate` to route to sub-skills [AI+review]

## 3. Tests & deploy

- [x] 3.1 Add `test/core/templates/ui-templates-parity.test.ts` — skill body === command body per subcommand [TDD]
- [x] 3.2 Update `test/core/ui/skill-template.test.ts` counts and hub assertions [TDD]
- [x] 3.3 Sync `.cursor/skills/` and `.cursor/commands/` for new UI subcommands [manual]
- [x] 3.4 Run `pnpm run lint && pnpm run test && pnpm run build` [manual]
