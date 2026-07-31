---
name: /grsx-wiki-lint
id: grsx-wiki-lint
category: Workflow
description: Run wiki structural and semantic health checks
---

Run structural and semantic checks on the wiki.

1. Run `grspec wiki lint --json` to get structural results.
2. Review structural issues and fix what can be auto-fixed.
3. **Semantic analysis** (LLM-driven):
   - For each wiki page, check if content is consistent with its source files.
   - Check if related pages are mutually consistent.
   - Report any stale or contradictory information.
4. Present consolidated report: structural issues first, then semantic.
