---
title: "Domain Model Template"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/domain-model/spec.md
  - src/core/templates/domain-model.ts
related:
  - "[[project-bootstrap]]"
  - "[[cli-init]]"
  - "[[constitution-template]]"
---

# Domain Model Template

The domain model template generates `grspec/domain-model.md` during `grspec init --track`, documenting bounded contexts, entity relationships, and ubiquitous language.

## Template Variants

- **New Project** — Full template with sections for bounded contexts, context map, and ubiquitous language
- **Existing Project** — Reverse-engineering skeleton for documenting existing domain structure

## Sections

| Section | Purpose |
|---------|---------|
| Bounded Contexts | Purpose, core entities, key modules per context |
| Context Map | Source/target/relationship table between contexts |
| Ubiquitous Language | Term/definition/context glossary |

The domain model is optional per [[grspec-conventions]] and its absence doesn't invalidate the project layout.
