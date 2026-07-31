---
title: "Global Config"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/global-config/spec.md
  - src/core/global-config.ts
related:
  - "[[project-config]]"
  - "[[profile-tiers]]"
  - "[[cli-config]]"
---

# Global Config

Global config manages user-level settings that persist across projects. It follows the XDG Base Directory Specification with platform-specific fallbacks.

## Storage Location

- **Linux/macOS**: `~/.config/grspec/config.json` (or `$XDG_CONFIG_HOME/grspec/config.json`)
- **Windows**: `%APPDATA%/grspec/config.json`

## Configuration Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `profile` | enum | `standard` | Workflow profile tier (see [[profile-tiers]]) |
| `workflows` | string[] | — | Explicit workflow list (only for `custom` profile) |
| `telemetryConsent` | boolean | — | Whether telemetry is opted in |

## Schema Evolution

The config format supports forward/backward compatibility. New fields use sensible defaults, and unknown fields are preserved (passthrough) to avoid data loss when downgrading versions.

## Access

- **Programmatic**: `src/core/global-config.ts` provides `loadGlobalConfig()` and `saveGlobalConfig()`
- **CLI**: `grspec config` commands provide get/set/list/path operations (see [[cli-config]])
