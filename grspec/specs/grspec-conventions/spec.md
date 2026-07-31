# grspec Conventions Specification

## Purpose

grspec conventions SHALL define how system capabilities are documented, how changes are proposed and tracked, and how specifications evolve over time. This meta-specification serves as the source of truth for grspec's own conventions.

## Requirements

### Requirement: Structured conventions for specs and changes

grspec conventions SHALL mandate a structured spec format with clear requirement and scenario sections so tooling can parse consistently.

#### Scenario: Following the structured spec format
- **WHEN** writing or updating grspec specifications
- **THEN** authors SHALL use `### Requirement: ...` followed by at least one `#### Scenario: ...` section

### Requirement: Behavior-First Specification Boundary

grspec specifications SHALL capture verifiable behavior contracts and avoid internal implementation detail.

#### Scenario: Writing behavior requirements
- **WHEN** documenting a capability in `spec.md`
- **THEN** requirements SHALL describe observable behavior with SHALL/MUST language
- **AND** SHALL NOT prescribe internal module layout unless that layout is itself the product contract

### Requirement: Project directory structure

A grspec project SHALL maintain a consistent directory structure for specifications and changes.

#### Scenario: Initialized project layout
- **WHEN** a grspec project is initialized
- **THEN** it SHALL provide a `grspec/` directory containing at least `specs/` and `changes/`

### Requirement: Verb-first CLI design

grspec CLI design SHALL use verbs as top-level commands with nouns provided as arguments or flags for scoping.

#### Scenario: Verb-first listing and validation
- **WHEN** a user runs commands such as `grspec list` or `grspec validate --changes`
- **THEN** those verb-first forms SHALL be the supported primary interface for list/show/validate

#### Scenario: Retired duplicate noun commands
- **WHEN** documenting or shipping the supported CLI surface
- **THEN** duplicate `grspec change show|list|validate` and the `grspec spec` tree SHALL NOT be part of the supported surface
- **AND** stacking helpers under `grspec change` (`overlap`, `graph`, `next`, `split`) MAY remain until promoted to verb-first homes

### Requirement: Progressive Rigor
grspec conventions SHALL keep specs lightweight by default and scale rigor only when risk or coordination complexity demands it.

#### Scenario: Routine change specification
- **WHEN** a change is local and low-risk
- **THEN** authors use concise, behavior-first requirements with minimal ceremony

#### Scenario: High-risk or cross-boundary change specification
- **WHEN** a change is cross-team, cross-repo, API-contract breaking, migration-heavy, or security/privacy sensitive
- **THEN** authors increase detail and explicit validation expectations proportionally

### Requirement: Project Structure
An grspec project SHALL maintain a consistent directory structure for specifications and changes.

#### Scenario: Initializing project structure
- **WHEN** an grspec project is initialized
- **THEN** it SHALL have this structure:
```
grspec/
├── project.md              # Project-specific context
├── AGENTS.md               # AI assistant instructions
├── specs/                  # Current deployed capabilities
│   └── [capability]/       # Single, focused capability
│       ├── spec.md         # WHAT and WHY
│       └── design.md       # HOW (optional, for established patterns)
└── changes/                # Proposed changes
    ├── [change-name]/      # Descriptive change identifier
    │   ├── proposal.md     # Why, what, and impact
    │   ├── tasks.md        # Implementation checklist
    │   ├── design.md       # Technical decisions (optional)
    │   └── specs/          # Complete future state
    │       └── [capability]/
    │           └── spec.md # Clean markdown (no diff syntax)
    └── archive/            # Completed changes
        └── YYYY-MM-DD-[name]/
```

### Requirement: Structured Format for Behavioral Specs

Behavioral specifications SHALL use a structured format with consistent section headers and keywords to ensure visual consistency and parseability.

#### Scenario: Writing requirement sections

- **WHEN** documenting a requirement in a behavioral specification
- **THEN** use a level-3 heading with format `### Requirement: [Name]`
- **AND** immediately follow with a SHALL statement describing core behavior
- **AND** keep requirement names descriptive and under 50 characters

#### Scenario: Documenting scenarios

- **WHEN** documenting specific behaviors or use cases
- **THEN** use level-4 headings with format `#### Scenario: [Description]`
- **AND** use bullet points with bold keywords for steps:
  - **GIVEN** for initial state (optional)
  - **WHEN** for conditions or triggers
  - **THEN** for expected outcomes
  - **AND** for additional outcomes or conditions

#### Scenario: Adding implementation details

- **WHEN** a step requires additional detail
- **THEN** use sub-bullets under the main step
- **AND** maintain consistent indentation
  - Sub-bullets provide examples or specifics
  - Keep sub-bullets concise

### Requirement: Header-Based Requirement Identification

Requirement headers SHALL serve as unique identifiers for programmatic matching between current specs and proposed changes.

#### Scenario: Matching requirements programmatically

- **WHEN** processing delta changes
- **THEN** use the `### Requirement: [Name]` header as the unique identifier
- **AND** match using normalized headers: `normalize(header) = trim(header)`
- **AND** compare headers with case-sensitive equality after normalization

#### Scenario: Handling requirement renames

- **WHEN** renaming a requirement
- **THEN** use a special `## RENAMED Requirements` section
- **AND** specify both old and new names explicitly:
  ```markdown
  ## RENAMED Requirements
  - FROM: `### Requirement: Old Name`
  - TO: `### Requirement: New Name`
  ```
- **AND** if content also changes, include under MODIFIED using the NEW header

#### Scenario: Validating header uniqueness

- **WHEN** creating or modifying requirements
- **THEN** ensure no duplicate headers exist within a spec
- **AND** validation tools SHALL flag duplicate headers as errors

### Requirement: Change Storage Convention

Change proposals SHALL store only the additions, modifications, and removals to specifications, not complete future states.

#### Scenario: Creating change proposals with additions

- **WHEN** creating a change proposal that adds new requirements
- **THEN** include only the new requirements under `## ADDED Requirements`
- **AND** each requirement SHALL include its complete content
- **AND** use the standard structured format for requirements and scenarios

#### Scenario: Creating change proposals with modifications  

- **WHEN** creating a change proposal that modifies existing requirements
- **THEN** include the modified requirements under `## MODIFIED Requirements`
- **AND** use the same header text as in the current spec (normalized)
- **AND** include the complete modified requirement (not a diff)
- **AND** optionally annotate what changed with inline comments like `← (was X)`

#### Scenario: Creating change proposals with removals

- **WHEN** creating a change proposal that removes requirements
- **THEN** list them under `## REMOVED Requirements`
- **AND** use the normalized header text for identification
- **AND** include reason for removal
- **AND** document any migration path if applicable

The `changes/[name]/specs/` directory SHALL contain:
- Delta files showing only what changes
- Sections for ADDED, MODIFIED, REMOVED, and RENAMED requirements
- Normalized header matching for requirement identification
- Complete requirements using the structured format
- Clear indication of change type for each requirement

#### Scenario: Using standard output symbols

- **WHEN** displaying delta operations in CLI output
- **THEN** use these standard symbols:
  - `+` for ADDED (green)
  - `~` for MODIFIED (yellow)
  - `-` for REMOVED (red)
  - `→` for RENAMED (cyan)

### Requirement: Archive Process Enhancement

The archive process SHALL programmatically apply delta changes to current specifications using header-based matching.

#### Scenario: Archiving changes with deltas

- **WHEN** archiving a completed change
- **THEN** the archive command SHALL:
  1. Parse RENAMED sections first and apply renames
  2. Parse REMOVED sections and remove by normalized header match
  3. Parse MODIFIED sections and replace by normalized header match (using new names if renamed)
  4. Parse ADDED sections and append new requirements
- **AND** validate that all MODIFIED/REMOVED headers exist in current spec
- **AND** validate that ADDED headers don't already exist
- **AND** generate the updated spec in the main specs/ directory

#### Scenario: Handling conflicts during archive

- **WHEN** delta changes conflict with current spec state
- **THEN** the archive command SHALL report specific conflicts
- **AND** require manual resolution before proceeding
- **AND** provide clear guidance on resolving conflicts

### Requirement: Proposal Format

Proposals SHALL explicitly document all changes with clear from/to comparisons.

#### Scenario: Documenting changes

- **WHEN** documenting what changes
- **THEN** the proposal SHALL explicitly describe each change:

```markdown
**[Section or Behavior Name]**
- From: [current state/requirement]
- To: [future state/requirement]
- Reason: [why this change is needed]
- Impact: [breaking/non-breaking, who's affected]
```

This explicit format compensates for not having inline diffs and ensures reviewers understand exactly what will change.

### Requirement: Change Review

The system SHALL support multiple methods for reviewing proposed changes.

#### Scenario: Reviewing changes

- **WHEN** reviewing proposed changes
- **THEN** reviewers can compare using:
- GitHub PR diff view when changes are committed
- Command line: `diff -u specs/[capability]/spec.md changes/[name]/specs/[capability]/spec.md`
- Any visual diff tool comparing current vs future state

### Requirement: Structured Format Adoption

Behavioral specifications SHALL adopt the structured format with `### Requirement:` and `#### Scenario:` headers as the default.

#### Scenario: Use structured headings for behavior

- **WHEN** documenting behavioral requirements
- **THEN** use `### Requirement:` for requirements
- **AND** use `#### Scenario:` for scenarios with bold WHEN/THEN/AND keywords

### Requirement: Verb–Noun CLI Command Structure
grspec CLI design SHALL use verbs as top-level commands with nouns provided as arguments or flags for scoping.

#### Scenario: Verb-first command discovery
- **WHEN** a user runs a command like `grspec list`
- **THEN** the verb communicates the action clearly
- **AND** nouns refine scope via flags or arguments (e.g., `--changes`, `--specs`)

#### Scenario: Backward compatibility for noun commands
- **WHEN** users run noun-prefixed commands such as `grspec spec ...` or `grspec change ...`
- **THEN** the CLI SHALL continue to support them for at least one release
- **AND** display a deprecation warning that points to verb-first alternatives

#### Scenario: Disambiguation guidance
- **WHEN** item names are ambiguous between changes and specs
- **THEN** `grspec show` and `grspec validate` SHALL accept `--type spec|change`
- **AND** the help text SHALL document this clearly

### Requirement: Workspace Product Language
grspec conventions SHALL describe coordination workspaces in user-facing product terms.

#### Scenario: Describing workspace structure
- **WHEN** grspec documentation describes workspace support
- **THEN** it SHALL present a workspace as the planning home for work across linked repos or folders
- **AND** it SHALL describe `changes/` as the workspace planning area

#### Scenario: Avoiding internal workspace vocabulary
- **WHEN** grspec documentation explains what a workspace includes
- **THEN** it SHALL prefer plain product language such as "repos or folders"
- **AND** it SHALL avoid user-facing reliance on terms such as "working set", "code area", "entry", "alias", or "local overlay"

#### Scenario: Distinguishing workspaces from changes
- **WHEN** grspec documentation explains workspace planning
- **THEN** it SHALL describe a workspace as a durable planning home
- **AND** it SHALL describe individual features, fixes, and projects as changes inside the workspace

#### Scenario: Distinguishing workspace and repo-local surfaces
- **WHEN** grspec documentation compares workspace and repo-local flows
- **THEN** it SHALL explain that workspace planning lives in the workspace folder
- **AND** it SHALL explain that repo-local specs and changes continue to live under each repo's `grspec/` directory

#### Scenario: Sequencing the workspace roadmap
- **WHEN** workspace reimplementation work is split across multiple active changes
- **THEN** conventions SHALL allow those changes to remain flat siblings under `grspec/changes/`
- **AND** dependency order MAY be documented in proposal prose until formal change stacking metadata is available

### Requirement: Constitution file

The grspec project directory SHALL support an optional `constitution.md` file at `grspec/constitution.md`.

#### Scenario: Optional constitution present

- **WHEN** a grspec project includes `grspec/constitution.md`
- **THEN** tooling and documentation SHALL treat it as an optional project-level constitution artifact
- **AND** the file MAY be absent without invalidating the project layout

### Requirement: Domain model file

The grspec project directory SHALL support an optional `domain-model.md` file at `grspec/domain-model.md`.

#### Scenario: Optional domain model present

- **WHEN** a grspec project includes `grspec/domain-model.md`
- **THEN** tooling and documentation SHALL treat it as an optional domain model artifact
- **AND** the file MAY be absent without invalidating the project layout

### Requirement: Project configuration file naming

The project configuration file for grspec SHALL be named `grspec.yaml`, replacing use of `config.yaml` as the canonical project configuration filename.

#### Scenario: Tooling resolves project config

- **WHEN** tooling loads project-level grspec configuration
- **THEN** it SHALL read `grspec/grspec.yaml` as the primary project configuration file
- **AND** it SHALL NOT require `config.yaml` for that purpose

### Requirement: Bounded context change metadata

Each change's `.grspec.yaml` SHALL support optional `context.bounded-contexts` and `context.depends-on-contexts` fields for documenting bounded-context boundaries and dependencies.

#### Scenario: Change declares bounded contexts

- **WHEN** a change directory contains `.grspec.yaml` with `context.bounded-contexts` and/or `context.depends-on-contexts`
- **THEN** validation SHALL accept those optional fields when present
- **AND** tooling MAY surface them for planning and dependency awareness

#### Scenario: Change omits context fields

- **WHEN** `.grspec.yaml` omits `context.bounded-contexts` and `context.depends-on-contexts`
- **THEN** the change SHALL remain valid
- **AND** tooling SHALL behave as if no bounded-context metadata were declared

### Requirement: Stack-Aware Change Planning Conventions
grspec conventions SHALL define optional metadata fields for sequencing and decomposition across concurrent changes.

#### Scenario: Declaring change dependencies
- **WHEN** authors need to sequence related changes
- **THEN** conventions SHALL define how to declare dependencies and provided/required capability markers
- **AND** validation guidance SHALL distinguish hard blockers from soft overlap warnings

#### Scenario: Dependency source of truth during migration
- **WHEN** both stack metadata and `grspec/changes/IMPLEMENTATION_ORDER.md` are present
- **THEN** conventions SHALL treat per-change stack metadata as the normative dependency source
- **AND** `IMPLEMENTATION_ORDER.md` SHALL be treated as optional narrative guidance

#### Scenario: Explicit ordering remains required for capability markers
- **WHEN** authors use `provides` and `requires` markers to describe capability contracts
- **THEN** conventions SHALL require explicit `dependsOn` edges for ordering relationships
- **AND** conventions SHALL prohibit treating `requires` as an implicit dependency edge

#### Scenario: Declaring parent-child split structure
- **WHEN** a large change is decomposed into smaller slices
- **THEN** conventions SHALL define parent-child metadata and expected ordering semantics
- **AND** docs SHALL describe when to split versus keep a single change

### Requirement: File-Level Touches Schema
Conventions SHALL define the schema for file-level impact declarations with semantic intent.

#### Scenario: Touches entry structure
- **WHEN** a change declares `touches` metadata
- **THEN** each entry SHALL conform to the schema: `{path: string, intent: string, mode: "create" | "modify" | "delete"}`
- **AND** `intent` SHALL be a verb-first sentence describing why the file is affected

#### Scenario: Touches replaces capability-level advisory
- **WHEN** touches is declared in `.grspec.yaml`
- **THEN** it SHALL use file-path entries (not capability IDs or spec area names)
- **AND** legacy capability-level touches values SHALL be accepted but deprecated with a migration warning

#### Scenario: Anchors file convention
- **WHEN** a project provides `grspec/anchors.yaml`
- **THEN** it SHALL follow the schema: `{domains: {<name>: {entry: string, files: string[]}}}`
- **AND** domain names SHALL match keywords commonly used in change intents

### Requirement: Structured Commit Message Convention
Conventions SHALL define the format for git commits generated by grspec after apply.

#### Scenario: Commit message structure
- **WHEN** grspec generates a commit after apply
- **THEN** the first line SHALL follow conventional commits format: `<type>(<change-name>): <summary>`
- **AND** the body SHALL contain a YAML metadata block delimited by `---` markers

#### Scenario: YAML metadata block schema
- **WHEN** a structured commit contains a YAML metadata block
- **THEN** it SHALL include fields: `grspec` (change name), `task-group` (number), and `modules` (object with `added`, `modified`, `deleted` arrays)
- **AND** each module entry SHALL contain `path`, `domain`, and `intent`

#### Scenario: Parsing structured commits from git log
- **WHEN** tooling reads git history to extract grspec metadata
- **THEN** it SHALL extract YAML blocks between `---` delimiters in commit bodies
- **AND** SHALL gracefully skip commits without valid grspec YAML blocks

### Requirement: Branch Naming Convention
Conventions SHALL define branch naming patterns for reliable branch-to-change mapping.

#### Scenario: Default branch naming pattern
- **WHEN** a change begins implementation and no feature branch exists
- **THEN** conventions SHALL recommend branches named `grspec/<change-name>`
- **AND** tooling SHALL use this pattern for automatic branch-to-change association during recon

#### Scenario: Non-convention branch recorded in metadata
- **WHEN** a user is on a branch that does not follow the `grspec/<name>` convention
- **THEN** conventions SHALL define a `branch` field in `.grspec.yaml` to record the actual branch name
- **AND** recon SHALL match by recorded branch name as fallback

### Requirement: Coordination Configuration Convention
Conventions SHALL define configurable parameters for git coordination behavior.

#### Scenario: Configuration schema
- **WHEN** a project defines coordination settings
- **THEN** conventions SHALL support a `coordination` block in project-level config with fields: `autoPush` (boolean), `recon.window` (duration string), `recon.hotThreshold` (object with `changes` and `authors`), `branch.convention` (string pattern), `touches.maxEntries` (number)

#### Scenario: Defaults when configuration is absent
- **WHEN** coordination configuration is not present
- **THEN** all parameters SHALL use documented defaults (autoPush: false, window: "2w", hotThreshold: {changes: 3, authors: 2}, maxEntries: 8)
- **AND** the system SHALL NOT require configuration to function

## Core Principles

The system SHALL follow these principles:
- Specs reflect what IS currently built and deployed
- Changes contain proposals for what SHOULD be changed
- AI drives the documentation process
- Specs are living documentation kept in sync with deployed code

## Directory Structure

### Project Structure

An grspec project SHALL maintain a consistent directory structure for specifications and changes.

#### Scenario: Initializing project structure

- **WHEN** an grspec project is initialized
- **THEN** it SHALL have this structure:
```
grspec/
├── project.md              # Project-specific context
├── AGENTS.md               # AI assistant instructions
├── specs/                  # Current deployed capabilities
│   └── [capability]/       # Single, focused capability
│       ├── spec.md         # WHAT and WHY
│       └── design.md       # HOW (optional, for established patterns)
└── changes/                # Proposed changes
    ├── [change-name]/      # Descriptive change identifier
    │   ├── proposal.md     # Why, what, and impact
    │   ├── tasks.md        # Implementation checklist
    │   ├── design.md       # Technical decisions (optional)
    │   └── specs/          # Complete future state
    │       └── [capability]/
    │           └── spec.md # Clean markdown (no diff syntax)
    └── archive/            # Completed changes
        └── YYYY-MM-DD-[name]/
```

## Specification Format

### Behavioral Spec Format

Behavioral specifications SHALL use a structured format with consistent section headers and keywords to ensure visual consistency and parseability.

#### Scenario: Writing requirement sections

- **WHEN** documenting a requirement in a behavioral specification
- **THEN** use a level-3 heading with format `### Requirement: [Name]`
- **AND** immediately follow with a SHALL statement describing core behavior
- **AND** keep requirement names descriptive and under 50 characters

#### Scenario: Documenting scenarios

- **WHEN** documenting specific behaviors or use cases
- **THEN** use level-4 headings with format `#### Scenario: [Description]`
- **AND** use bullet points with bold keywords for steps:
  - **GIVEN** for initial state (optional)
  - **WHEN** for conditions or triggers
  - **THEN** for expected outcomes
  - **AND** for additional outcomes or conditions

#### Scenario: Adding implementation details

- **WHEN** a step requires additional detail
- **THEN** use sub-bullets under the main step
- **AND** maintain consistent indentation
  - Sub-bullets provide examples or specifics
  - Keep sub-bullets concise

## Change Storage Convention

### Header-Based Requirement Identification

Requirement headers SHALL serve as unique identifiers for programmatic matching between current specs and proposed changes.

#### Scenario: Matching requirements programmatically

- **WHEN** processing delta changes
- **THEN** use the `### Requirement: [Name]` header as the unique identifier
- **AND** match using normalized headers: `normalize(header) = trim(header)`
- **AND** compare headers with case-sensitive equality after normalization

#### Scenario: Handling requirement renames

- **WHEN** renaming a requirement
- **THEN** use a special `## RENAMED Requirements` section
- **AND** specify both old and new names explicitly:
  ```markdown
  ## RENAMED Requirements
  - FROM: `### Requirement: Old Name`
  - TO: `### Requirement: New Name`
  ```
- **AND** if content also changes, include under MODIFIED using the NEW header

#### Scenario: Validating header uniqueness

- **WHEN** creating or modifying requirements
- **THEN** ensure no duplicate headers exist within a spec
- **AND** validation tools SHALL flag duplicate headers as errors

### Change Storage Convention

Change proposals SHALL store only the additions, modifications, and removals to specifications, not complete future states.

#### Scenario: Creating change proposals with additions

- **WHEN** creating a change proposal that adds new requirements
- **THEN** include only the new requirements under `## ADDED Requirements`
- **AND** each requirement SHALL include its complete content
- **AND** use the standard structured format for requirements and scenarios

#### Scenario: Creating change proposals with modifications  

- **WHEN** creating a change proposal that modifies existing requirements
- **THEN** include the modified requirements under `## MODIFIED Requirements`
- **AND** use the same header text as in the current spec (normalized)
- **AND** include the complete modified requirement (not a diff)
- **AND** optionally annotate what changed with inline comments like `← (was X)`

#### Scenario: Creating change proposals with removals

- **WHEN** creating a change proposal that removes requirements
- **THEN** list them under `## REMOVED Requirements`
- **AND** use the normalized header text for identification
- **AND** include reason for removal
- **AND** document any migration path if applicable

The `changes/[name]/specs/` directory SHALL contain:
- Delta files showing only what changes
- Sections for ADDED, MODIFIED, REMOVED, and RENAMED requirements
- Normalized header matching for requirement identification
- Complete requirements using the structured format
- Clear indication of change type for each requirement

#### Scenario: Using standard output symbols

- **WHEN** displaying delta operations in CLI output
- **THEN** use these standard symbols:
  - `+` for ADDED (green)
  - `~` for MODIFIED (yellow)
  - `-` for REMOVED (red)
  - `→` for RENAMED (cyan)

### Archive Process Enhancement

The archive process SHALL programmatically apply delta changes to current specifications using header-based matching.

#### Scenario: Archiving changes with deltas

- **WHEN** archiving a completed change
- **THEN** the archive command SHALL:
  1. Parse RENAMED sections first and apply renames
  2. Parse REMOVED sections and remove by normalized header match
  3. Parse MODIFIED sections and replace by normalized header match (using new names if renamed)
  4. Parse ADDED sections and append new requirements
- **AND** validate that all MODIFIED/REMOVED headers exist in current spec
- **AND** validate that ADDED headers don't already exist
- **AND** generate the updated spec in the main specs/ directory

#### Scenario: Handling conflicts during archive

- **WHEN** delta changes conflict with current spec state
- **THEN** the archive command SHALL report specific conflicts
- **AND** require manual resolution before proceeding
- **AND** provide clear guidance on resolving conflicts

### Proposal Format

Proposals SHALL explicitly document all changes with clear from/to comparisons.

#### Scenario: Documenting changes

- **WHEN** documenting what changes
- **THEN** the proposal SHALL explicitly describe each change:

```markdown
**[Section or Behavior Name]**
- From: [current state/requirement]
- To: [future state/requirement]
- Reason: [why this change is needed]
- Impact: [breaking/non-breaking, who's affected]
```

This explicit format compensates for not having inline diffs and ensures reviewers understand exactly what will change.

## Change Lifecycle

The change process SHALL follow these states:

1. **Propose**: AI creates change with future state specs and explicit proposal
2. **Review**: Humans review proposal and future state
3. **Approve**: Change is approved for implementation
4. **Implement**: Follow tasks.md checklist (can span multiple PRs)
5. **Deploy**: Changes are deployed to production
6. **Update**: Specs in `specs/` are updated to match deployed reality
7. **Archive**: Change is moved to `archive/YYYY-MM-DD-[name]/`

## Viewing Changes

### Change Review

The system SHALL support multiple methods for reviewing proposed changes.

#### Scenario: Reviewing changes

- **WHEN** reviewing proposed changes
- **THEN** reviewers can compare using:
- GitHub PR diff view when changes are committed
- Command line: `diff -u specs/[capability]/spec.md changes/[name]/specs/[capability]/spec.md`
- Any visual diff tool comparing current vs future state

The system relies on tools to generate diffs rather than storing them.

## Capability Naming

Capabilities SHALL use:
- Verb-noun patterns (e.g., `user-auth`, `payment-capture`)
- Hyphenated lowercase names
- Singular focus (one responsibility per capability)
- No nesting (flat structure under `specs/`)

## When Changes Require Proposals

A proposal SHALL be created for:
- New features or capabilities
- Breaking changes to existing behavior
- Architecture or pattern changes
- Performance optimizations that change behavior
- Security updates affecting access patterns

A proposal is NOT required for:
- Bug fixes restoring intended behavior
- Typos or formatting fixes
- Non-breaking dependency updates
- Adding tests for existing behavior
- Documentation clarifications

## Why This Approach

Clean future state storage provides:
- **Readability**: No diff syntax pollution
- **AI-compatibility**: Standard markdown that AI tools understand
- **Simplicity**: No special parsing or processing needed
- **Tool-agnostic**: Any diff tool can show changes
- **Clear intent**: Explicit proposals document reasoning

The structured format adds:
- **Visual Consistency**: Requirement and Scenario prefixes make sections instantly recognizable
- **Parseability**: Consistent structure enables tooling and automation
- **Gradual Adoption**: Existing specs can migrate incrementally
