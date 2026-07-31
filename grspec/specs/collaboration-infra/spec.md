# collaboration-infra Specification

## Purpose
Define collaboration infrastructure skill templates (`grspec-parallel` and `grspec-subagent`) for dispatching parallel work and delegating to subagents, including model selection guidance and git worktree isolation patterns.

## Requirements
### Requirement: Parallel dispatch skill template (grspec-parallel)

Grspec SHALL provide a `grspec-parallel` skill template for dispatching independent tasks in parallel, grouped by bounded context, so that work partitioning aligns with domain boundaries. This skill SHALL be installed only when the active profile is `full` or `custom` (with `parallel` listed).

#### Scenario: Parallel skill installed for full profile

- **WHEN** the `grspec-parallel` template is generated during `grspec init --tools`
- **AND** the active profile is `full`
- **THEN** it SHALL instruct how to identify independent task bundles
- **AND** SHALL require grouping parallel work by bounded context where applicable
- **AND** SHALL describe coordination and merge expectations at a high level

#### Scenario: Parallel skill not installed for standard profile

- **WHEN** the active profile is `standard`
- **THEN** grspec SHALL NOT generate the `grspec-parallel` skill template

### Requirement: Subagent skill template (grspec-subagent)

Grspec SHALL provide a `grspec-subagent` skill template for delegating individual tasks to isolated subagents, including guardrails for scope, handoff, and completion checks. This skill SHALL be installed only when the active profile is `full` or `custom` (with `subagent` listed).

#### Scenario: Subagent skill installed for full profile

- **WHEN** the `grspec-subagent` template is generated during `grspec init --tools`
- **AND** the active profile is `full`
- **THEN** it SHALL describe how to spin off or assign a single task to an isolated subagent
- **AND** SHALL require explicit task boundaries and acceptance criteria

#### Scenario: Subagent skill not installed for standard profile

- **WHEN** the active profile is `standard`
- **THEN** grspec SHALL NOT generate the `grspec-subagent` skill template

### Requirement: Collaboration config keys scope

The `collaboration` section in `grspec.yaml` (`parallel-strategy`, `worktree`, `model-selection`) SHALL be marked as reserved for future use. The CLI SHALL parse these keys without error but SHALL NOT consume them for any runtime behavior.

#### Scenario: Collaboration keys parsed without error

- **WHEN** `grspec.yaml` contains a `collaboration` section with any of `parallel-strategy`, `worktree`, or `model-selection`
- **THEN** grspec SHALL parse the config without warnings or errors
- **AND** SHALL NOT use these values to alter any CLI command behavior

#### Scenario: Collaboration keys absence causes no error

- **WHEN** `grspec.yaml` does not contain a `collaboration` section
- **THEN** grspec SHALL function normally without any degradation

### Requirement: Model selection guidance in skill templates
Collaboration and execution-related skill templates (including at least `grspec-parallel` and `grspec-subagent`) SHALL include model selection recommendations categorized as cheap, standard, and capable — mapped to task strategy (for example exploratory vs. high-risk vs. mechanical) so users can pick models consistently.

#### Scenario: Skills map task strategy to model tier
- **WHEN** a user reads the collaboration skill templates shipped by grspec
- **THEN** each applicable template SHALL state when to prefer cheap, standard, or capable models
- **AND** SHALL tie recommendations to task strategy labels or examples used in the skill

### Requirement: Git worktree guidance in skill templates
Collaboration skill templates SHALL include guidance for using git worktrees to isolate concurrent or parallel streams of work, including when to prefer a worktree over a single working directory.

#### Scenario: Parallel and subagent skills mention worktree isolation
- **WHEN** the user applies `grspec-parallel` or `grspec-subagent` guidance for concurrent work
- **THEN** the skill SHALL reference git worktree as the preferred isolation mechanism where appropriate
- **AND** SHALL list minimal prerequisites (e.g., branch naming, base branch sync) necessary for safe parallel work
