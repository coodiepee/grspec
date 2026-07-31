---
title: "Workspace Foundation"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/workspace-foundation/spec.md
  - src/core/workspace/foundation.ts
  - src/core/workspace/index.ts
related:
  - "[[grspec-conventions]]"
  - "[[cli-init]]"
---

# Workspace Foundation

Workspaces provide a coordination layer for planning across multiple repos or folders. A workspace is a durable planning home that can hold multiple changes over time.

## Identity

Workspaces are identified by `.grspec-workspace/workspace.yaml` containing a stable folder-style name. This file distinguishes a workspace from a regular repo-local grspec project.

## Key Concepts

- **Workspace vs Repo-Local** — Workspaces coordinate across repos; repo-local `grspec/` directories manage individual repos
- **Shared vs Local State** — Workspace-level changes live in the workspace's `changes/` directory; repo-specific specs stay in each repo's `grspec/specs/`
- **Managed Storage** — Workspaces use a managed storage directory for workspace-wide state
- **Local Registry** — Workspace names are tracked in a local registry for discovery

## Name Validation

Workspace names must be valid folder names: no empty strings, no `.` or `..`, no path separators. Invalid names are rejected at creation time with clear error messages.
