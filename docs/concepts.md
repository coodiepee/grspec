# Concepts

This guide explains the core ideas behind grspec and how they fit together. For practical usage, see [Getting Started](getting-started.md) and [Workflows](workflows.md).

## Philosophy

grspec is built around four principles:

```
fluid not rigid         — no phase gates, work on what makes sense
iterative not waterfall — learn as you build, refine as you go
easy not complex        — lightweight setup, minimal ceremony
brownfield-first        — works with existing codebases, not just greenfield
```

### Why These Principles Matter

**Fluid not rigid.** Traditional spec systems lock you into phases: first you plan, then you implement, then you're done. grspec is more flexible — you can create artifacts in any order that makes sense for your work.

**Iterative not waterfall.** Requirements change. Understanding deepens. What seemed like a good approach at the start might not hold up after you see the codebase. grspec embraces this reality.

**Easy not complex.** Some spec frameworks require extensive setup, rigid formats, or heavyweight processes. grspec stays out of your way. Initialize in seconds, start working immediately, customize only if you need to.

**Brownfield-first.** Most software work isn't building from scratch — it's modifying existing systems. grspec's delta-based approach makes it easy to specify changes to existing behavior, not just describe new systems.

## The Big Picture

grspec organizes your work into two main areas:

```
┌────────────────────────────────────────────────────────────────────┐
│                        grspec/                                   │
│                                                                    │
│   ┌─────────────────────┐      ┌───────────────────────────────┐   │
│   │       specs/        │      │         changes/              │   │
│   │                     │      │                               │   │
│   │  Source of truth    │◄─────│  Proposed modifications       │   │
│   │  How your system    │ merge│  Each change = one folder     │   │
│   │  currently works    │      │  Contains artifacts + deltas  │   │
│   │                     │      │                               │   │
│   └─────────────────────┘      └───────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Specs** are the source of truth — they describe how your system currently behaves.

**Changes** are proposed modifications — they live in separate folders until you're ready to merge them.

This separation is key. You can work on multiple changes in parallel without conflicts. You can review a change before it affects the main specs. And when you archive a change, its deltas merge cleanly into the source of truth.

## Wiki Knowledge Layer

The wiki (`grspec/wiki/`) is an optional navigable knowledge base for AI assistants. Inspired by Andrej Karpathy's knowledge management philosophy, it provides structured memory that compounds over time.

```
grspec/wiki/
  index.md         ← Content catalog (entry point for navigation)
  log.md           ← Chronological operation record
  overview.md      ← Project summary
  concepts/        ← Architectural concepts, design patterns
  entities/        ← One per spec capability (mirrors specs/)
  sources/         ← Key source files, change summaries
  comparisons/     ← Trade-off decisions, alternatives analysis
```

**Key principles:**
- **Navigate, don't dump** — LLMs read `index.md` first, then follow `[[wikilinks]]` to relevant pages. The entire wiki is never loaded at once.
- **Whole-page replacement** — Wiki deltas in changes use complete page replacement, not section-level merging.
- **Page locking** — Prevents concurrent modifications using `blocked_by` frontmatter.
- **Build-time verification** — A "writer" LLM generates pages, a "verifier" LLM checks consistency.

Wiki pages use YAML frontmatter with fields: `title`, `type`, `created`, `updated`, `confidence`, optional `sources` and `related` arrays with `[[wikilinks]]`.

Enable wiki in `grspec.yaml`:
```yaml
wiki:
  enabled: true
```

Manage via `grspec wiki lint`, `grspec wiki status`, or the `/grsx-wiki-*` commands. See the [Wiki guide](wiki.md) for full usage details.

## Coordination Workspaces

Workspace support is under active development and is not ready for use yet. Do not build external automation, integrations, or long-lived workflows on top of workspace behavior; the commands, state files, and JSON output can change at any point.

The commands below provide the first setup flow for planning across linked repos or folders.

Repo-local grspec projects are the right default when one repo owns the planning, implementation, and archive flow. Some work spans several repos or folders. For that case, a grspec coordination workspace is the durable planning home.

The workspace mental model is:

```text
workspace = where related cross-repo changes live
link      = a stable name for a repo or folder the workspace can plan against
change    = one feature, fix, project, or other planned piece of work
```

A workspace has a different shape from a repo-local project:

```text
workspace-folder/
├── changes/                       # Workspace-level planning
└── .grspec-workspace/
    ├── workspace.yaml             # Shared workspace identity and link names
    └── local.yaml                 # This machine's local paths
```

Repo-local grspec state keeps the existing shape:

```text
repo-root/
└── grspec/
    ├── specs/
    └── changes/
```

That distinction matters. The workspace folder is a coordination surface for planning across linked repos or folders. Each repo's `grspec/` directory remains the home for repo-owned specs, repo-local changes, and implementation planning. Users do not need to run repo-local `grspec init` inside a workspace folder.

Stable link names are how workspace planning refers to repos and folders. The shared workspace state keeps names such as `api`, `web`, or `checkout`; each machine maps those names to its own local paths in `.grspec-workspace/local.yaml`.

```yaml
# .grspec-workspace/workspace.yaml
version: 1
name: platform
links:
  api: {}
  web: {}
```

```yaml
# .grspec-workspace/local.yaml
version: 1
paths:
  api: /repos/api
  web: /repos/web
```

grspec-created workspaces exclude `.grspec-workspace/local.yaml` from portable collaboration state by default. `.grspec-workspace/workspace.yaml` remains portable because it stores the workspace name and stable link names, not one user's absolute checkout paths.

Linked paths can be full repos, folders inside a large monorepo, or other existing folders. They do not need repo-local `grspec/` state before they can participate in workspace planning. Later implementation, verify, or archive workflows may require more repo readiness, but planning visibility starts with the link.

```text
multi-repo:
  api      -> /repos/api
  web      -> /repos/web

large monorepo:
  billing  -> /repos/platform/services/billing
  checkout -> /repos/platform/apps/checkout
```

Managed workspaces live under the standard grspec data directory:

```text
getGlobalDataDir()/workspaces
```

That means `$XDG_DATA_HOME/grspec/workspaces` when `XDG_DATA_HOME` is set, `~/.local/share/grspec/workspaces` on Unix-style fallback, and `%LOCALAPPDATA%\grspec\workspaces` on native Windows fallback. Native Windows shells, PowerShell, and WSL2 each keep the path strings for the runtime running grspec. This foundation does not translate between `D:\repo`, `/mnt/d/repo`, and UNC WSL paths.

grspec also keeps a machine-local registry at:

```text
getGlobalDataDir()/workspaces/registry.yaml
```

The registry maps workspace names to workspace locations so later global commands can list or select known workspaces from anywhere. It is only an index. Each workspace folder remains authoritative for its own `.grspec-workspace/workspace.yaml` and `.grspec-workspace/local.yaml`, so stale registry records can be reported and repaired without redefining the workspace itself.

Workspace visibility is not change commitment. Set up a workspace when grspec should know which repos or folders are relevant; create a change later when you are ready to plan a feature, fix, project, or other piece of work.

Useful commands:

```bash
# Guided setup
grspec workspace setup

# Automation-friendly setup
grspec workspace setup --no-interactive --name platform --link /repos/api --link web=/repos/web

# See known workspaces from the local registry
grspec workspace list
grspec workspace ls

# Add or repair links for the selected workspace
grspec workspace link /repos/api
grspec workspace link api-service /repos/api
grspec workspace relink api-service /new/path/to/api

# Check what this machine can resolve
grspec workspace doctor
grspec workspace doctor --workspace platform
```

`workspace setup` always creates the workspace in the standard workspace location, records it in the local registry, shows the workspace location, and requires at least one linked repo or folder. `workspace link` and `workspace relink` record existing folders only; they do not create, copy, move, initialize, or edit the linked repo or folder.

Workspace commands that need one workspace can run from anywhere with `--workspace <name>`. If you run them inside a workspace folder or subdirectory, grspec uses that current workspace. If several known workspaces are available and you do not pass `--workspace <name>`, human commands show a picker; `--json` and `--no-interactive` fail with a structured status error instead of prompting.

Direct workspace commands support JSON output for scripts. JSON responses keep primary data in `workspace`, `workspaces`, or `link` objects and report warnings or errors in `status` arrays. Healthy objects use `status: []`.

## Specs

Specs describe your system's behavior using structured requirements and scenarios.

### Structure

```
grspec/specs/
├── auth/
│   └── spec.md           # Authentication behavior
├── payments/
│   └── spec.md           # Payment processing
├── notifications/
│   └── spec.md           # Notification system
└── ui/
    └── spec.md           # UI behavior and themes
```

Organize specs by domain — logical groupings that make sense for your system. Common patterns:

- **By feature area**: `auth/`, `payments/`, `search/`
- **By component**: `api/`, `frontend/`, `workers/`
- **By bounded context**: `ordering/`, `fulfillment/`, `inventory/`

### Spec Format

A spec contains requirements, and each requirement has scenarios:

```markdown
# Auth Specification

## Purpose
Authentication and session management for the application.

## Requirements

### Requirement: User Authentication
The system SHALL issue a JWT token upon successful login.

#### Scenario: Valid credentials
- GIVEN a user with valid credentials
- WHEN the user submits login form
- THEN a JWT token is returned
- AND the user is redirected to dashboard

#### Scenario: Invalid credentials
- GIVEN invalid credentials
- WHEN the user submits login form
- THEN an error message is displayed
- AND no token is issued

### Requirement: Session Expiration
The system MUST expire sessions after 30 minutes of inactivity.

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated
- AND the user must re-authenticate
```

**Key elements:**

| Element | Purpose |
|---------|---------|
| `## Purpose` | High-level description of this spec's domain |
| `### Requirement:` | A specific behavior the system must have |
| `#### Scenario:` | A concrete example of the requirement in action |
| SHALL/MUST/SHOULD | RFC 2119 keywords indicating requirement strength |

### Why Structure Specs This Way

**Requirements are the "what"** — they state what the system should do without specifying implementation.

**Scenarios are the "when"** — they provide concrete examples that can be verified. Good scenarios:
- Are testable (you could write an automated test for them)
- Cover both happy path and edge cases
- Use Given/When/Then or similar structured format

**RFC 2119 keywords** (SHALL, MUST, SHOULD, MAY) communicate intent:
- **MUST/SHALL** — absolute requirement
- **SHOULD** — recommended, but exceptions exist
- **MAY** — optional

### What a Spec Is (and Is Not)

A spec is a **behavior contract**, not an implementation plan.

Good spec content:
- Observable behavior users or downstream systems rely on
- Inputs, outputs, and error conditions
- External constraints (security, privacy, reliability, compatibility)
- Scenarios that can be tested or explicitly validated

Avoid in specs:
- Internal class/function names
- Library or framework choices
- Step-by-step implementation details
- Detailed execution plans (those belong in `design.md` or `tasks.md`)

Quick test:
- If implementation can change without changing externally visible behavior, it likely does not belong in the spec.

### Keep It Lightweight: Progressive Rigor

grspec aims to avoid bureaucracy. Use the lightest level that still makes the change verifiable.

**Lite spec (default):**
- Short behavior-first requirements
- Clear scope and non-goals
- A few concrete acceptance checks

**Full spec (for higher risk):**
- Cross-team or cross-repo changes
- API/contract changes, migrations, security/privacy concerns
- Changes where ambiguity is likely to cause expensive rework

Most changes should stay in Lite mode.

### Human + Agent Collaboration

In many teams, humans explore and agents draft artifacts. The intended loop is:

1. Human provides intent, context, and constraints.
2. Agent converts this into behavior-first requirements and scenarios.
3. Agent keeps implementation detail in `design.md` and `tasks.md`, not `spec.md`.
4. Validation confirms structure and clarity before implementation.

This keeps specs readable for humans and consistent for agents.

## Changes

A change is a proposed modification to your system, packaged as a folder with everything needed to understand and implement it.

### Change Structure

```
grspec/changes/add-dark-mode/
├── proposal.md           # Why and what
├── design.md             # How (technical approach)
├── tasks.md              # Implementation checklist
├── .grspec.yaml        # Change metadata (optional)
└── specs/                # Delta specs
    └── ui/
        └── spec.md       # What's changing in ui/spec.md
```

Each change is self-contained. It has:
- **Artifacts** — documents that capture intent, design, and tasks
- **Delta specs** — specifications for what's being added, modified, or removed
- **Metadata** — optional configuration for this specific change

### Why Changes Are Folders

Packaging a change as a folder has several benefits:

1. **Everything together.** Proposal, design, tasks, and specs live in one place. No hunting through different locations.

2. **Parallel work.** Multiple changes can exist simultaneously without conflicting. Work on `add-dark-mode` while `fix-auth-bug` is also in progress.

3. **Clean history.** When archived, changes move to `changes/archive/` with their full context preserved. You can look back and understand not just what changed, but why.

4. **Review-friendly.** A change folder is easy to review — open it, read the proposal, check the design, see the spec deltas.

## Artifacts

Artifacts are the documents within a change that guide the work.

### The Artifact Flow

```
proposal ──────► specs ──────► design ──────► tasks ──────► implement
    │               │             │              │
   why            what           how          steps
 + scope        changes       approach      to take
```

Artifacts build on each other. Each artifact provides context for the next.

### Artifact Types

#### Proposal (`proposal.md`)

The proposal captures **intent**, **scope**, and **approach** at a high level.

```markdown
# Proposal: Add Dark Mode

## Intent
Users have requested a dark mode option to reduce eye strain
during nighttime usage and match system preferences.

## Scope
In scope:
- Theme toggle in settings
- System preference detection
- Persist preference in localStorage

Out of scope:
- Custom color themes (future work)
- Per-page theme overrides

## Approach
Use CSS custom properties for theming with a React context
for state management. Detect system preference on first load,
allow manual override.
```

**When to update the proposal:**
- Scope changes (narrowing or expanding)
- Intent clarifies (better understanding of the problem)
- Approach fundamentally shifts

#### Specs (delta specs in `specs/`)

Delta specs describe **what's changing** relative to the current specs. See [Delta Specs](#delta-specs) below.

#### Design (`design.md`)

The design captures **technical approach** and **architecture decisions**.

````markdown
# Design: Add Dark Mode

## Technical Approach
Theme state managed via React Context to avoid prop drilling.
CSS custom properties enable runtime switching without class toggling.

## Architecture Decisions

### Decision: Context over Redux
Using React Context for theme state because:
- Simple binary state (light/dark)
- No complex state transitions
- Avoids adding Redux dependency

### Decision: CSS Custom Properties
Using CSS variables instead of CSS-in-JS because:
- Works with existing stylesheet
- No runtime overhead
- Browser-native solution

## Data Flow
```
ThemeProvider (context)
       │
       ▼
ThemeToggle ◄──► localStorage
       │
       ▼
CSS Variables (applied to :root)
```

## File Changes
- `src/contexts/ThemeContext.tsx` (new)
- `src/components/ThemeToggle.tsx` (new)
- `src/styles/globals.css` (modified)
````

**When to update the design:**
- Implementation reveals the approach won't work
- Better solution discovered
- Dependencies or constraints change

#### Tasks (`tasks.md`)

Tasks are the **implementation checklist** — concrete steps with checkboxes.

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [ ] 1.2 Add CSS custom properties for colors
- [ ] 1.3 Implement localStorage persistence
- [ ] 1.4 Add system preference detection

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
- [ ] 2.2 Add toggle to settings page
- [ ] 2.3 Update Header to include quick toggle

## 3. Styling
- [ ] 3.1 Define dark theme color palette
- [ ] 3.2 Update components to use CSS variables
- [ ] 3.3 Test contrast ratios for accessibility
```

**Task best practices:**
- Group related tasks under headings
- Use hierarchical numbering (1.1, 1.2, etc.)
- Keep tasks small enough to complete in one session
- Check tasks off as you complete them

## Delta Specs

Delta specs are the key concept that makes grspec work for brownfield development. They describe **what's changing** rather than restating the entire spec.

### The Format

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST support TOTP-based two-factor authentication.

#### Scenario: 2FA enrollment
- GIVEN a user without 2FA enabled
- WHEN the user enables 2FA in settings
- THEN a QR code is displayed for authenticator app setup
- AND the user must verify with a code before activation

#### Scenario: 2FA login
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented
- AND login completes only after valid OTP

## MODIFIED Requirements

### Requirement: Session Expiration
The system MUST expire sessions after 15 minutes of inactivity.
(Previously: 30 minutes)

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 15 minutes pass without activity
- THEN the session is invalidated

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA. Users should re-authenticate each session.)
```

### Delta Sections

| Section | Meaning | What Happens on Archive |
|---------|---------|------------------------|
| `## ADDED Requirements` | New behavior | Appended to main spec |
| `## MODIFIED Requirements` | Changed behavior | Replaces existing requirement |
| `## REMOVED Requirements` | Deprecated behavior | Deleted from main spec |

### Why Deltas Instead of Full Specs

**Clarity.** A delta shows exactly what's changing. Reading a full spec, you'd have to diff it mentally against the current version.

**Conflict avoidance.** Two changes can touch the same spec file without conflicting, as long as they modify different requirements.

**Review efficiency.** Reviewers see the change, not the unchanged context. Focus on what matters.

**Brownfield fit.** Most work modifies existing behavior. Deltas make modifications first-class, not an afterthought.

## Schemas

Schemas define the artifact types and their dependencies for a workflow.

### How Schemas Work

```yaml
# grspec/schemas/spec-driven/schema.yaml
name: spec-driven
artifacts:
  - id: proposal
    generates: proposal.md
    requires: []              # No dependencies, can create first

  - id: specs
    generates: specs/**/*.md
    requires: [proposal]      # Needs proposal before creating

  - id: design
    generates: design.md
    requires: [proposal]      # Can create in parallel with specs

  - id: tasks
    generates: tasks.md
    requires: [specs, design] # Needs both specs and design first
```

**Artifacts form a dependency graph:**

```
                    proposal
                   (root node)
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
      specs                       design
   (requires:                  (requires:
    proposal)                   proposal)
         │                           │
         └─────────────┬─────────────┘
                       │
                       ▼
                    tasks
                (requires:
                specs, design)
```

**Dependencies are enablers, not gates.** They show what's possible to create, not what you must create next. You can skip design if you don't need it. You can create specs before or after design — both depend only on proposal.

### Built-in Schemas

**spec-driven** (default)

The standard workflow for spec-driven development:

```
proposal → specs → design → tasks → implement
```

Best for: Most feature work where you want to agree on specs before implementation.

### Custom Schemas

Create custom schemas for your team's workflow:

```bash
# Create from scratch
grspec schema init research-first

# Or fork an existing one
grspec schema fork spec-driven research-first
```

**Example custom schema:**

```yaml
# grspec/schemas/research-first/schema.yaml
name: research-first
artifacts:
  - id: research
    generates: research.md
    requires: []           # Do research first

  - id: proposal
    generates: proposal.md
    requires: [research]   # Proposal informed by research

  - id: tasks
    generates: tasks.md
    requires: [proposal]   # Skip specs/design, go straight to tasks
```

See [Customization](customization.md) for full details on creating and using custom schemas.

## Archive

Archiving completes a change by merging its delta specs into the main specs and preserving the change for history.

### What Happens When You Archive

```
Before archive:

grspec/
├── specs/
│   └── auth/
│       └── spec.md ◄────────────────┐
└── changes/                         │
    └── add-2fa/                     │
        ├── proposal.md              │
        ├── design.md                │ merge
        ├── tasks.md                 │
        └── specs/                   │
            └── auth/                │
                └── spec.md ─────────┘


After archive:

grspec/
├── specs/
│   └── auth/
│       └── spec.md        # Now includes 2FA requirements
└── changes/
    └── archive/
        └── 2025-01-24-add-2fa/    # Preserved for history
            ├── proposal.md
            ├── design.md
            ├── tasks.md
            └── specs/
                └── auth/
                    └── spec.md
```

### The Archive Process

1. **Merge deltas.** Each delta spec section (ADDED/MODIFIED/REMOVED) is applied to the corresponding main spec.

2. **Move to archive.** The change folder moves to `changes/archive/` with a date prefix for chronological ordering.

3. **Preserve context.** All artifacts remain intact in the archive. You can always look back to understand why a change was made.

### Why Archive Matters

**Clean state.** Active changes (`changes/`) shows only work in progress. Completed work moves out of the way.

**Audit trail.** The archive preserves the full context of every change — not just what changed, but the proposal explaining why, the design explaining how, and the tasks showing the work done.

**Spec evolution.** Specs grow organically as changes are archived. Each archive merges its deltas, building up a comprehensive specification over time.

## How It All Fits Together

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              GRSPEC FLOW                                   │
│                                                                              │
│   ┌────────────────┐                                                         │
│   │  1. START      │  /grsx:propose (core) or /grsx:new (expanded)           │
│   │     CHANGE     │                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  2. CREATE     │  /grsx:ff or /grsx:continue (expanded workflow)         │
│   │     ARTIFACTS  │  Creates proposal → specs → design → tasks              │
│   │                │  (based on schema dependencies)                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  3. IMPLEMENT  │  /grsx:apply                                            │
│   │     TASKS      │  Work through tasks, checking them off                  │
│   │                │◄──── Update artifacts as you learn                      │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  4. VERIFY     │  /grsx:verify (optional)                                │
│   │     WORK       │  Check implementation matches specs                     │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐     ┌──────────────────────────────────────────────┐    │
│   │  5. ARCHIVE    │────►│  Delta specs merge into main specs           │    │
│   │     CHANGE     │     │  Change folder moves to archive/             │    │
│   └────────────────┘     │  Specs are now the updated source of truth   │    │
│                          └──────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**The virtuous cycle:**

1. Specs describe current behavior
2. Changes propose modifications (as deltas)
3. Implementation makes the changes real
4. Archive merges deltas into specs
5. Specs now describe the new behavior
6. Next change builds on updated specs

## Glossary

| Term | Definition |
|------|------------|
| **Artifact** | A document within a change (proposal, design, tasks, or delta specs) |
| **Archive** | The process of completing a change and merging its deltas into main specs |
| **Change** | A proposed modification to the system, packaged as a folder with artifacts |
| **Delta spec** | A spec that describes changes (ADDED/MODIFIED/REMOVED) relative to current specs |
| **Domain** | A logical grouping for specs (e.g., `auth/`, `payments/`) |
| **Requirement** | A specific behavior the system must have |
| **Scenario** | A concrete example of a requirement, typically in Given/When/Then format |
| **Schema** | A definition of artifact types and their dependencies |
| **Spec** | A specification describing system behavior, containing requirements and scenarios |
| **Source of truth** | The `grspec/specs/` directory, containing the current agreed-upon behavior |

## Knowledge Layer

grspec's knowledge layer provides persistent project context for AI agents:

- **Constitution** (`grspec/constitution.md`) — Project-level constraints: identity, architecture principles, coding standards, team agreements. Created once, shared by all agents.
- **Domain Model** (`grspec/domain-model.md`) — Business domain map: bounded contexts, core entities, context map, ubiquitous language. Defines team division boundaries.
- **Domain Specs** (`grspec/specs/`) — Per-context business rules that grow with the project.

Initialize with `grspec init --track new-project` or `grspec init --track existing-project`.

## Execution Discipline

grspec integrates execution discipline skills from the Superpowers framework:

- **TDD** (`grspec-tdd`) — RED-GREEN-REFACTOR cycle for core logic
- **Verification** (`grspec-verify`) — Evidence-based completion checks
- **Debugging** (`grspec-debug`) — Four-stage systematic debugging
- **Review** (`grspec-review`) — Dual-stage code review (spec compliance + quality)

Each discipline includes anti-rationalization mechanisms: Iron Law, Red Flags, Rationalization Table, and Verification Gate.

## Collaboration Infrastructure

- **Parallel Dispatch** (`grspec-parallel`) — Run independent tasks in parallel, grouped by bounded context
- **Subagent Development** (`grspec-subagent`) — Delegate tasks to isolated subagents with review
- **Model Selection** — Choose model capability level by task type (cheap for green-phase TDD, capable for design review)

## Change Stacking & Dependencies

When working on multiple changes in parallel, grspec supports optional **stack metadata** to express sequencing, decomposition, and file-level impact.

### Stack Metadata Fields

Add these optional fields to `.grspec.yaml` in any change directory:

```yaml
schema: spec-driven
created: "2025-01-10"
dependsOn:
  - add-auth
provides:
  - rate-limiting
requires:
  - auth-middleware
parent: add-full-system
touches:
  - path: src/api/middleware/index.ts
    intent: "Register rate-limit middleware before auth in chain"
    mode: modify
  - path: src/config/rate-limits.ts
    intent: "Define per-environment rate limit thresholds"
    mode: create
```

- **`dependsOn`** — Changes that must land first (source of truth for ordering)
- **`provides`** — Capability markers exposed by this change
- **`requires`** — Capability markers needed by this change
- **`parent`** — Parent change (for split work)
- **`touches`** — File-level impact declarations with intent and mode

### Ordering Semantics

- `dependsOn` is the only source of truth for execution/archive ordering
- `provides`/`requires` are validation contracts — they don't create implicit dependency edges
- Overlapping `touches` emit advisory warnings but don't block

### Splitting Large Changes

Use `grspec change split <change-id> --children part-1 part-2` to decompose a large change into stackable slices. Each child gets:
- A `parent` link to the source change
- Sequential `dependsOn` linking (part-2 depends on part-1)
- Stub `proposal.md` and `tasks.md` files

### Stack Validation

`grspec change graph` validates for:
- Dependency cycles (hard error)
- Missing dependency targets (hard error)
- File-level overlap warnings (advisory)
- Unmatched `requires` markers (advisory)
- Excessive touches (>8 files, suggests splitting)

### Migration from IMPLEMENTATION_ORDER.md

Per-change stack metadata is the normative dependency source. `grspec/changes/IMPLEMENTATION_ORDER.md` remains optional narrative context but is no longer the source of truth for ordering.

## Git Coordination

grspec provides git-aware intelligence for coordinating parallel work:

### Structured Commits

After successful apply, grspec generates commits with embedded YAML metadata:

```
feat(add-auth): Authentication Setup

Implements task group 1: Authentication Setup
- Add auth middleware
- Configure JWT tokens

---
grspec: add-auth
task-group: 1
modules:
  added:
    - path: src/auth/middleware.ts
      domain: auth
      intent: Create auth middleware handler
  modified:
    - path: src/api/routes/index.ts
      domain: api
      intent: Register auth routes
  deleted: []
---
```

### Activity Queries

Use `grspec activity` to query structured commit data:

```bash
grspec activity --since=2w --json    # Recent activity summary
grspec activity --file src/shared.ts  # Who touched this file and why
grspec activity --hot                 # Contested files ranked by frequency
grspec activity --change add-auth     # Full summary of a change's commits
```

### Coordination Modes

When applying changes with file-level overlap, the AI selects:
- **Extend** — Overlapping change already merged; build on top
- **Prepare** — Overlapping change in progress; leave extension points
- **Negotiate** — Intents incompatible; present resolution options

### Anchors (Optional)

For large codebases, `grspec/anchors.yaml` maps domains to entry files for improved inference:

```yaml
domains:
  auth:
    entry: src/auth/index.ts
    files:
      - src/auth/strategies/*.ts
      - src/auth/middleware.ts
  api:
    entry: src/api/router.ts
    files:
      - src/api/routes/*.ts
```

## Next Steps

- [Getting Started](getting-started.md) - Practical first steps
- [Workflows](workflows.md) - Common patterns and when to use each
- [Commands](commands.md) - Full command reference
- [Customization](customization.md) - Create custom schemas and configure your project
