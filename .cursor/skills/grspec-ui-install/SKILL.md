---
name: grspec-ui-install
description: Export grspec UI skill content to other AI platforms. Use when setting up UI intelligence outside Cursor.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

Export grspec UI sub-skills to other AI platforms (Windsurf, Copilot, Claude, etc.).

**Use when** the user wants UI intelligence available outside Cursor.

---

## CLI

```bash
grspec ui install --platform <name>
grspec ui install --platform <name> --all
grspec ui install --list
```

Default bundle: `grspec-ui-init`, `grspec-ui-design-system`, `grspec-ui-review`.
`--all` exports all ten `grspec-ui-*` sub-skills.

## Agent workflow

1. If platform unknown, run `--list` and let the user pick.
2. Run `install --platform <name>` (add `--all` when full export is needed).
3. Report each output path.
4. Remind user to sync upstream data periodically with `/grsx-ui-sync`.

## Related

- `/grsx-ui-sync` — update bundled UI datasets
