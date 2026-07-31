---
title: "CLI Validate Command"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/cli-validate/spec.md
  - src/commands/validate.ts
  - src/core/validation/validator.ts
related:
  - "[[cli-change]]"
  - "[[cli-spec]]"
  - "[[grspec-conventions]]"
---

# CLI Validate Command

`grspec validate` validates changes and specs with actionable remediation guidance and structured output.

## Usage

```bash
grspec validate [name] [--type spec|change] [--json]
```

## Key Behaviors

- **Change Validation** — Checks delta spec format, requirement header uniqueness, section markers (ADDED/MODIFIED/REMOVED/RENAMED)
- **Spec Validation** — Checks requirement/scenario heading format, structural consistency
- **Bulk Validation** — Interactive selection for validating multiple items at once
- **Remediation Guidance** — Each validation error includes a suggested fix
- **JSON Output** — `--json` flag for machine-readable validation results
- **Cross-Platform** — All path checks use `path.join()` for Windows compatibility
