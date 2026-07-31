---
name: /grsx-ui-detect
id: grsx-ui-detect
category: design
description: Detect UI content in a grspec change and write structured ui metadata. Use for catch-up or manual UI concern activation.
---

Detect UI content in a grspec change and write structured metadata to `.grspec.yaml`.

**Use when** propose/ff/continue catch-up needs UI activation, or the user wants to flag UI work on a change.

---

## CLI

```bash
grspec ui detect --change "<name>" --json
```

## Agent workflow

1. Run detect after proposal is created (propose/ff) or during continue catch-up when proposal is `done` and no `ui` metadata exists.
2. When `detected: true`, write:
   ```yaml
   ui:
     detected: true
     keywords: [<from JSON>]
   ```
3. Do NOT run `grspec ui design-system --persist` during propose, ff, or continue catch-up.

## Workflow integration

- **Propose / ff**: detection step after proposal artifact
- **Continue**: catch-up when proposal `done` and no structured `ui:` block
- **Gates**: formal `ui.md` Status is authoritative; write structured `ui.detected` metadata only

## Related

- `/grsx-ui-design-system` — generate page overrides during ui artifact work
- `/grsx-ui-init` — project foundation at `grspec/ui/MASTER.md`
