---
title: "Project Bootstrap"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/project-bootstrap/spec.md
related:
  - "[[cli-init]]"
  - "[[constitution-template]]"
  - "[[domain-model-template]]"
  - "[[spec-driven-workflow]]"
---

# Project Bootstrap

Project bootstrap defines ordered phase sequences for initializing grspec in new and existing projects using `grspec init --track`.

## Tracks

### New Project Track
1. Generate constitution template (full template with placeholder sections)
2. Generate domain model template (bounded contexts, context map, ubiquitous language)
3. Configure AI tools and install skills
4. Mark bootstrap as complete in `grspec.yaml`

### Existing Project Track
1. Generate constitution skeleton (reverse-engineering prompts for documenting existing conventions)
2. Generate domain model skeleton
3. Configure AI tools and install skills
4. Mark bootstrap as complete

## Bootstrap State

Bootstrap progress is tracked in `grspec.yaml` to support resumable initialization. Once all phases are complete, the project transitions to the standard change workflow.

## Completion Gating

The bootstrap process must complete before the standard change workflow is available. This ensures that foundational documents (constitution, domain model) are created before developers start proposing changes.
