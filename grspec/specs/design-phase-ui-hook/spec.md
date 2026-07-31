# design-phase-ui-hook Specification

## Purpose
Enrich the design artifact instruction with UI design-system guidance — either referencing an already-generated design system or recommending generation when UI content is detected in the proposal.
## Requirements
### Requirement: Design phase does not inject UI enrichment via metadata alone
The design artifact workflow SHALL NOT inject UI enrichment solely from legacy `ui-detected` metadata. UI concern for new changes SHALL be expressed via schema v2 `ui` artifact / structured `ui` metadata (see ui-metadata-schema and ui-artifact).

#### Scenario: No design enrichment from ui-detected alone
- **WHEN** a change has only flat `ui-detected: true` without a v2 `ui` artifact path
- **THEN** design instruction generation SHALL NOT require UI enrichment as a blocking step

