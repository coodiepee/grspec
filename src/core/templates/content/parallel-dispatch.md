Use parallel execution only when it **reduces wall-clock time without corrupting shared state**.

---

## When to parallelize

- Work items are **independent**: no concurrent edits to the same files, no conflicting migrations, no shared mutable state without a merge plan.
- Boundaries are clear: each thread has an explicit scope and done condition.
- **Do not** parallelize when debugging one shared root cause, one hot file everyone touches, or unclear requirements.

---

## How to partition

Prefer **bounded context** (from `grspec/domain-model.md` and each change’s `context.bounded-contexts` in `.grspec.yaml`):

- Group tasks that touch the same context into one branch or one agent when they share files or terminology.
- Split **different** contexts across parallel agents when integration points are narrow (document hand-offs in the plan or design).

---

## Model selection per strategy

| Task strategy | Suggested model tier | Rationale |
|---------------|---------------------|-----------|
| codegen / deterministic tooling | No LLM required | Prefer canonical tools and scripts. |
| TDD RED (write failing tests) | Standard | Needs careful reading of specs and behavior. |
| TDD GREEN (minimal pass) | Faster / economical | Tests constrain the implementation space. |
| Review — spec compliance | Capable | Must compare code to written requirements. |
| Review — code quality | Standard | Conventions and structure checks. |
| Explore / brainstorming / domain modeling | Capable | Creative and abstract reasoning. |

Pick per **slice** — not one model for everything.

---

## Coordination — merging results

- **Single integration owner** or explicit merge order (e.g., migrations before app code).
- **Continuous alignment**: short sync on interface contracts (types, events, API shapes) before deep implementation.
- Merge with **verification**: run build/tests/lint after each merge chunk; don’t stack unverified branches.
- Resolve conflicts **explicitly**; never “take both” without understanding semantics.

---

## Guardrails

- Parallel is an optimization, not a default — serial may be safer when ownership is fuzzy.
- If two agents need the same file, **sequence** them instead of racing.
- Subagents and parallel runs still owe **evidence** (tests, commands) at merge time.
