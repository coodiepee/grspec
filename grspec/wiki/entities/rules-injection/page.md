---
title: "Rules Injection"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/rules-injection/spec.md
related:
  - "[[context-injection]]"
  - "[[instruction-loader]]"
  - "[[config-loading]]"
---

# Rules Injection

Rules injection inserts per-artifact behavioral rules from the `rules` section of `grspec.yaml` into generated instructions.

## How It Works

The `rules` section in project config maps artifact types to arrays of rule strings:

```yaml
rules:
  specs:
    - Include scenarios for Windows path handling when dealing with file paths
    - Prefer user-facing product behavior over internal mechanics
  tasks:
    - Add Windows CI verification when changes involve file paths
  design:
    - Prefer Node.js path module over string manipulation for paths
```

When instructions are generated for an artifact, the matching rules are injected with deterministic formatting. Rules for unknown artifact IDs generate warnings at instruction load time (not at config parse time — see [[config-loading]]).

## Formatting

Rules are formatted as a bulleted list within the instruction output, preserving the original text exactly as written in the config.
