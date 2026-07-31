# explore-crystallization Specification

## Purpose
Detect when an explore conversation has converged to actionable intent and offer to transition to a formal change proposal, bridging free-form thinking with structured workflow.
## Requirements
### Requirement: Crystallization readiness detection

The explore skill SHALL detect when an exploration conversation has converged to actionable intent and offer to transition to a formal change proposal.

#### Scenario: All crystallization criteria met

- **WHEN** the explore conversation has established:
  - A clear goal (what the user wants to achieve)
  - A directional approach (at least one viable technical path)
  - A bounded scope (what is and isn't included)
- **THEN** the agent SHALL surface a structured summary of the crystallized intent
- **AND** SHALL offer to create a change proposal from the summary

#### Scenario: Partial crystallization

- **WHEN** the explore conversation has established some but not all crystallization criteria
- **THEN** the agent SHALL note which criteria remain open
- **AND** SHALL ask clarifying questions to resolve the gaps
- **AND** SHALL NOT offer to transition to a proposal

#### Scenario: User declines proposal transition

- **WHEN** crystallization criteria are met
- **AND** the agent offers to create a proposal
- **AND** the user declines
- **THEN** the agent SHALL continue exploration without repeating the offer until new significant information emerges

### Requirement: Crystallization summary format

When crystallization is detected, the summary SHALL follow a consistent structure so the user can validate before committing.

#### Scenario: Summary structure

- **WHEN** the agent presents a crystallization summary
- **THEN** the summary SHALL include:
  - **Goal**: One sentence describing the desired outcome
  - **Approach**: The chosen technical direction (1-3 bullets)
  - **Scope**: What is included and explicitly excluded
  - **Open questions**: Any remaining unknowns (may be empty)

