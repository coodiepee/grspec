# grspec

**Spec-driven vibe coding framework for AI-assisted development.**

[npm](https://www.npmjs.com/package/@coodiepee/grspec) · [Discord](https://discord.gg/YctCnvvshC) · [@0xTab](https://x.com/0xTab)

grspec adds a lightweight specification layer between you and your AI coding assistant. You agree on *what* to build before any code gets written — then the AI implements it with full context.

## Features

### Spec-Driven Workflow

Propose a change, generate specs and a design, then implement task by task. Every change lives in its own folder with structured artifacts.

```text
/grsx:propose "add dark mode"
  → proposal.md    — why we're doing this
  → specs/         — requirements and scenarios
  → design.md      — technical approach
  → plan.md        — implementation checklist

/grsx:apply        — implement tasks one by one
/grsx:archive      — archive and sync specs
```

### Skills, Commands, and Rules

`grspec init` configures your AI tools with three types of artifacts:

| Artifact | Purpose | Controlled by |
|----------|---------|---------------|
| **Skills** | Workflow instructions (propose, apply, archive, ...) | Profile & delivery settings |
| **Commands** | Slash commands in tool-native format | Profile & delivery settings |
| **Rules** | Coding philosophy applied to all generations | Always installed |

Rules are always-on guidelines that shape how AI writes code — naming conventions, abstraction discipline, comment policy, and more. They install into each tool's native rules directory with correct frontmatter.

### 30+ Tool Support

Works with Cursor, Claude Code, Windsurf, GitHub Copilot, Cline, RooCode, Kilo Code, Gemini CLI, Codex, Kiro, and [20+ more](docs/supported-tools.md).

### Wiki Knowledge Base

An optional LLM-native knowledge base (`grspec/wiki/`) that AI assistants navigate via `[[wikilinks]]` for grounded context. Initialize with `/grsx:wiki init`.

### UI/UX Design Intelligence

Built-in UI/UX knowledge base with 67 styles, 161 color palettes, 57 font pairings, 205 UX rules, and 25 chart types across 16 tech stacks. Search design systems, generate recommendations, and run UX quality audits — all from the CLI or via AI skills.

```bash
grspec ui search "dark mode toggle"
grspec ui design-system "saas dashboard"
grspec ui review src/components/
```

### Interactive Dashboard

`grspec view` opens a terminal dashboard showing all specs and active changes at a glance.

### Customization

Custom schemas let you define your own artifacts, templates, and workflows. Community schemas extend grspec with opinionated integrations.

## Usage

**Prerequisites:** Node.js 20.19.0+

### Install

```bash
npm install -g @coodiepee/grspec@latest
```

Also works with pnpm, yarn, bun, and nix. See [installation options](docs/installation.md).

### Initialize

```bash
cd your-project
grspec init
```

Select your AI tools, and grspec generates skills, commands, and rules for each one.

### Work

Tell your AI assistant:

```text
/grsx:propose add user authentication
```

The AI creates a change folder with proposal, specs, design, and tasks. Then:

```text
/grsx:apply       # implement tasks
/grsx:archive     # archive when done
```

### Update

After upgrading grspec, regenerate artifacts for your tools:

```bash
npm install -g @coodiepee/grspec@latest
grspec update
```

### CLI Reference

| Command | Purpose |
|---------|---------|
| `grspec init` | Initialize project with specs structure and tool config |
| `grspec update` | Regenerate skills, commands, and rules |
| `grspec config` | Manage profile, delivery, language settings |
| `grspec list` | Show active changes and their status |
| `grspec view` | Interactive terminal dashboard of specs and changes |
| `grspec ui` | UI/UX design intelligence — styles, colors, fonts, rules, audits |
| `grspec validate` | Validate specs and changes |
| `grspec change overlap` | File-level overlap across active changes |

Full reference: [CLI](docs/cli.md) · [Commands](docs/commands.md) · [Workflows](docs/workflows.md) · [Cheatsheet](docs/cheatsheet.md)

### Non-Interactive Setup

```bash
grspec init --tools claude,cursor
grspec init --tools all
grspec init --tools all --profile standard
```

## Documentation

- [Getting Started](docs/getting-started.md) — first steps after init
- [Workflows](docs/workflows.md) — common patterns and combos
- [Commands](docs/commands.md) — slash commands and skills
- [CLI](docs/cli.md) — terminal reference
- [Cheatsheet](docs/cheatsheet.md) — quick operator reference
- [GRSX Workflow](docs/grsx.md) — schema-driven artifact workflow deep dive
- [Wiki](docs/wiki.md) — LLM-native knowledge base
- [Supported Tools](docs/supported-tools.md) — 30+ tool integrations
- [Concepts](docs/concepts.md) — philosophy and architecture
- [Customization](docs/customization.md) — schemas, templates, community extensions
- [Multi-Language](docs/multi-language.md) — generate artifacts in other languages

## Acknowledgments

grspec stands on open work from several projects. Thank you to the authors and contributors:

- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** ([Fission AI](https://github.com/Fission-AI)) — the spec-driven workflow between humans and AI coding assistants. grspec continues that foundation with its own product identity, GRSX workflow, and multi-tool delivery.
- **[Superpowers](https://github.com/obra/superpowers)** ([obra](https://github.com/obra)) — disciplined agent skills and process patterns (brainstorming, planning, TDD, review, verification) that shaped grspec's execution workflows.
- **[LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** ([Andrej Karpathy](https://github.com/karpathy)) — the persistent, LLM-maintained wiki pattern that inspired `grspec/wiki/` as a compounding knowledge layer.
- **[UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** ([nextlevelbuilder](https://github.com/nextlevelbuilder)) — the UI/UX design intelligence datasets, rules, and search patterns behind `grspec ui`.

## Contributing

**Small fixes** — submit directly as PRs.

**Larger changes** — submit a grspec change proposal first (`/grsx:propose`) so we can align on intent before implementation.

AI-generated code is welcome as long as it's tested and verified. Mention the agent and model used.

### Development

```bash
pnpm install
pnpm run build
pnpm test
```

## Telemetry

grspec collects anonymous usage stats (command names and version only). No arguments, paths, content, or PII. Automatically disabled in CI.

Opt-out: `export GRSPEC_TELEMETRY=0` or `export DO_NOT_TRACK=1`

## License

MIT
