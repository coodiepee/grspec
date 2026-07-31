---
title: "Domain Model"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/domain-model/spec.md
  - src/core/templates/domain-model.ts
related:
  - "[[domain-model-template]]"
  - "[[project-bootstrap]]"
  - "[[cli-init]]"
---

# Domain Model

Defines domain model template generation behavior for `grspec init --track`. The spec governs both full templates for new projects and reverse-engineering skeletons for existing projects. See [[domain-model-template]] for template details and [[project-bootstrap]] for the bootstrap workflow.

## Validation

Domain model presence is validated when bounded contexts are referenced. The file itself (`grspec/domain-model.md`) is optional per [[grspec-conventions]].
