# git-coordination Specification

## Purpose
Gather git-history intelligence before proposal generation to detect parallel work, identify hot files, and inform change impact analysis.
## Requirements
### Requirement: Pre-Propose Git Reconnaissance
The system SHALL gather structured intelligence from git history before proposal generation to detect parallel work and inform impact analysis.

#### Scenario: Recent file activity detection
- **WHEN** a proposal is being generated
- **THEN** the system SHALL analyze git log within a configurable time window (default 2 weeks)
- **AND** SHALL identify files with high change frequency and multiple recent authors (hot files)

#### Scenario: Active branch detection
- **WHEN** a proposal is being generated
- **THEN** the system SHALL identify unmerged remote branches with their last commit time and affected files
- **AND** SHALL surface branches whose changed files overlap with the proposed change's target area

#### Scenario: Cross-branch activity in target area
- **WHEN** the intent targets a specific code area
- **THEN** the system SHALL query git log across all branches for that area
- **AND** SHALL report recent commits with author, message, and affected files

#### Scenario: Detecting parallel work without grspec
- **WHEN** team members are working on related code but not using grspec changes
- **THEN** the system SHALL still detect their work via unmerged branch analysis
- **AND** SHALL include branch-only activity in overlap warnings alongside grspec-managed changes

### Requirement: Structured Commit Generation
The system SHALL automatically generate git commits with embedded semantic metadata after successful apply and test verification.

#### Scenario: Commit message includes YAML metadata block
- **WHEN** a task group is completed and tests pass
- **THEN** the system SHALL generate a commit message containing a YAML metadata block delimited by `---`
- **AND** the block SHALL include: change name, task group number, and module classifications (added/modified/deleted with path, domain, and intent)

#### Scenario: File classification from git diff
- **WHEN** generating a structured commit
- **THEN** the system SHALL read `git diff --name-status` to classify files as added (A), modified (M), or deleted (D)
- **AND** SHALL match each file to its corresponding task from `tasks.md`

#### Scenario: Intent carried from touches or generated from task
- **WHEN** populating the `intent` field for each module entry
- **THEN** the system SHALL prefer the intent declared in `touches` metadata for that file
- **AND** SHALL fall back to generating intent from the associated task description if no touches intent exists

#### Scenario: Commit granularity per task group
- **WHEN** multiple task groups are completed in a session
- **THEN** the system SHALL generate one commit per task group (heading-level sections in `tasks.md`)
- **AND** each commit SHALL be self-contained and represent a coherent unit of work

#### Scenario: Domain inference from file path
- **WHEN** populating the `domain` field for a module entry
- **THEN** the system SHALL infer domain from file path conventions (e.g., `src/api/` → api, `src/config/` → config)
- **AND** SHALL use `grspec/anchors.yaml` domain mappings when available

### Requirement: Activity Aggregation for Downstream Consumption
The system SHALL provide a CLI command that aggregates structured commit data for fast, zero-diff consumption by agents.

#### Scenario: Query recent activity as JSON
- **WHEN** a user or agent runs `grspec activity --since=<duration> --json`
- **THEN** the system SHALL parse structured commit YAML blocks from git history
- **AND** SHALL return aggregated change-level data including: change name, author, commit count, module lists (added/modified/deleted), intents per file, last commit timestamp, and status

#### Scenario: Query activity for a specific file
- **WHEN** a user runs `grspec activity --file <path>`
- **THEN** the system SHALL return all changes that have touched the specified file
- **AND** SHALL include the declared intent for each change's modification of that file

#### Scenario: Query hot files
- **WHEN** a user runs `grspec activity --hot`
- **THEN** the system SHALL return files ranked by change frequency and author count
- **AND** SHALL include which active changes currently declare touches on each hot file

#### Scenario: Query activity for a specific change
- **WHEN** a user runs `grspec activity --change <name>`
- **THEN** the system SHALL return the full module-level summary of that change's structured commits
- **AND** SHALL include task group breakdown and per-file intents

#### Scenario: Graceful fallback for non-structured commits
- **WHEN** git history contains commits without grspec YAML metadata blocks
- **THEN** the system SHALL skip those commits in structured aggregation
- **AND** SHALL NOT fail or produce incomplete results for structured commits that do exist

### Requirement: Git State Awareness During Apply
The system SHALL check git state at apply time to determine the correct coordination mode for overlapping files.

#### Scenario: Overlapping branch merged since propose
- **WHEN** applying a change whose overlap was detected at propose time
- **AND** the overlapping branch has since been merged to the base branch
- **THEN** the system SHALL detect this via `git fetch` and log comparison
- **AND** SHALL select Extend coordination mode (build on merged code)

#### Scenario: Overlapping branch still in progress
- **WHEN** applying a change whose overlap was detected at propose time
- **AND** the overlapping branch has NOT been merged
- **THEN** the system SHALL select Prepare coordination mode (leave extension points)

#### Scenario: Drift detection between propose and apply
- **WHEN** applying a change
- **THEN** the system SHALL compare current git state of touched files against the state at propose time
- **AND** SHALL warn if significant changes have occurred to touched files since the proposal was generated
- **AND** SHALL suggest re-running touches inference if drift exceeds a threshold

### Requirement: Post-Apply Feedback Loop
The system SHALL compare predicted touches against actual file changes to calibrate future inference accuracy.

#### Scenario: Accuracy comparison after apply
- **WHEN** a task group apply is completed
- **THEN** the system SHALL compare `git diff --name-only` (actual changes) against predicted `touches` paths
- **AND** SHALL report accuracy metrics: files predicted correctly, files missed (false negatives), files predicted but not changed (false positives)

#### Scenario: Dynamic touches update on false negatives
- **WHEN** the feedback comparison detects files that were modified but not predicted in `touches`
- **THEN** the system SHALL offer to append those files to the change's `touches` in `.grspec.yaml`
- **AND** SHALL generate an appropriate `intent` based on the task that caused the modification
- **AND** updated touches SHALL be visible to other agents in subsequent overlap checks

#### Scenario: Anchors update suggestion
- **WHEN** the feedback loop detects a recurring false negative pattern (same domain's files consistently missed)
- **THEN** the system SHALL suggest adding or updating entries in `grspec/anchors.yaml`
- **AND** SHALL NOT automatically modify anchors without user confirmation

### Requirement: Auto-Push After Structured Commit
The system SHALL support automatic git push after structured commit generation to make coordination data immediately visible to the team.

#### Scenario: Push after commit when remote is configured
- **WHEN** a structured commit is successfully generated
- **AND** the current branch tracks a remote branch
- **THEN** the system SHALL offer to push the commit to the remote
- **AND** SHALL default to auto-push when `grspec.autoPush` configuration is enabled

#### Scenario: Push makes touches visible to team
- **WHEN** a structured commit (including updated `.grspec.yaml` with touches) is pushed
- **THEN** other team members' agents SHALL be able to detect the pushed touches via `git fetch` and branch analysis
- **AND** `grspec activity` queries SHALL reflect the new data after fetch

#### Scenario: Push failure handling
- **WHEN** auto-push fails (e.g., remote rejected, network error)
- **THEN** the system SHALL NOT roll back the local commit
- **AND** SHALL warn the user that coordination data is not yet visible to the team
- **AND** SHALL suggest manual push or retry

### Requirement: Branch Naming Convention
The system SHALL establish branch naming conventions that align with grspec change names for reliable branch-to-change mapping.

#### Scenario: Branch name derived from change name
- **WHEN** a change is being implemented and no feature branch exists
- **THEN** the system SHALL suggest creating a branch named `grspec/<change-name>` (e.g., `grspec/add-rate-limiting`)
- **AND** SHALL record the branch name in `.grspec.yaml` for reliable mapping

#### Scenario: Branch-to-change mapping via naming convention
- **WHEN** git recon detects an unmerged branch matching the `grspec/<name>` pattern
- **THEN** the system SHALL automatically associate it with the corresponding grspec change
- **AND** SHALL use the change's `touches` metadata directly instead of inferring from branch diff

#### Scenario: Custom branch name support
- **WHEN** a user is already on a branch that does not follow the `grspec/<name>` convention
- **THEN** the system SHALL record the actual branch name in `.grspec.yaml` under a `branch` field
- **AND** recon SHALL match by recorded branch name when the convention does not apply

### Requirement: Touches Synchronization via Git
The system SHALL define how touches metadata is shared across team members through git.

#### Scenario: Touches committed with proposal
- **WHEN** a proposal is generated with inferred touches
- **THEN** the `.grspec.yaml` file (containing touches) SHALL be included in the same commit as `proposal.md`
- **AND** SHALL be pushed to the change's feature branch

#### Scenario: Other agents discover touches via fetch
- **WHEN** an agent runs git recon or overlap detection
- **THEN** it SHALL `git fetch` to get the latest remote state
- **AND** SHALL read `.grspec.yaml` from active remote branches (matching `grspec/<name>` pattern or recorded branch names)
- **AND** SHALL use fetched touches for overlap comparison without requiring a local checkout of those branches

#### Scenario: Touches update propagation
- **WHEN** touches are dynamically updated (e.g., post-apply false negative correction)
- **THEN** the updated `.grspec.yaml` SHALL be committed and pushed
- **AND** other agents SHALL see the updated touches on their next fetch cycle

### Requirement: Configurable Reconnaissance Parameters
The system SHALL allow configuration of git reconnaissance behavior.

#### Scenario: Time window configuration
- **WHEN** the user or project configures `grspec.recon.window`
- **THEN** git recon SHALL use the configured duration instead of the default 2 weeks
- **AND** SHALL accept values in git duration format (e.g., `1w`, `30d`, `3m`)

#### Scenario: Hot file threshold configuration
- **WHEN** the user configures `grspec.recon.hotThreshold`
- **THEN** hot file detection SHALL use the configured minimum change count and author count
- **AND** SHALL default to 3+ changes and 2+ authors if not configured

#### Scenario: Auto-push configuration
- **WHEN** the user configures `grspec.autoPush`
- **THEN** structured commits SHALL be automatically pushed after generation without prompting
- **AND** SHALL default to `false` (prompt before push)

