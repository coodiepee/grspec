---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## REMOVED Requirements

### Requirement: Design-system directory convention
**Reason**: Replaced by `grspec/ui/` (project) and `change/ui/pages/` (change) with formal `ui` artifact.
**Migration**: Use `grspec ui init` for project MASTER; use ui artifact phase for change pages.

### Requirement: Design-system is not a schema artifact
**Reason**: Superseded by `ui` artifact in spec-driven v2; `ui.md` is the schema artifact, `ui/pages/` is persist output.
**Migration**: v2 changes require `ui.md`; v1 graph unchanged until manual upgrade.
