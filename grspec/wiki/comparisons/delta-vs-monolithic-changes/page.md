---
title: "Delta vs Monolithic Changes"
type: comparison
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/grspec-conventions/spec.md
  - grspec/changes/archive/2025-08-19-adopt-delta-based-changes/proposal.md
related:
  - "[[delta-specs]]"
  - "[[grspec-conventions]]"
  - "[[cli-archive]]"
---

# Delta vs Monolithic Changes

A comparison of the two approaches to storing spec changes, and why grspec chose delta-based changes.

## Monolithic (Future-State) Approach

Store the complete future state of each modified spec. The change directory contains a full copy of every affected `spec.md`.

| Aspect | Assessment |
|--------|-----------|
| **Readability** | High — each file is a complete, standalone spec |
| **Diff quality** | Low — reviewer must diff entire files to find what changed |
| **Parallel safety** | Low — two changes modifying the same spec conflict at the file level |
| **Merge automation** | None — requires manual file replacement |
| **Storage cost** | High — duplicates all unchanged requirements |

## Delta Approach (chosen)

Store only the ADDED, MODIFIED, REMOVED, and RENAMED requirements. Each delta file contains sections declaring what changes.

| Aspect | Assessment |
|--------|-----------|
| **Readability** | Medium — requires understanding delta section markers |
| **Diff quality** | High — only changed requirements are visible |
| **Parallel safety** | High — changes to different requirements in the same spec don't conflict |
| **Merge automation** | Full — programmatic application via header-based matching |
| **Storage cost** | Low — only changed requirements are stored |

## Decision Rationale

The delta approach was adopted in `2025-08-19-adopt-delta-based-changes` because:

1. **Parallel development** — Multiple changes can modify different requirements in the same spec without file-level conflicts
2. **Automated merging** — The archive command can programmatically apply deltas using requirement header matching, eliminating manual copy-paste
3. **Clear intent** — Delta markers (ADDED/MODIFIED/REMOVED/RENAMED) explicitly declare the type of each change
4. **Smaller footprint** — Only stores what actually changes, reducing noise in code review

## Tradeoffs Accepted

- Authors must learn the delta section format (mitigated by AI-driven proposal creation)
- Delta files are not standalone readable specs (mitigated by `grspec show` rendering)
- Requirement header uniqueness becomes critical (mitigated by validation tooling)
