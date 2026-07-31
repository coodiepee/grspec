---
title: "Context Injection (Entity)"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/context-injection/spec.md
  - src/core/artifact-graph/instruction-loader.ts
related:
  - "[[instruction-loader]]"
  - "[[config-loading]]"
  - "[[rules-injection]]"
---

# Context Injection

Implements the context injection behavior described in the [[context-injection]] concept page. The implementation lives in the instruction loader module, which reads the `context` field from `grspec.yaml` and wraps it in `<context>` XML-style tags before the template content.

## Key Guarantees

- Content preserved exactly (no escaping, no transformation)
- Multi-line strings maintain line breaks
- Context appears before template in all artifact instructions
- Missing or undefined context is silently skipped
