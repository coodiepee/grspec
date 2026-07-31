---
type: spec
change: ui-artifact-workflow
created: 2026-06-30
schema: spec-driven
---
## REMOVED Requirements

### Requirement: Design instruction enrichment when UI detected

### Requirement: UI enrichment does not block artifact creation

## ADDED Requirements

### Requirement: Design phase does not inject UI enrichment via metadata alone
The design artifact workflow SHALL NOT inject UI enrichment solely from legacy `ui-detected` metadata. UI concern for new changes SHALL be expressed via schema v2 `ui` artifact / structured `ui` metadata (see ui-metadata-schema and ui-artifact).

#### Scenario: No design enrichment from ui-detected alone
- **WHEN** a change has only flat `ui-detected: true` without a v2 `ui` artifact path
- **THEN** design instruction generation SHALL NOT require UI enrichment as a blocking step
