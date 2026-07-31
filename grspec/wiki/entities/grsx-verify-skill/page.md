---
title: "GRSX Verify Skill"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/grsx-verify-skill/spec.md
  - src/core/templates/workflows/verify.ts
related:
  - "[[execution-discipline]]"
  - "[[spec-driven-workflow]]"
  - "[[grsx-archive-skill]]"
---

# GRSX Verify Skill

The `/grsx:verify` skill assesses implementation completeness, correctness, and coherence against change artifacts before archiving.

## Three-Stage Verification

1. **Completeness** — Are all tasks done? Do all spec requirements have corresponding implementation?
2. **Correctness** — Does the implementation match what the specs describe? Are test assertions aligned with requirements?
3. **Coherence** — Do the proposal, design, specs, and implementation tell a consistent story? Are there contradictions?

## Verification Report

The skill produces a structured report with:

- Per-task completion status
- Spec-to-implementation mapping
- Identified gaps or mismatches
- Coherence assessment across artifacts
- Overall verdict (pass/fail with details)

## Usage

Typically invoked after implementation is complete and before `/grsx:archive`. The [[grsx-archive-skill]] may suggest running verify when readiness checks pass but verification hasn't been done.
