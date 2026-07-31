---
name: grspec-ui-search
description: Search the grspec UI/UX knowledge base by domain or stack. Use when exploring styles, colors, typography, UX patterns, or stack-specific guidance.
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "1.0"
  generatedBy: "0.7.0"
---

Search the grspec UI/UX knowledge base (styles, colors, typography, UX, charts, landing, product patterns).

**Use when** you need domain-specific design guidance without generating a full design system.

---

## CLI

```bash
grspec ui search "<query>" [--domain <domain>] [--stack <stack>] [-n <max>] [--json]
grspec ui domains    # list domains
grspec ui stacks     # list stacks
```

Prefer `--json` for agent parsing.

## Domains

| Need | `--domain` | Example query |
|------|------------|---------------|
| Product patterns | `product` | `entertainment social` |
| Styles | `style` | `glassmorphism dark` |
| Colors | `color` | `fintech trustworthy` |
| Typography | `typography` | `playful modern` |
| Charts | `chart` | `real-time dashboard` |
| UX guidelines | `ux` | `animation accessibility` |
| Landing structure | `landing` | `hero social-proof` |
| Web a11y/layout | `web` | `touch safe-areas` |
| React perf | `react` | `rerender memo list` |

## Stack search

```bash
grspec ui search "<keyword>" --stack nextjs
```

Stacks include: react, nextjs, vue, svelte, astro, swiftui, react-native, flutter, nuxtjs, shadcn, jetpack-compose, threejs, angular, laravel, and more (`grspec ui stacks`).

## Agent workflow

1. Clarify product type, audience, and style keywords from the user request.
2. Run search with the most specific domain first; use `--json`.
3. Synthesize top results into actionable recommendations (tokens, patterns, pitfalls).
4. For full project setup, suggest `/grsx-ui-design-system` or `/grsx-ui-init`.

## Related

- `/grsx-ui-design-system` — full design system generation
- `/grsx-ui-reference` — deep-dive a named style spec
- `/grsx-ui-rules` — structured rule checklists
