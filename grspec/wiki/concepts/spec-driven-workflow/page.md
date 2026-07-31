---
title: "Spec-Driven Workflow"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/grspec-conventions/spec.md
  - grspec/specs/artifact-graph/spec.md
  - grspec/specs/cli-artifact-workflow/spec.md
  - grspec/domain-model.md
related:
  - "[[artifact-graph]]"
  - "[[delta-specs]]"
  - "[[grspec-conventions]]"
  - "[[cli-artifact-workflow]]"
  - "[[plan-artifact]]"
---

# Spec-Driven Workflow

The spec-driven workflow is grspec's core change lifecycle — a structured, schema-enforced process that guides changes from idea to archive.

## Lifecycle Phases

```
Propose → Design → Specs → Plan → Apply → Archive
```

1. **Propose** — Describe the why, what, and impact of a change. Creates `proposal.md`.
2. **Design** — Document technical decisions and architecture. Creates `design.md`. Requires proposal.
3. **Specs** — Write behavioral specifications as delta specs. Creates `specs/<capability>/spec.md`. Requires proposal.
4. **Plan** — Create an implementation checklist with checkbox items. Creates `plan.md`. Requires design and specs.
5. **Apply** — Implement the change following the plan. Requires plan completion (all checkboxes checked).
6. **Archive** — Move completed change to `archive/YYYY-MM-DD-<name>/`, applying delta specs to main specs.

## Schema Enforcement

The [[artifact-graph]] enforces this dependency chain. Artifacts cannot be created until their upstream dependencies are satisfied. The `grspec instructions` command refuses to output instructions for blocked artifacts (see [[artifact-gate-enforcement]]).

## Change Directory Structure

```
changes/<change-name>/
├── .grspec.yaml        # Change metadata (schema, created date, stack info)
├── proposal.md         # Why this change exists
├── design.md           # How it will be implemented
├── plan.md             # Implementation checklist
└── specs/              # Delta specs
    └── <capability>/
        └── spec.md     # ADDED/MODIFIED/REMOVED/RENAMED sections
```

## Core Principles

- Specs reflect what IS currently built (source of truth)
- Changes contain proposals for what SHOULD change (delta from current)
- AI drives the documentation process
- Specs are living documentation kept in sync with deployed code
