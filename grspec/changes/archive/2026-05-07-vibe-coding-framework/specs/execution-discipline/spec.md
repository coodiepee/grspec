## ADDED Requirements

### Requirement: TDD skill template (grspec-tdd)
Grspec SHALL ship a `grspec-tdd` skill template that implements a RED-GREEN-REFACTOR workflow and SHALL include sections for Iron Law, Red Flags, Rationalization Table, and Verification Gate as normative guardrails.

#### Scenario: TDD template contains cycle and guardrails
- **WHEN** execution discipline skills are generated or installed from grspec
- **THEN** the `grspec-tdd` template SHALL describe RED-GREEN-REFACTOR explicitly
- **AND** SHALL include an Iron Law section
- **AND** SHALL include a Red Flags section
- **AND** SHALL include a Rationalization Table section
- **AND** SHALL include a Verification Gate section

### Requirement: Verification skill template (grspec-verify)
Grspec SHALL provide a `grspec-verify` skill template that requires running project verification commands (tests, linters, or other configured checks as defined by the skill) before marking any task complete or before archiving a change as complete.

#### Scenario: Verify skill mandates commands before completion claims
- **WHEN** a user or agent follows the `grspec-verify` skill to complete work
- **THEN** the skill SHALL instruct that verification commands MUST run with evidence of results
- **AND** SHALL forbid marking tasks or archive completion without successful verification per project conventions

### Requirement: Debugging skill template (grspec-debug)
Grspec SHALL provide a `grspec-debug` skill template that defines systematic debugging in four stages: Reproduce → Isolate → Fix → Verify, and SHALL integrate the anti-rationalization sections (Iron Law, Red Flags, Rationalization Table, Verification Gate).

#### Scenario: Debug template encodes four-stage flow and guardrails
- **WHEN** the `grspec-debug` template is present
- **THEN** it SHALL enumerate Reproduce, Isolate, Fix, and Verify as ordered stages
- **AND** SHALL include Iron Law, Red Flags, Rationalization Table, and Verification Gate sections

### Requirement: Review skill template (grspec-review)
Grspec SHALL provide a `grspec-review` skill template that performs dual-stage code review: first spec compliance, then code quality, and SHALL include Iron Law, Red Flags, Rationalization Table, and Verification Gate sections.

#### Scenario: Review template orders compliance before quality
- **WHEN** the `grspec-review` skill is applied to a change
- **THEN** it SHALL require spec compliance review before code quality review
- **AND** SHALL include Iron Law, Red Flags, Rationalization Table, and Verification Gate sections

### Requirement: Execution discipline skill generation via init tools
When the user runs `grspec init --tools`, grspec SHALL generate all execution discipline skill templates (`grspec-tdd`, `grspec-verify`, `grspec-debug`, `grspec-review`) into each selected tool’s appropriate skills directory (for example `.cursor/skills/` for Cursor).

#### Scenario: Init tools writes all four skills to tool paths
- **WHEN** the user runs `grspec init --tools` and selects tooling surfaces that support skills directories
- **THEN** grspec SHALL emit `grspec-tdd`, `grspec-verify`, `grspec-debug`, and `grspec-review` artifacts into the effective paths for those tools
- **AND** SHALL not omit any of the four execution discipline skills unless the tool surface explicitly does not support that artifact type (in which case grspec SHALL report the omission)

### Requirement: Anti-rationalization sections in execution discipline skills
Each execution discipline skill template (`grspec-tdd`, `grspec-verify`, `grspec-debug`, `grspec-review`) MUST include explicit sections titled or clearly labeled for Iron Law, Red Flags, Rationalization Table, and Verification Gate.

#### Scenario: Lint or validate rejects skills missing guardrail sections
- **WHEN** grspec validates packaged or generated execution discipline skills
- **AND** any required skill is missing one of the four guardrail sections
- **THEN** validation SHALL fail or regeneration SHALL be required
- **AND** SHALL name the missing section
