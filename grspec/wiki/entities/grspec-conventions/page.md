---
title: "grspec Conventions"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/grspec-conventions/spec.md
related:
  - "[[spec-driven-workflow]]"
  - "[[delta-specs]]"
  - "[[cross-platform-paths]]"
---

# grspec Conventions

The meta-specification that defines how system capabilities are documented, how changes are proposed and tracked, and how specifications evolve over time.

## Key Conventions

### Spec Format
- Requirements use `### Requirement: [Name]` headers (unique per spec)
- Scenarios use `#### Scenario: [Description]` with bold WHEN/THEN/AND/GIVEN keywords
- Behavior-first: specs capture verifiable behavior contracts, not implementation details
- Progressive rigor: keep specs lightweight for routine changes, increase detail for high-risk changes

### Change Storage
- Delta-based: changes store only ADDED/MODIFIED/REMOVED/RENAMED requirements (see [[delta-specs]])
- Header-based matching for programmatic merge
- Proposals use explicit from/to comparisons for each behavioral change

### CLI Structure
- Verb-noun pattern: verbs as top-level commands, nouns as arguments/flags
- Backward compatibility for legacy noun-prefixed commands with deprecation warnings

### Project Structure
- `grspec/` root with `specs/`, `changes/`, `changes/archive/` directories
- Optional `constitution.md` and `domain-model.md` at `grspec/`
- Config at `grspec/grspec.yaml`
- Flat spec structure (no nesting under `specs/`)

### Capability Naming
- Verb-noun patterns (e.g., `user-auth`, `payment-capture`)
- Hyphenated lowercase, singular focus, no nesting
