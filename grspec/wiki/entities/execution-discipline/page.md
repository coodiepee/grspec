---
title: "Execution Discipline"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/execution-discipline/spec.md
  - src/core/templates/workflows/tdd.ts
  - src/core/templates/workflows/verify.ts
  - src/core/templates/workflows/debug.ts
  - src/core/templates/workflows/review.ts
related:
  - "[[profile-tiers]]"
  - "[[grsx-verify-skill]]"
---

# Execution Discipline

Execution discipline is a set of four skill templates that enforce structured development workflows with anti-rationalization guardrails. These are part of the `standard` profile tier (installed by default).

## Skills

### `grspec-tdd` — Test-Driven Development
RED-GREEN-REFACTOR cycle with guardrails. Write a failing test first, make it pass with minimal code, then refactor.

### `grspec-verify` — Verification Gate
Requires running verification commands (tests, linters) with evidence before marking tasks complete. Forbids completion claims without successful verification.

### `grspec-debug` — Systematic Debugging
Four-stage debugging: Reproduce → Isolate → Fix → Verify. Prevents "fix it and hope" patterns.

### `grspec-review` — Code Review
Dual-stage review: spec compliance first, then code quality. Ensures implementations match their behavioral specifications.

## Anti-Rationalization Guardrails

All four skills include:

| Guardrail | Purpose |
|-----------|---------|
| **Iron Law** | The non-negotiable rule for the skill (e.g., "never skip the failing test") |
| **Red Flags** | Thought patterns that indicate rationalization |
| **Rationalization Table** | Common excuses mapped to their rebuttals |
| **Verification Gate** | Final checkpoint before claiming completion |

These guardrails prevent AI agents from cutting corners or rationalizing shortcuts.
