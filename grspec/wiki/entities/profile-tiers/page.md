---
title: "Profile Tiers (Entity)"
type: entity
created: 2026-05-22
updated: 2026-07-28
confidence: high
sources:
  - grspec/specs/profile-tiers/spec.md
  - src/core/profiles.ts
related:
  - "[[global-config]]"
  - "[[template-system]]"
---

# Profile Tiers

Implements the four-tier profile system described in the [[profile-tiers]] concept page. The `src/core/profiles.ts` module defines workflow constants for each tier as typed arrays.

## Workflow Constants

- `MINIMAL_WORKFLOWS` — 5 workflows (propose, explore, apply, sync, archive)
- `STANDARD_WORKFLOWS` — 12 workflows (minimal + tdd, validate, verify, debug, review, wiki, ui)
- `FULL_WORKFLOWS` — 19 workflows (standard + new, continue, ff, bulk-archive, onboard, parallel, subagent)
- `ALL_WORKFLOWS` — 19 workflows (`validate` + `verify`; no `verify-gate`)
