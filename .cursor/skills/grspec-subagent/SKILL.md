---
name: grspec-subagent
description: Subagent-driven development: delegate isolated slices to subagents with clear contracts, then review and merge with verification.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

Delegate with **subagents** when a slice is large enough to benefit from a clean context but small enough to specify crisply.

---

## When to use subagents

- **Isolated scope**: clear inputs, outputs, and file boundaries (e.g., one bounded context, one service, one vertical slice).
- **Heavy exploration** in a subdirectory without dragging the whole project into prompt context.
- **Parallelizable** work with a defined merge contract (types, interfaces, doc notes).

Avoid when the problem is unknown-root-cause debugging of one shared subsystem — keep one thread until isolation is done.

---

## Subagent lifecycle

1. **Create** — Written prompt with goal, non-goals, files allowed to touch, verification commands, and links to relevant specs/plan items.
2. **Execute** — Subagent implements within scope; reports commands run and results.
3. **Review** — Parent (or reviewer) checks output against spec and integration impact.
4. **Merge** — Land changes via normal VCS flow; run project verification after merges.

---

## Context isolation principles

- Ship **minimal** background: only artifacts and paths the slice needs.
- Freeze **interfaces** before parallel implementation when two slices meet.
- Never assume another agent “already ran” tests — **re-run** verification after merge.
- Prefer **append-only** logs or artifacts for hand-offs (what was done, what was skipped).

---

## Dual-stage review after subagent completion

Same discipline as a human PR:

1. **Spec compliance** — Does the slice meet requirements and integration contracts?
2. **Code quality** — Naming, structure, tests, and risk after merge.

Block merge if either stage has unresolved issues; trivial style-only fixes can follow in a dependent patch if policy allows.

---

## Guardrails

- Subagents are not a way to skip **verification** or **spec** alignment.
- If merge would conflict with parallel work, **sequence** instead of overlapping.
- Escalate scope creep back to the parent plan — don’t expand silently in the subagent prompt.
