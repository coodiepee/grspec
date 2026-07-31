---
title: "Telemetry"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/telemetry/spec.md
  - src/telemetry/index.ts
  - src/telemetry/config.ts
related:
  - "[[global-config]]"
  - "[[cli-init]]"
---

# Telemetry

grspec collects minimal, anonymous usage telemetry via PostHog to improve the tool. Telemetry is privacy-preserving, transparent, and easily disabled.

## What's Tracked

Only `command_executed` events with two properties:
- `command` — Command name (e.g., `init`, `archive`)
- `version` — grspec version

**Explicitly excluded**: command arguments, file paths, project names, spec content, error messages, IP addresses (set to `$ip: null`).

## Opt-Out

Telemetry can be disabled via:
- `OPENSPEC_TELEMETRY=0` environment variable
- `DO_NOT_TRACK=1` environment variable (industry standard)
- `grspec config set telemetryConsent false`

## First-Run Notice

On first CLI invocation, a notice is displayed explaining what's collected and how to opt out. The notice is shown once and the consent state is persisted to global config.

## Implementation

The `src/telemetry/` module handles PostHog client initialization, event batching, graceful shutdown with flush, and error suppression (telemetry failures never affect CLI operation).
