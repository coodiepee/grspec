---
title: "Profile Tiers"
type: concept
created: 2026-05-22
updated: 2026-07-28
confidence: high
sources:
  - grspec/specs/profile-tiers/spec.md
  - src/core/profiles.ts
  - src/core/global-config.ts
related:
  - "[[global-config]]"
  - "[[template-system]]"
  - "[[execution-discipline]]"
  - "[[collaboration-infra]]"
---

# Profile Tiers

Profiles control which workflow skills are installed during `grspec init` and `grspec update`. The four-tier system replaces a legacy binary core/custom model, making execution discipline workflows part of the default experience.

## Tier Hierarchy

Tiers are cumulative — each higher tier includes all workflows from lower tiers:

| Tier | Workflows Added | Total |
|------|----------------|-------|
| **minimal** | propose, explore, apply, sync, archive | 5 |
| **standard** (default) | + tdd, validate, verify, debug, review, wiki, ui | 12 |
| **full** | + new, continue, ff, bulk-archive, onboard, parallel, subagent | 19 |
| **custom** | Explicit workflow list from user config | varies |

## Default Behavior

When no profile is configured, `standard` is used. This ensures execution discipline workflows (TDD, verification, debugging, code review) are available immediately without explicit opt-in.

## Legacy Compatibility

The deprecated `core` profile value is treated as an alias for `standard` with a deprecation warning. Invalid profile values fall back to `standard` with an error message listing valid options.

## Configuration

Profiles are set in global config (`~/.config/grspec/config.json`):

```json
{
  "profile": "full",
  "workflows": ["propose", "apply"]  // only used when profile is "custom"
}
```

The profile determines WHICH workflows; delivery format (skills vs commands) determines HOW they are installed (see [[template-system]]).
