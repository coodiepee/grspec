# normative-terminology Specification

## Purpose
Govern the use of RFC 2119 normative language (SHALL, SHOULD, MAY) in design and plan artifact templates and schema instructions.
## Requirements
### Requirement: Normative vocabulary in design template
The `design.md` schema instruction SHALL include guidance to use RFC 2119 normative keywords (SHALL, SHOULD, MAY, MUST, MUST NOT) when documenting architectural decisions and constraints.

#### Scenario: Design instruction includes normative guidance
- **WHEN** the schema instruction for the `design` artifact is read from `schema.yaml`
- **THEN** it SHALL contain text instructing the author to use SHALL for binding decisions, SHOULD for recommendations, and MAY for optional approaches

#### Scenario: Design template comments reference normative terms
- **WHEN** the `design.md` template file is read
- **THEN** the Decisions section comment SHALL reference normative vocabulary as the expected phrasing for architectural choices

### Requirement: Normative vocabulary scope exclusions
The `proposal.md` template and schema instruction SHALL NOT require normative terminology, because proposals are exploratory documents that describe intent rather than binding requirements.

#### Scenario: Proposal instruction does not mandate normative terms
- **WHEN** the schema instruction for the `proposal` artifact is read
- **THEN** it SHALL NOT contain instructions to use SHALL/MUST/SHOULD/MAY as normative keywords

### Requirement: Plan instruction normative note
The `plan.md` schema instruction SHALL include a note that task descriptions SHOULD use imperative mood (e.g. "Create module X" rather than "Module X should be created").

#### Scenario: Plan instruction includes imperative mood guidance
- **WHEN** the schema instruction for the `plan` artifact is read from `schema.yaml`
- **THEN** it SHALL contain guidance recommending imperative mood for task descriptions

