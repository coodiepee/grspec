---
title: "Constitution"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/constitution/spec.md
  - src/core/templates/constitution.ts
related:
  - "[[constitution-template]]"
  - "[[project-bootstrap]]"
  - "[[cli-init]]"
---

# Constitution

Defines constitution template generation behavior for `grspec init --track`. The spec governs both full templates for new projects and reverse-engineering skeletons for existing projects. See [[constitution-template]] for template details and [[project-bootstrap]] for the bootstrap workflow.

## Validation

Downstream operations that reference bounded contexts validate constitution presence. The file itself (`grspec/constitution.md`) is optional per [[grspec-conventions]].
