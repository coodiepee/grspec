---
title: "GRSX Onboard Skill"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/grsx-onboard-skill/spec.md
  - src/core/templates/workflows/onboard.ts
related:
  - "[[cli-init]]"
  - "[[spec-driven-workflow]]"
---

# GRSX Onboard Skill

The `/grsx:onboard` skill guides users through an end-to-end grspec workflow on their real codebase. It's a narrated walkthrough that teaches by doing.

## Onboarding Flow

1. **Project Assessment** — Scans the codebase to understand the project structure, tech stack, and existing specs
2. **Init Check** — Ensures grspec is initialized; runs `grspec init` if needed
3. **Guided Change** — Walks the user through creating a real change proposal using their codebase
4. **Artifact Creation** — Steps through proposal → design → specs → plan with explanations at each stage
5. **Workflow Narration** — Explains grspec concepts (delta specs, artifact graph, profiles) as they're encountered naturally

## Philosophy

The onboarding skill teaches through real work, not tutorials. The user ends up with an actual change they can implement, not a throwaway example.
