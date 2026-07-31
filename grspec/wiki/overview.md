---
title: "grspec Wiki Overview"
type: overview
created: 2026-05-22
updated: 2026-05-22
---

# grspec Wiki Overview

grspec is a specification management CLI for AI-assisted software development. It provides a structured workflow for proposing, designing, implementing, and archiving changes — with behavioral specifications as the source of truth. The tool generates skills and commands for 25+ AI coding assistants, enabling consistent development practices across tools.

## Project Identity

- **Language**: TypeScript (ESM)
- **Runtime**: Node.js (≥20.19.0)
- **Package Manager**: pnpm
- **CLI Framework**: Commander.js
- **Test Framework**: Vitest

## Architecture

grspec is organized around five bounded contexts:

1. **CLI Interface** — User-facing command parsing and execution (`src/cli/`, `src/commands/`)
2. **Artifact Workflow** — Change lifecycle management with schema-driven dependency graphs (`src/core/artifact-graph/`)
3. **Template System** — Skill/command generation for AI tools via adapter pattern (`src/core/command-generation/`, `src/core/templates/`)
4. **Spec Management** — Behavioral specifications with delta-based change tracking (`src/core/parsers/`, `src/core/specs-apply.ts`)
5. **Configuration** — Project and global config management (`src/core/project-config.ts`, `src/core/global-config.ts`)

## Key Concepts

- [[spec-driven-workflow]] — The propose → design → specs → plan → apply → archive lifecycle
- [[artifact-graph]] — DAG-based dependency model for artifacts
- [[delta-specs]] — Incremental spec changes using ADDED/MODIFIED/REMOVED/RENAMED sections
- [[template-system]] — Multi-tool skill/command generation
- [[profile-tiers]] — Four-tier workflow profile system
- [[context-injection]] — Project context injection into AI instructions
- [[llm-wiki]] — This navigable knowledge base

## Foundation Documents

This wiki builds on two anchor documents:

- `grspec/constitution.md` — Project identity, architecture principles, coding standards, team agreements
- `grspec/domain-model.md` — Bounded contexts, context map, ubiquitous language

## Wiki Structure

| Directory | Content | Pages |
|-----------|---------|-------|
| `concepts/` | Architecture concepts, design patterns | 10 |
| `entities/` | Modules, commands, skills, services | 50 |
| `sources/` | Change summaries, project history | 2 |
| `comparisons/` | Tradeoff analyses | 2 |
