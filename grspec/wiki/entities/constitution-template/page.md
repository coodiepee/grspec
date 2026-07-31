---
title: "Constitution Template"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/constitution/spec.md
  - src/core/templates/constitution.ts
related:
  - "[[project-bootstrap]]"
  - "[[cli-init]]"
  - "[[grspec-conventions]]"
---

# Constitution Template

The constitution template generates `grspec/constitution.md` during `grspec init --track`, providing a project identity and architectural principles document.

## Template Variants

- **New Project** — Full template with placeholder sections for project identity, architecture principles, coding standards, and team agreements
- **Existing Project** — Reverse-engineering skeleton that guides the user to document their existing project's conventions

## Sections

| Section | Purpose |
|---------|---------|
| Project Identity | Name, language, runtime, package manager, frameworks |
| Architecture Principles | Layering, API design, error handling, cross-platform |
| Coding Standards | Naming, comments, test strategy, lint/format |
| Team Agreements | Change granularity, review strategy, branch strategy |

## Validation

Downstream operations that reference bounded contexts validate constitution presence. The file is optional per [[grspec-conventions]] — its absence doesn't invalidate the project layout.
