---
type: spec
change: workflow-ux-optimization
created: 2026-06-15
schema: spec-driven
---
## ADDED Requirements

### Requirement: Lifecycle summary on archive

When a change is successfully archived, grspec SHALL display a lifecycle summary that gives the user a sense of completion and situational awareness.

#### Scenario: Archive displays change statistics

- **WHEN** a change is archived successfully
- **THEN** the output SHALL include:
  - Total tasks completed (e.g., "12/12 tasks complete")
  - Number of specs added, modified, or removed
  - Change age (days between creation date in proposal frontmatter and archive date)

#### Scenario: Archive displays next-step awareness

- **WHEN** a change is archived successfully
- **AND** other active changes exist in `grspec/changes/`
- **THEN** the output SHALL list remaining active change names with their task progress

#### Scenario: Archive with no remaining changes

- **WHEN** a change is archived successfully
- **AND** no other active changes exist
- **THEN** the output SHALL display a clean-slate message (e.g., "No active changes remaining")

### Requirement: Spec impact summary

The archive output SHALL summarize the cumulative effect on the project's spec base.

#### Scenario: Showing spec growth

- **WHEN** archive merges delta specs into main specs
- **THEN** the output SHALL show the total requirement count in each affected spec after merge
