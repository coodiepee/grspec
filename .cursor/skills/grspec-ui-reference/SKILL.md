---
name: grspec-ui-reference
description: View full design specifications for a named style. Use when you need token and component detail for a chosen style.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

View full design specifications for a named style from the design dataset (philosophy, tokens, components, code hints).

**Use when** you know the style name (from design-system output or user choice) and need implementation-level detail.

---

## CLI

```bash
grspec ui reference <style-name>
grspec ui reference --list
grspec ui reference --search <query>
```

Add `--json` when parsing programmatically.

## Agent workflow

1. If style name is unknown, run `grspec ui reference --search "<keywords>"` or `--list`.
2. Load the full spec for the chosen style.
3. Extract tokens (colors, typography, spacing, components) relevant to the current task.
4. Embed key decisions in `design.md` or implementation PR description.

## Related

- `/grsx-ui-design-system` — pick and persist a style for the project
- `/grsx-ui-search --domain style` — compare alternative styles
