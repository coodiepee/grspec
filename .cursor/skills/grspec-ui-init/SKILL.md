---
name: grspec-ui-init
description: Smart UI initialization — analyzes your codebase, infers design system parameters, and generates a persisted design system with adaptive user confirmation. Use when setting up a project's design system for the first time.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

Smart UI initialization that analyzes your codebase and generates a design system with minimal manual input.

**Use this skill when** setting up a project's design system for the first time, or when the user doesn't know what parameters to provide for design system generation.

---

## How It Works

Instead of requiring the user to compose a query string like `grspec ui design-system "SaaS dashboard analytics"`, this skill:

1. **Analyzes** the codebase to detect stack, project name, and existing UI patterns
2. **Infers** product type and style preferences from README, docs, and CSS
3. **Presents** findings grouped by confidence for user confirmation
4. **Executes** `grspec ui init` with the confirmed parameters

---

## Workflow

### Step 1: Check for Existing Design System

```bash
grspec ui status --json
```

If a design system already exists:
- Show the current style and path
- Ask the user: **update**, **reset** (with `--force`), or **skip**
- If skip, end the workflow

### Step 2: Detect Project Attributes

Analyze the codebase to infer design system parameters. Classify each finding by confidence:

**HIGH confidence (auto-fill, no question needed):**

| Signal | Source | What it tells us |
|--------|--------|-----------------|
| Project name | `package.json` → `name` | `-p` parameter |
| Stack | `package.json` → `dependencies`/`devDependencies` | `--style` stack context |
| TypeScript | `tsconfig.json` exists | Stack qualifier |
| Tailwind | `tailwindcss` in dependencies | Style framework |

**MEDIUM confidence (auto-fill with source citation, present for confirmation):**

| Signal | Source | What it tells us |
|--------|--------|-----------------|
| Product type | README.md keywords, package description | `--type` parameter |
| Style preference | Existing CSS variables, tailwind.config theme | `--style` keywords |
| Dark mode | `prefers-color-scheme` in CSS, dark theme tokens | Style qualifier |
| Platform | `react-native`/`flutter` in deps vs web frameworks | `--platform` for rules |

**LOW confidence (must ask the user):**

| Signal | Fallback |
|--------|----------|
| Target audience | Ask explicitly |
| Industry vertical | Ask if README is sparse |
| Design philosophy | Ask if no existing UI code |

### Step 3: Present Findings for Confirmation

Display the analysis grouped by confidence tier:

```
┌────────────────────────────────────────────────┐
│ Project Analysis                               │
├────────────────────────────────────────────────┤
│                                                │
│ Confirmed:                                     │
│  ✓ Stack:    Next.js + Tailwind (package.json) │
│  ✓ Project:  my-app (package.json)             │
│  ✓ Platform: Web                               │
│                                                │
│ Inferred (please confirm):                     │
│  ? Type:     SaaS Dashboard (README)           │
│  ? Style:    Minimalism + Clean (CSS vars)     │
│                                                │
│ Needed from you:                               │
│  ✗ Audience: ___                               │
│                                                │
│ Adjust any item, or confirm to proceed         │
└────────────────────────────────────────────────┘
```

Use the **AskQuestion tool** for LOW confidence items. For MEDIUM items, present them in the summary and let the user adjust if needed.

### Step 4: Check Change Context

```bash
grspec list --json
```

If an active change exists that involves UI work:

```bash
grspec ui detect --change "<name>" --json
```

If UI content is detected:
- Ask: "Persist page overrides in the change directory or initialize project foundation?"
- Change pages: `grspec ui design-system "<query>" --persist --page <name> --output grspec/changes/<name>`
- Project foundation: `grspec ui init --type ...` (writes `grspec/ui/MASTER.md`)

### Step 5: Execute

Assemble and run the CLI command:

```bash
grspec ui init --type "<type>" --style "<style>" -p "<name>" --with-rules --platform <platform> [--output <dir>]
```

If the user requested page overrides, add `--page <name>`.

### Step 6: Completion Guidance

After successful init, display:

```
✓ Design system initialized

Files created:
  grspec/ui/MASTER.md
  grspec/ui/RULES-CHECKLIST.md
  [grspec/ui/pages/<page>.md]

Next steps:
  /grsx-ui-search          — Query the design knowledge base
  /grsx-ui-review          — Audit UI code quality
  /grsx-ui-design-system   — Generate a design system for a specific query
```

---

## Detection Strategies

### Stack Detection (HIGH confidence)

Read `package.json` and match `dependencies` + `devDependencies` against known stacks:

| Package | Stack |
|---------|-------|
| `react` | react |
| `next` | nextjs |
| `vue` | vue |
| `nuxt` | nuxtjs |
| `svelte` | svelte |
| `astro` | astro |
| `@angular/core` | angular |
| `react-native` | react-native |
| `three` | threejs |

When multiple are present, prefer the more specific framework (e.g., `nextjs` over `react`).

### Product Type Detection (MEDIUM confidence)

Scan these files for keyword frequency:
- `README.md`
- `package.json` → `description`
- `docs/*.md` (first 2-3 files)

Match against known product types in the design system dataset: SaaS, ecommerce, healthcare, fintech, devtool, portfolio, social, entertainment, education, etc.

### Style Detection (MEDIUM confidence)

Look for existing design signals:
- `tailwind.config.*` → theme colors, font family → style inference
- CSS files with `--color-*` variables → existing token system
- `prefers-color-scheme` media queries → dark mode support
- Component file naming patterns → design maturity

---

## Guardrails

- **Never skip user confirmation for MEDIUM/LOW confidence items** — the point is agent-assisted, not agent-decided
- **Always show the assembled CLI command** before executing — transparency builds trust
- **Don't modify existing files** without explicit user approval
- **If unsure about product type**, default to asking rather than guessing wrong — a bad guess produces bad design system recommendations
