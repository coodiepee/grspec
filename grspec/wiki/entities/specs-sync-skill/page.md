---
title: "Specs Sync Skill"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/specs-sync-skill/spec.md
  - src/core/specs-apply.ts
related:
  - "[[delta-specs]]"
  - "[[cli-archive]]"
  - "[[grsx-archive-skill]]"
---

# Specs Sync Skill

The specs sync skill (`/grsx:sync`) merges delta specs from a change to main specs without archiving the change. This allows spec updates to be applied mid-workflow.

## When to Use

- Long-running changes that want their spec updates visible to other changes early
- Validating spec merge results before committing to archive
- Manual sync when auto-sync during archive is skipped

## Process

1. Identifies the active change and its delta specs
2. Previews changes (ADDED, MODIFIED, REMOVED, RENAMED requirements per capability)
3. Applies delta operations in the correct order (RENAMED → REMOVED → MODIFIED → ADDED)
4. Reports results with counts per capability

## Relationship to Archive

The [[cli-archive]] command includes spec sync as part of its process. The sync skill provides the same functionality standalone, without the move-to-archive step.
