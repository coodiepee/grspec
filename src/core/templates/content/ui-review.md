Agent-driven UX quality review combining static analysis with semantic understanding.

**Use when** reviewing UI code for quality, accessibility, or design compliance — especially when static checks alone are insufficient.

---

## When to Use

| Situation | Use This Skill |
|-----------|---------------|
| PR review with UI changes | Yes — full audit |
| Pre-delivery quality check | Yes — checklist + semantic |
| Accessibility audit | Yes — beyond contrast/alt-text |
| Design system compliance | Yes — token usage, spacing |
| Quick static check only | Run `grspec ui review <path>` directly |

## Workflow

### 1. Run Static Analysis First

```bash
grspec ui review <path> [--platform web|app|both] [--json]
```

Automated checks include:
- `cursor-pointer` on clickable elements (CRITICAL)
- Emoji used as icons (HIGH)
- Transition timing > 500ms (MEDIUM)
- Animation without `prefers-reduced-motion` (CRITICAL)

### 2. Load Relevant Rules

```bash
grspec ui rules --platform <web|app> --checklist
grspec ui rules "Forms & Feedback" --checklist
```

### 3. Semantic Review

Beyond regex — check hierarchy, affordance, loading/empty/error states, focus management, platform patterns.

### 4. Design-system token note

When change-level or project-level MASTER exists, note in the report: **Design-system available for token verification** — cross-check colors, typography, and spacing against MASTER.md.

### 5. Generate Report

Structure findings by severity (CRITICAL / HIGH / MEDIUM) and list passed categories.

## Workflow integration

- **Apply**: run after each UI task when apply JSON has `effectiveUiActive: true` or `contextFiles.ui` is present.
- **Verify**: Step 8 UI Quality uses the same static command; this skill adds semantic depth.

## Related

- `/grsx-ui-rules` — category checklists
- `/grsx-ui-reference` — style token specs
- `/grsx-ui-status` — active design system path
