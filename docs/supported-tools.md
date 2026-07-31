# Supported Tools

grspec works with 30+ AI coding assistants. When you run `grspec init`, grspec configures selected tools with skills, commands, and rules.

## How It Works

For each selected tool, grspec installs:

1. **Skills** (if delivery includes skills): `.../skills/grspec-*/SKILL.md`
2. **Commands** (if delivery includes commands): tool-specific `grsx-*` command files
3. **Rules** (always installed): coding philosophy rules in each tool's native rules directory

By default, grspec uses the `core` profile, which includes:
- `propose`
- `explore`
- `apply`
- `sync`
- `archive`

You can enable expanded workflows (`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`) via `grspec config profile`, then run `grspec update`.

## Tool Directory Reference

| Tool (ID) | Skills | Commands | Rules |
|-----------|--------|----------|-------|
| GRCode (`grcode`) | `.grcode/skills/grspec-*/SKILL.md` | `.grcode/commands/grsx-<id>.md` | `.grcode/rules/grspec-<id>.md` |
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/grspec-*/SKILL.md` | `.amazonq/prompts/grsx-<id>.md` | `.amazonq/rules/grspec-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/grspec-*/SKILL.md` | `.agent/workflows/grsx-<id>.md` | `.agent/rules/grspec-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/grspec-*/SKILL.md` | `.augment/commands/grsx-<id>.md` | `.augment/rules/grspec-<id>.md` |
| IBM Bob Shell (`bob`) | `.bob/skills/grspec-*/SKILL.md` | `.bob/commands/grsx-<id>.md` | `.bob/rules/grspec-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/grspec-*/SKILL.md` | `.claude/commands/grsx/<id>.md` | `.claude/rules/grspec-<id>.md` |
| Cline (`cline`) | `.cline/skills/grspec-*/SKILL.md` | `.clinerules/workflows/grsx-<id>.md` | `.clinerules/grspec-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/grspec-*/SKILL.md` | `.codebuddy/commands/grsx/<id>.md` | `.codebuddy/rules/grspec-<id>.md` |
| Codex (`codex`) | `.codex/skills/grspec-*/SKILL.md` | `$CODEX_HOME/prompts/grsx-<id>.md`\* | `.codex/rules/grspec-<id>.md` |
| ForgeCode (`forgecode`) | `.forge/skills/grspec-*/SKILL.md` | — | `.forge/rules/grspec-<id>.md` |
| Continue (`continue`) | `.continue/skills/grspec-*/SKILL.md` | `.continue/prompts/grsx-<id>.prompt` | `.continue/rules/grspec-<id>.md` |
| CoStrict (`costrict`) | `.cospec/skills/grspec-*/SKILL.md` | `.cospec/grspec/commands/grsx-<id>.md` | `.cospec/rules/grspec-<id>.md` |
| Crush (`crush`) | `.crush/skills/grspec-*/SKILL.md` | `.crush/commands/grsx/<id>.md` | `.crush/rules/grspec-<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/grspec-*/SKILL.md` | `.cursor/commands/grsx-<id>.md` | `.cursor/rules/grspec-<id>.mdc` |
| Factory Droid (`factory`) | `.factory/skills/grspec-*/SKILL.md` | `.factory/commands/grsx-<id>.md` | `.factory/rules/grspec-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/grspec-*/SKILL.md` | `.gemini/commands/grsx/<id>.toml` | `.gemini/rules/grspec-<id>.md` |
| GitHub Copilot (`github-copilot`) | `.github/skills/grspec-*/SKILL.md` | `.github/prompts/grsx-<id>.prompt.md`\*\* | `.github/instructions/grspec-<id>.instructions.md` |
| iFlow (`iflow`) | `.iflow/skills/grspec-*/SKILL.md` | `.iflow/commands/grsx-<id>.md` | `.iflow/rules/grspec-<id>.md` |
| Junie (`junie`) | `.junie/skills/grspec-*/SKILL.md` | `.junie/commands/grsx-<id>.md` | `.junie/rules/grspec-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/grspec-*/SKILL.md` | `.kilocode/workflows/grsx-<id>.md` | `.kilocode/rules/grspec-<id>.md` |
| Kimi CLI (`kimi`) | `.kimi/skills/grspec-*/SKILL.md` | — | `.kimi/rules/grspec-<id>.md` |
| Kiro (`kiro`) | `.kiro/skills/grspec-*/SKILL.md` | `.kiro/prompts/grsx-<id>.prompt.md` | `.kiro/rules/grspec-<id>.md` |
| Lingma (`lingma`) | `.lingma/skills/grspec-*/SKILL.md` | `.lingma/commands/grsx/<id>.md` | `.lingma/rules/grspec-<id>.md` |
| OpenCode (`opencode`) | `.opencode/skills/grspec-*/SKILL.md` | `.opencode/commands/grsx-<id>.md` | `.opencode/rules/grspec-<id>.md` |
| Pi (`pi`) | `.pi/skills/grspec-*/SKILL.md` | `.pi/prompts/grsx-<id>.md` | `.pi/rules/grspec-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/grspec-*/SKILL.md` | `.qoder/commands/grsx/<id>.md` | `.qoder/rules/grspec-<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/grspec-*/SKILL.md` | `.qwen/commands/grsx-<id>.toml` | `.qwen/rules/grspec-<id>.md` |
| RooCode (`roocode`) | `.roo/skills/grspec-*/SKILL.md` | `.roo/commands/grsx-<id>.md` | `.roo/rules/grspec-<id>.md` |
| Trae (`trae`) | `.trae/skills/grspec-*/SKILL.md` | — | `.trae/rules/grspec-<id>.md` |
| Windsurf (`windsurf`) | `.windsurf/skills/grspec-*/SKILL.md` | `.windsurf/workflows/grsx-<id>.md` | `.windsurf/rules/grspec-<id>.md` |

\* Codex commands are installed in the global Codex home (`$CODEX_HOME/prompts/` if set, otherwise `~/.codex/prompts/`), not your project directory.

\*\* GitHub Copilot prompt files are recognized as custom slash commands in IDE extensions (VS Code, JetBrains, Visual Studio). Copilot CLI does not currently consume `.github/prompts/*.prompt.md` directly.

## Non-Interactive Setup

For CI/CD or scripted setup, use `--tools` (and optionally `--profile`):

```bash
# Configure specific tools
grspec init --tools claude,cursor

# Configure all supported tools
grspec init --tools all

# Skip tool configuration
grspec init --tools none

# Override profile for this init run
grspec init --profile core
```

**Available tool IDs (`--tools`):** `grcode`, `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `opencode`, `pi`, `qoder`, `lingma`, `qwen`, `roocode`, `trae`, `windsurf`

## Workflow-Dependent Installation

grspec installs workflow artifacts based on selected workflows:

- **Core profile (default):** `propose`, `explore`, `apply`, `sync`, `archive`
- **Custom selection:** any subset of all workflow IDs:
  `propose`, `explore`, `new`, `continue`, `apply`, `ff`, `sync`, `archive`, `bulk-archive`, `verify`, `onboard`

In other words, skill/command counts are profile-dependent and delivery-dependent, not fixed.

## Generated Skill Names

When selected by profile/workflow config, grspec generates these skills:

- `grspec-propose`
- `grspec-explore`
- `grspec-new-change`
- `grspec-continue-change`
- `grspec-apply-change`
- `grspec-ff-change`
- `grspec-sync-specs`
- `grspec-archive-change`
- `grspec-bulk-archive-change`
- `grspec-verify`
- `grspec-onboard`

See [Commands](commands.md) for command behavior and [CLI](cli.md) for `init`/`update` options.

## Related

- [CLI Reference](cli.md) — Terminal commands
- [Commands](commands.md) — Slash commands and skills
- [Getting Started](getting-started.md) — First-time setup
