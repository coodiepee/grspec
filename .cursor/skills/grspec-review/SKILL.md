---
name: grspec-review
description: Dual-stage code review: (1) spec compliance, then (2) code quality. Use after implementation or before merge when changes must match written intent.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

Perform a **dual-stage** review. Complete stage 1 before nitpicking style.

---

## Stage 1 — Spec compliance

Answer from artifacts (`proposal`, `design`, delta `specs`, plan items, etc.):

- Does behavior match **documented requirements** and acceptance cues?
- Are edge cases, error handling, and constraints from the spec reflected in code?
- Are there “silent” deviations? If yes, flag them; update specs or code — don’t rationalize in the gap.

Deliverable: concise list of **must-fix gaps** vs spec (if none, say so explicitly with references).

---

## Stage 2 — Code quality

After compliance is satisfied (or gaps are explicitly scoped):

- **Naming & structure** — clarity, cohesion, obvious data flow.
- **Patterns** — fits project conventions; avoids unnecessary cleverness.
- **Tests** — meaningful coverage for changed behavior; no redundant or flaky tests.
- **Risk** — security, performance, and operational foot-guns introduced by this diff.

Deliverable: prioritized improvements (blocking vs follow-up).

---

## Guardrails

- Stage 1 is not “optional for small changes.” Small bugs still ship when intent is wrong.
- Do not conflate **“I don’t like the style”** with **“this violates the spec.”**
- Prefer actionable comments: what to change, where, why.
