---
title: "Collaboration Infrastructure"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/collaboration-infra/spec.md
  - src/core/templates/workflows/parallel-dispatch.ts
  - src/core/templates/workflows/subagent.ts
related:
  - "[[profile-tiers]]"
  - "[[execution-discipline]]"
---

# Collaboration Infrastructure

Collaboration infrastructure provides skill templates for dispatching parallel work and delegating to subagents. These are available in the `full` profile tier.

## Skills

### `grspec-parallel`

Dispatches independent tasks across multiple parallel agents using git worktrees for isolation. Includes model selection guidance and coordination patterns for splitting work without conflicts.

### `grspec-subagent`

Delegates specific tasks to subagents with clear boundaries. Provides patterns for task decomposition, context passing, and result aggregation.

## Key Patterns

- **Git Worktree Isolation** — Parallel agents work in separate worktrees to prevent conflicts
- **Model Selection** — Guidance for choosing appropriate models for subagent tasks
- **Context Scoping** — Templates for defining clear task boundaries and passing minimal necessary context
