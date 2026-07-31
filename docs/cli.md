# CLI Reference

The grspec CLI (`grspec`) provides terminal commands for project setup, validation, status inspection, and management. These commands complement the AI slash commands (like `/grsx:propose`) documented in [Commands](commands.md).

## Summary

| Category | Commands | Purpose |
|----------|----------|---------|
| **Setup** | `init`, `update` | Initialize and update grspec in your project |
| **Workspaces (beta)** | `workspace setup`, `workspace list`, `workspace ls`, `workspace link`, `workspace relink`, `workspace doctor` | Set up planning across linked repos or folders |
| **Browsing** | `list`, `view`, `show` | Explore changes and specs |
| **Validation** | `validate` | Check changes and specs for issues |
| **Lifecycle** | `archive` | Finalize completed changes |
| **Workflow** | `status`, `instructions`, `templates`, `schemas` | Artifact-driven workflow support |
| **Stack Planning** | `change graph`, `change next`, `change overlap`, `change split` | Dependency-aware sequencing and split scaffolding |
| **Git Activity** | `activity` | Query structured git activity from grspec commits |
| **Schemas** | `schema init`, `schema fork`, `schema validate`, `schema which` | Create and manage custom workflows |
| **Config** | `config` | View and modify settings |
| **Utility** | `feedback`, `completion` | Feedback and shell integration |

---

## Human vs Agent Commands

Most CLI commands are designed for **human use** in a terminal. Some commands also support **agent/script use** via JSON output.

### Human-Only Commands

These commands are interactive and designed for terminal use:

| Command | Purpose |
|---------|---------|
| `grspec init` | Initialize project (interactive prompts) |
| `grspec view` | Interactive dashboard |
| `grspec config edit` | Open config in editor |
| `grspec feedback` | Submit feedback via GitHub |
| `grspec completion install` | Install shell completions |

### Agent-Compatible Commands

These commands support `--json` output for programmatic use by AI agents and scripts:

| Command | Human Use | Agent Use |
|---------|-----------|-----------|
| `grspec list` | Browse changes/specs | `--json` for structured data |
| `grspec show <item>` | Read content | `--json` for parsing |
| `grspec validate` | Check for issues | `--all --json` for bulk validation |
| `grspec status` | See artifact progress | `--json` for structured status |
| `grspec instructions` | Get next steps | `--json` for agent instructions |
| `grspec templates` | Find template paths | `--json` for path resolution |
| `grspec schemas` | List available schemas | `--json` for schema discovery |
| `grspec workspace setup --no-interactive` | Create a workspace with explicit inputs | `--json` for structured setup output |
| `grspec workspace list` | Browse known workspaces | `--json` for typed workspace objects |
| `grspec workspace link` | Link a repo or folder | `--json` for structured link output |
| `grspec workspace relink` | Repair a linked path | `--json` for structured link output |
| `grspec workspace doctor` | Check one workspace | `--json` for structured status output |

---

## Global Options

These options work with all commands:

| Option | Description |
|--------|-------------|
| `--version`, `-V` | Show version number |
| `--no-color` | Disable color output |
| `--help`, `-h` | Display help for command |

---

## Setup Commands

### `grspec init`

Initialize grspec in your project. Creates the folder structure and configures AI tool integrations.

Default behavior uses global config defaults: profile `core`, delivery `both`, workflows `propose, explore, apply, sync, archive`.

```
grspec init [path] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Target directory (default: current directory) |

**Options:**

| Option | Description |
|--------|-------------|
| `--tools <list>` | Configure AI tools non-interactively. Use `all`, `none`, or comma-separated list |
| `--force` | Auto-cleanup legacy files without prompting |
| `--profile <profile>` | Override global profile for this init run (`core` or `custom`) |

`--profile custom` uses whatever workflows are currently selected in global config (`grspec config profile`).

**Supported tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `opencode`, `pi`, `qoder`, `lingma`, `qwen`, `roocode`, `trae`, `windsurf`

**Examples:**

```bash
# Interactive initialization
grspec init

# Initialize in a specific directory
grspec init ./my-project

# Non-interactive: configure for Claude and Cursor
grspec init --tools claude,cursor

# Configure for all supported tools
grspec init --tools all

# Override profile for this run
grspec init --profile core

# Skip prompts and auto-cleanup legacy files
grspec init --force
```

**What it creates:**

```
grspec/
├── specs/              # Your specifications (source of truth)
├── changes/            # Proposed changes
└── grspec.yaml         # Project configuration

.claude/skills/         # Claude Code skills (if claude selected)
.cursor/skills/         # Cursor skills (if cursor selected)
.cursor/commands/       # Cursor GRSX commands (if delivery includes commands)
... (other tool configs)
```

---

### `grspec update`

Update grspec instruction files after upgrading the CLI. Re-generates AI tool configuration files using your current global profile, selected workflows, and delivery mode.

```
grspec update [path] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Target directory (default: current directory) |

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Force update even when files are up to date |

**Example:**

```bash
# Update instruction files after npm upgrade
npm update grspec
grspec update
```

---

## Workspace Commands

Workspace commands are under active development and are not ready for use yet. Do not build external automation, integrations, or long-lived workflows on top of this command surface; command behavior, state files, and JSON output can change at any point.

Coordination workspaces are planning homes for work that spans multiple repos or folders. Workspace visibility is not change commitment: link the repos or folders grspec should know about, then create changes when you are ready to plan specific work.

### `grspec workspace setup`

Create a workspace in the standard grspec workspace location and link at least one existing repo or folder.

```bash
grspec workspace setup [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--name <name>` | Workspace name. Names must be kebab-case |
| `--link <path>` | Link an existing repo or folder and infer the link name from the folder name |
| `--link <name>=<path>` | Link an existing repo or folder with an explicit link name |
| `--no-interactive` | Disable prompts; requires `--name` and at least one `--link` |
| `--json` | Output JSON; requires `--no-interactive` |

**Examples:**

```bash
grspec workspace setup
grspec workspace setup --no-interactive --name platform --link /repos/api --link web=/repos/web
grspec workspace setup --no-interactive --json --name checkout --link /repos/platform/apps/checkout
```

Setup prints the workspace location, planning path, linked repos or folders, and a workspace check. It does not ask for a preferred agent or open the workspace.

### `grspec workspace list`

List known grspec workspaces from the local registry.

```bash
grspec workspace list [--json]
grspec workspace ls [--json]
```

The list shows each workspace location and linked repos or folders. Stale registry records are reported but not changed.

### `grspec workspace link`

Record an existing repo or folder for one workspace.

```bash
grspec workspace link [name] <path> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--workspace <name>` | Select a known workspace from the local registry |
| `--json` | Output JSON |
| `--no-interactive` | Disable workspace picker prompts |

**Examples:**

```bash
grspec workspace link /repos/api
grspec workspace link api-service /repos/api
grspec workspace link --workspace platform /repos/platform/apps/checkout
```

The path must already exist. Relative paths are resolved against the command's current directory before grspec stores the verified absolute path in machine-local workspace state. Linked paths can be full repos, packages, services, apps, or folders without repo-local `grspec/` state.

### `grspec workspace relink`

Repair or change the local path for an existing link.

```bash
grspec workspace relink <name> <path> [options]
```

The path must already exist. Relink updates only the machine-local path for the stable link name.

### `grspec workspace doctor`

Check what one workspace can resolve on the current machine.

```bash
grspec workspace doctor [options]
```

Doctor shows the workspace location, planning path, linked repos or folders, missing paths, repo-local specs paths when present, and suggested fixes. It reports issues only; it does not repair them automatically.

Commands that need one workspace use the current workspace when run from inside a workspace folder or subdirectory. From elsewhere, pass `--workspace <name>`, select from the picker in an interactive terminal, or rely on the only known workspace when exactly one exists. In `--json` or `--no-interactive` mode, ambiguous selection fails with a structured status error and suggests `--workspace <name>`.

JSON responses use typed objects plus `status` arrays. Primary data lives in `workspace`, `workspaces`, or `link`; warnings and errors live in `status`.

---

## Browsing Commands

### `grspec list`

List changes or specs in your project.

```
grspec list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--specs` | List specs instead of changes |
| `--changes` | List changes (default) |
| `--sort <order>` | Sort by `recent` (default) or `name` |
| `--json` | Output as JSON |

**Examples:**

```bash
# List all active changes
grspec list

# List all specs
grspec list --specs

# JSON output for scripts
grspec list --json
```

**Output (text):**

```
Active changes:
  add-dark-mode     UI theme switching support
  fix-login-bug     Session timeout handling
```

---

### `grspec view`

Display an interactive dashboard for exploring specs and changes.

```
grspec view
```

Opens a terminal-based interface for navigating your project's specifications and changes.

---

### `grspec show`

Display details of a change or spec.

```
grspec show [item-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `item-name` | No | Name of change or spec (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--type <type>` | Specify type: `change` or `spec` (auto-detected if unambiguous) |
| `--json` | Output as JSON |
| `--no-interactive` | Disable prompts |

**Change-specific options:**

| Option | Description |
|--------|-------------|
| `--deltas-only` | Show only delta specs (JSON mode) |

**Spec-specific options:**

| Option | Description |
|--------|-------------|
| `--requirements` | Show only requirements, exclude scenarios (JSON mode) |
| `--no-scenarios` | Exclude scenario content (JSON mode) |
| `-r, --requirement <id>` | Show specific requirement by 1-based index (JSON mode) |

**Examples:**

```bash
# Interactive selection
grspec show

# Show a specific change
grspec show add-dark-mode

# Show a specific spec
grspec show auth --type spec

# JSON output for parsing
grspec show add-dark-mode --json
```

---

## Validation Commands

### `grspec validate`

Validate changes and specs for structural issues.

```
grspec validate [item-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `item-name` | No | Specific item to validate (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--all` | Validate all changes and specs |
| `--changes` | Validate all changes |
| `--specs` | Validate all specs |
| `--type <type>` | Specify type when name is ambiguous: `change` or `spec` |
| `--strict` | Enable strict validation mode |
| `--json` | Output as JSON |
| `--concurrency <n>` | Max parallel validations (default: 6, or `GRSPEC_CONCURRENCY` env) |
| `--no-interactive` | Disable prompts |

**Examples:**

```bash
# Interactive validation
grspec validate

# Validate a specific change
grspec validate add-dark-mode

# Validate all changes
grspec validate --changes

# Validate everything with JSON output (for CI/scripts)
grspec validate --all --json

# Strict validation with increased parallelism
grspec validate --all --strict --concurrency 12
```

**Output (text):**

```
Validating add-dark-mode...
  ✓ proposal.md valid
  ✓ specs/ui/spec.md valid
  ⚠ design.md: missing "Technical Approach" section

1 warning found
```

**Output (JSON):**

```json
{
  "version": "1.0.0",
  "results": {
    "changes": [
      {
        "name": "add-dark-mode",
        "valid": true,
        "warnings": ["design.md: missing 'Technical Approach' section"]
      }
    ]
  },
  "summary": {
    "total": 1,
    "valid": 1,
    "invalid": 0
  }
}
```

---

## Lifecycle Commands

### `grspec archive`

Archive a completed change and merge delta specs into main specs.

```
grspec archive [change-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `change-name` | No | Change to archive (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `--skip-specs` | Skip spec updates (for infrastructure/tooling/doc-only changes) |
| `--no-validate` | Skip validation (requires confirmation) |

**Examples:**

```bash
# Interactive archive
grspec archive

# Archive specific change
grspec archive add-dark-mode

# Archive without prompts (CI/scripts)
grspec archive add-dark-mode --yes

# Archive a tooling change that doesn't affect specs
grspec archive update-ci-config --skip-specs
```

**What it does:**

1. Validates the change (unless `--no-validate`)
2. Prompts for confirmation (unless `--yes`)
3. Merges delta specs into `grspec/specs/`
4. Moves change folder to `grspec/changes/archive/YYYY-MM-DD-<name>/`

---

## Workflow Commands

These commands support the artifact-driven GRSX workflow. They're useful for both humans checking progress and agents determining next steps.

### `grspec status`

Display artifact completion status for a change.

```
grspec status [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--change <id>` | Change name (prompts if omitted) |
| `--schema <name>` | Schema override (auto-detected from change's config) |
| `--json` | Output as JSON |

**Examples:**

```bash
# Interactive status check
grspec status

# Status for specific change
grspec status --change add-dark-mode

# JSON for agent use
grspec status --change add-dark-mode --json
```

**Output (text):**

```
Change: add-dark-mode
Schema: spec-driven
Progress: 2/4 artifacts complete

[x] proposal
[ ] design
[x] specs
[-] tasks (blocked by: design)
```

**Output (JSON):**

```json
{
  "changeName": "add-dark-mode",
  "schemaName": "spec-driven",
  "isComplete": false,
  "applyRequires": ["tasks"],
  "artifacts": [
    {"id": "proposal", "outputPath": "proposal.md", "status": "done"},
    {"id": "design", "outputPath": "design.md", "status": "ready"},
    {"id": "specs", "outputPath": "specs/**/*.md", "status": "done"},
    {"id": "tasks", "outputPath": "tasks.md", "status": "blocked", "missingDeps": ["design"]}
  ]
}
```

---

### `grspec instructions`

Get enriched instructions for creating an artifact or applying tasks. Used by AI agents to understand what to create next.

```
grspec instructions [artifact] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `artifact` | No | Artifact ID: `proposal`, `specs`, `design`, `tasks`, or `apply` |

**Options:**

| Option | Description |
|--------|-------------|
| `--change <id>` | Change name (required in non-interactive mode) |
| `--schema <name>` | Schema override |
| `--json` | Output as JSON |

**Special case:** Use `apply` as the artifact to get task implementation instructions.

**Examples:**

```bash
# Get instructions for next artifact
grspec instructions --change add-dark-mode

# Get specific artifact instructions
grspec instructions design --change add-dark-mode

# Get apply/implementation instructions
grspec instructions apply --change add-dark-mode

# JSON for agent consumption
grspec instructions design --change add-dark-mode --json
```

**Output includes:**

- Template content for the artifact
- Project context from config
- Content from dependency artifacts
- Per-artifact rules from config

---

### `grspec templates`

Show resolved template paths for all artifacts in a schema.

```
grspec templates [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--schema <name>` | Schema to inspect (default: `spec-driven`) |
| `--json` | Output as JSON |

**Examples:**

```bash
# Show template paths for default schema
grspec templates

# Show templates for custom schema
grspec templates --schema my-workflow

# JSON for programmatic use
grspec templates --json
```

**Output (text):**

```
Schema: spec-driven

Templates:
  proposal  → ~/.grspec/schemas/spec-driven/templates/proposal.md
  specs     → ~/.grspec/schemas/spec-driven/templates/specs.md
  design    → ~/.grspec/schemas/spec-driven/templates/design.md
  tasks     → ~/.grspec/schemas/spec-driven/templates/tasks.md
```

---

### `grspec schemas`

List available workflow schemas with their descriptions and artifact flows.

```
grspec schemas [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

**Example:**

```bash
grspec schemas
```

**Output:**

```
Available schemas:

  spec-driven (package)
    The default spec-driven development workflow
    Flow: proposal → specs → design → tasks

  my-custom (project)
    Custom workflow for this project
    Flow: research → proposal → tasks
```

---

## Schema Commands

Commands for creating and managing custom workflow schemas.

### `grspec schema init`

Create a new project-local schema.

```
grspec schema init <name> [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Schema name (kebab-case) |

**Options:**

| Option | Description |
|--------|-------------|
| `--description <text>` | Schema description |
| `--artifacts <list>` | Comma-separated artifact IDs (default: `proposal,specs,design,tasks`) |
| `--default` | Set as project default schema |
| `--no-default` | Don't prompt to set as default |
| `--force` | Overwrite existing schema |
| `--json` | Output as JSON |

**Examples:**

```bash
# Interactive schema creation
grspec schema init research-first

# Non-interactive with specific artifacts
grspec schema init rapid \
  --description "Rapid iteration workflow" \
  --artifacts "proposal,tasks" \
  --default
```

**What it creates:**

```
grspec/schemas/<name>/
├── schema.yaml           # Schema definition
└── templates/
    ├── proposal.md       # Template for each artifact
    ├── specs.md
    ├── design.md
    └── tasks.md
```

---

### `grspec schema fork`

Copy an existing schema to your project for customization.

```
grspec schema fork <source> [name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `source` | Yes | Schema to copy |
| `name` | No | New schema name (default: `<source>-custom`) |

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Overwrite existing destination |
| `--json` | Output as JSON |

**Example:**

```bash
# Fork the built-in spec-driven schema
grspec schema fork spec-driven my-workflow
```

---

### `grspec schema validate`

Validate a schema's structure and templates.

```
grspec schema validate [name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | No | Schema to validate (validates all if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed validation steps |
| `--json` | Output as JSON |

**Example:**

```bash
# Validate a specific schema
grspec schema validate my-workflow

# Validate all schemas
grspec schema validate
```

---

### `grspec schema which`

Show where a schema resolves from (useful for debugging precedence).

```
grspec schema which [name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | No | Schema name |

**Options:**

| Option | Description |
|--------|-------------|
| `--all` | List all schemas with their sources |
| `--json` | Output as JSON |

**Example:**

```bash
# Check where a schema comes from
grspec schema which spec-driven
```

**Output:**

```
spec-driven resolves from: package
  Source: /usr/local/lib/node_modules/grspec/schemas/spec-driven
```

**Schema precedence:**

1. Project: `grspec/schemas/<name>/`
2. User: `~/.local/share/grspec/schemas/<name>/`
3. Package: Built-in schemas

---

## Configuration Commands

### `grspec config`

View and modify global grspec configuration.

```
grspec config <subcommand> [options]
```

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `path` | Show config file location |
| `list` | Show all current settings |
| `get <key>` | Get a specific value |
| `set <key> <value>` | Set a value |
| `unset <key>` | Remove a key |
| `reset` | Reset to defaults |
| `edit` | Open in `$EDITOR` |
| `profile [preset]` | Configure workflow profile interactively or via preset |

**Examples:**

```bash
# Show config file path
grspec config path

# List all settings
grspec config list

# Get a specific value
grspec config get telemetry.enabled

# Set a value
grspec config set telemetry.enabled false

# Set a string value explicitly
grspec config set user.name "My Name" --string

# Remove a custom setting
grspec config unset user.name

# Reset all configuration
grspec config reset --all --yes

# Edit config in your editor
grspec config edit

# Configure profile with action-based wizard
grspec config profile

# Fast preset: switch workflows to core (keeps delivery mode)
grspec config profile core
```

`grspec config profile` starts with a current-state summary, then lets you choose:
- Change delivery + workflows
- Change delivery only
- Change workflows only
- Keep current settings (exit)

If you keep current settings, no changes are written and no update prompt is shown.
If there are no config changes but the current project files are out of sync with your global profile/delivery, grspec will show a warning and suggest running `grspec update`.
Pressing `Ctrl+C` also cancels the flow cleanly (no stack trace) and exits with code `130`.
In the workflow checklist, `[x]` means the workflow is selected in global config. To apply those selections to project files, run `grspec update` (or choose `Apply changes to this project now?` when prompted inside a project).

**Interactive examples:**

```bash
# Delivery-only update
grspec config profile
# choose: Change delivery only
# choose delivery: Skills only

# Workflows-only update
grspec config profile
# choose: Change workflows only
# toggle workflows in the checklist, then confirm
```

---

## Utility Commands

### `grspec feedback`

Submit feedback about grspec. Creates a GitHub issue.

```
grspec feedback <message> [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `message` | Yes | Feedback message |

**Options:**

| Option | Description |
|--------|-------------|
| `--body <text>` | Detailed description |

**Requirements:** GitHub CLI (`gh`) must be installed and authenticated.

**Example:**

```bash
grspec feedback "Add support for custom artifact types" \
  --body "I'd like to define my own artifact types beyond the built-in ones."
```

---

### `grspec completion`

Manage shell completions for the grspec CLI.

```
grspec completion <subcommand> [shell]
```

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `generate [shell]` | Output completion script to stdout |
| `install [shell]` | Install completion for your shell |
| `uninstall [shell]` | Remove installed completions |

**Supported shells:** `bash`, `zsh`, `fish`, `powershell`

**Examples:**

```bash
# Install completions (auto-detects shell)
grspec completion install

# Install for specific shell
grspec completion install zsh

# Generate script for manual installation
grspec completion generate bash > ~/.bash_completion.d/grspec

# Uninstall
grspec completion uninstall
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (validation failure, missing files, etc.) |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GRSPEC_TELEMETRY` | Set to `0` to disable telemetry |
| `DO_NOT_TRACK` | Set to `1` to disable telemetry (standard DNT signal) |
| `GRSPEC_CONCURRENCY` | Default concurrency for bulk validation (default: 6) |
| `EDITOR` or `VISUAL` | Editor for `grspec config edit` |
| `NO_COLOR` | Disable color output when set |

---

## Related Documentation

- [Commands](commands.md) - AI slash commands (`/grsx:propose`, `/grsx:apply`, etc.)
- [Workflows](workflows.md) - Common patterns and when to use each command
- [Customization](customization.md) - Create custom schemas and templates
- [Getting Started](getting-started.md) - First-time setup guide
