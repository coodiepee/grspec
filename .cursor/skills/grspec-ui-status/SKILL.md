---
name: grspec-ui-status
description: Show project UI configuration — design-system presence, style, and upstream version. Use before init or when validating token sources.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

Show project UI configuration: design-system presence, style, upstream data version.

**Use when** checking whether a design system exists before init, or before apply/verify token checks.

---

## CLI

```bash
grspec ui status [--json]
```

## Agent workflow

1. Run `grspec ui status --json`.
2. Report: design-system found (path, style), upstream version if present.
3. If missing and user wants setup → `/grsx-ui-init`.
4. If present and user wants audit → `/grsx-ui-review`.

## Related

- `/grsx-ui-init` — create project design system
- `/grsx-ui-design-system` — generate without full init flow
