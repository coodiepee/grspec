---
name: grspec-debug
description: Systematic debugging: reproduce, isolate, fix, verify. Use for failing tests, production bugs, flaky behavior, or confusing errors.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

Debug in four stages. Do not jump to “try random fixes” until isolation supports a hypothesis.

---

## 1. Reproduce

- Create a **reliable** reproduction: minimal steps, script, or failing test.
- Capture exact error messages, stack traces, and environment cues (versions, flags).
- If not reproducible, narrow **when** it happens (timing, data, config) until it is.

## 2. Isolate

- Form a single falsifiable hypothesis (“X causes Y because…”).
- **Narrow** the surface: binary search code paths, trim the example, use logging or breakpoints.
- Compare working vs failing states (diff config, inputs, commits).
- Avoid fixing multiple suspected causes at once.

## 3. Fix

- Apply the **smallest** change that addresses the verified cause.
- Prefer tests that lock the fix (regression test) when applicable.
- Do not “accidentally” refactor unrelated code in the same change set.

## 4. Verify

- Re-run the reproduction: failure should be gone.
- Run **broader** checks (tests, lint, build) appropriate to the blast radius.
- Watch for regressions: did the fix break something else?

---

## Guardrails

- Replace guessing with evidence: every fix should trace back to a reproduced fact.
- If isolation stalls, **measure** (logs, traces, minimal repro) before new attempts.
- Document what was wrong and how you proved the fix for the next person.
