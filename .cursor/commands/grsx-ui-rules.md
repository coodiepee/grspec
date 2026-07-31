---
name: /grsx-ui-rules
id: grsx-ui-rules
category: design
description: "Query structured UI/UX rules with platform, severity, and checklist filters. Use during implementation and review for compliance guidance."
---

Query structured UI/UX rules (205 rules across 10 categories) with platform and severity filters.

**Use when** you need checklists, compliance guidance, or targeted rule lookup during implementation or review.

---

## CLI

```bash
grspec ui rules [category] [--platform web|app|both] [--severity CRITICAL|HIGH|MEDIUM] [--search <query>] [--checklist] [--json]
```

Categories include: Accessibility, Touch & Interaction, Performance, Style Selection, Layout & Responsive, Typography & Color, Animation, Forms & Feedback, Navigation Patterns, Charts & Data.

## Common patterns

```bash
grspec ui rules --platform web --checklist
grspec ui rules Accessibility --checklist
grspec ui rules --severity CRITICAL --platform app
grspec ui rules --search "hover"
```

## Agent workflow

1. Identify platform (web vs app) and task type (forms, nav, animation, etc.).
2. Run with `--checklist` for a review-ready list, or `--search` for a specific concern.
3. Map CRITICAL/HIGH rules to implementation tasks or verification findings.
4. During apply on UI-active changes, CRITICAL rules may already be inlined in apply instructions — use this for deeper category passes.

## Related

- `/grsx-ui-review` — static + semantic audit on code paths
- `/grsx-ui-search --domain ux` — exploratory UX guidance from the knowledge base
