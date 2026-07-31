---
title: "Delta Specs"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/grspec-conventions/spec.md
  - src/core/specs-apply.ts
  - src/core/parsers/requirement-blocks.ts
related:
  - "[[grspec-conventions]]"
  - "[[cli-archive]]"
  - "[[specs-sync-skill]]"
  - "[[spec-driven-workflow]]"
---

# Delta Specs

Delta specs are the mechanism by which grspec evolves specifications incrementally. Instead of storing complete future-state copies, change proposals store only the additions, modifications, and removals relative to the current spec.

## Delta Operations

Each delta spec uses section headers to declare its operations:

| Section | Symbol | Purpose |
|---------|--------|---------|
| `## ADDED Requirements` | `+` (green) | New requirements to append |
| `## MODIFIED Requirements` | `~` (yellow) | Existing requirements to replace |
| `## REMOVED Requirements` | `-` (red) | Requirements to delete |
| `## RENAMED Requirements` | `→` (cyan) | Requirements to rename (FROM/TO pairs) |

## Header-Based Matching

Requirements are matched between delta specs and main specs using their `### Requirement: [Name]` headers. Matching is case-sensitive after trimming whitespace. This header-based identification enables programmatic merging without diff syntax.

## Application Order

During archive, deltas are applied in a strict order to avoid conflicts:

1. **RENAMED** — Apply renames first so subsequent operations use new names
2. **REMOVED** — Remove requirements by normalized header match
3. **MODIFIED** — Replace existing requirements by header match (using new names if renamed)
4. **ADDED** — Append new requirements (validated to not already exist)

## Why Deltas Over Future State

The delta approach provides:

- **Smaller diffs** — Only changed requirements are stored, not entire spec copies
- **Parallel safety** — Multiple changes can modify different requirements in the same spec
- **Merge automation** — Programmatic application replaces manual copy-paste
- **Audit trail** — Each operation type is explicitly declared

The `specs-apply` module in `src/core/specs-apply.ts` implements this logic, producing an `ApplyResult` with counts of added, modified, removed, and renamed requirements per capability.
