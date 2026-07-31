---
title: "Context Injection"
type: concept
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/context-injection/spec.md
  - src/core/artifact-graph/instruction-loader.ts
  - grspec/specs/rules-injection/spec.md
related:
  - "[[instruction-loader]]"
  - "[[config-loading]]"
  - "[[project-config]]"
  - "[[rules-injection]]"
---

# Context Injection

Context injection is the mechanism by which project-specific context from `grspec.yaml` is inserted into workflow instructions. It ensures that AI agents operating on a project always have relevant project context (tech stack, conventions, constraints) available when generating artifacts.

## How It Works

1. The [[config-loading]] module reads `grspec/grspec.yaml` and extracts the `context` field
2. The [[instruction-loader]] wraps the context in XML-style `<context>` tags
3. The context section is placed before the `<template>` section in generated instructions
4. All artifact instructions (proposal, specs, design, plan) receive the same context

## Format

```
<context>
Tech stack: TypeScript, Node.js (≥20.19.0), ESM modules
Package manager: pnpm
CLI framework: Commander.js
</context>

<template>
... artifact-specific instructions ...
</template>
```

## Preservation Guarantees

Context content is injected without modification:

- Special characters (`<`, `>`, `&`, quotes) are preserved as-is
- URLs are not escaped or transformed
- Markdown formatting is not rendered or stripped
- Multi-line strings preserve their line breaks

## Rules Injection

In addition to project context, per-artifact rules from the `rules` section of `grspec.yaml` are injected into instructions (see [[rules-injection]]). Rules are scoped to artifact types (specs, tasks, design) and provide behavioral constraints for AI agents working on those specific artifacts.
