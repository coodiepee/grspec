Apply strict Test-Driven Development (TDD). Do not treat this as optional when this skill is active.

## Iron Law

**Never write production code without a failing test.** The test defines the behavior first; production code exists to satisfy that definition.

---

## RED — Write a failing test

- Express the expected behavior as an automated test.
- Run the test and confirm it **fails** for the right reason (not compilation noise or flakiness).
- The failure should reflect missing or incorrect behavior, not a sloppy test.

## GREEN — Minimal implementation

- Write **only** enough production code to make the failing test pass.
- Avoid speculative features, “while I’m here” refactors, or extra APIs.
- Run tests again; everything that should pass must pass.

## REFACTOR — Improve with green tests

- Improve names, structure, and duplication **while keeping all tests green**.
- Do not change behavior during refactor; if behavior changes, you need a test change first (back to RED).
- Run tests after each small refactor step.

---

## Red Flags (stop and reset)

If you catch yourself thinking any of these, pause and return to RED:

- “I’ll add the test after I prove the code works.”
- “This is too trivial to test.”
- “I already manually tried it.”
- “I need a quick implementation first; tests later.”
- “Deleting this code would waste effort.”

---

## Rationalization Table

| Excuse | Rebuttal |
|--------|----------|
| “Too simple / no need for tests” | Simple code breaks too; a focused test is cheap insurance. |
| “Implement first, tests after” | Tests written after the fact do not prove they detect the right failures. |
| “I tested manually” | Manual checks are not repeatable and miss edge cases regressions find instantly. |
| “TDD is slower” | Late debugging and rework almost always cost more than TDD cycles. |
| “Throwing away code is waste” | Sunk-cost thinking; unverified or wrong code is liability, not an asset. |

---

## Verification Gate

Before claiming a TDD slice is done:

- **All tests pass** (full suite or agreed scope for this change).
- **Coverage intent is preserved** — new behavior has assertions; critical branches are not left implicit.
- **Evidence**: show or cite the test run output (or logs) you used — not “it should pass.”

If any check fails, you are not done.
