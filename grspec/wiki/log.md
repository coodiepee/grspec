---
title: "Wiki Log"
type: log
created: 2026-05-22
updated: 2026-05-22
---

# Wiki Log

Append-only operation timeline for the grspec wiki.

## [2026-05-22] init | Full wiki build from codebase

- **Operation**: `/grsx-wiki-init`
- **Pages created**: 64
  - `concepts/`: 10 pages
  - `entities/`: 50 pages (38 primary + 12 spec-coverage bridges)
  - `sources/`: 2 pages
  - `comparisons/`: 2 pages
- **Structural files**: overview.md, index.md, log.md
- **Sources scanned**: grspec/constitution.md, grspec/domain-model.md, grspec/grspec.yaml, 46 specs, 85 archived changes, src/ (134 TypeScript files)

## 2026-07-31 — grspec-identity-cleanup

- Main specs/wiki product language normalized to grspec (OpenSpec upstream credit kept in README)
- Closed marker-era legacy-cleanup; removed deprecated change show/list/validate and spec CLI trees; plan.md-only progress; profile core rejected
- Dead modules removed (feedback-loop, coordination, profile-hint, git helpers)
