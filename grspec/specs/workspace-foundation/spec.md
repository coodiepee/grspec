# workspace-foundation Specification

## Purpose
Define the product and storage foundation for grspec coordination workspaces,
including workspace identity, shared versus local state, managed storage,
registry behavior, stable link names, and repo ownership boundaries.

## Requirements
### Requirement: Recognizable Workspace Home
grspec SHALL give users and agents a recognizable workspace home for cross-repo planning.

#### Scenario: Planning across linked repos or folders
- **WHEN** a user creates an grspec workspace for repos or folders they plan across
- **THEN** the workspace SHALL provide a durable planning home
- **AND** the workspace SHALL be able to hold multiple changes over time

#### Scenario: Working from inside a workspace
- **GIVEN** a user runs grspec from a workspace folder or one of its subdirectories
- **WHEN** grspec resolves the current workspace
- **THEN** it SHALL identify the workspace location
- **AND** it SHALL use the workspace location's `changes/` directory as the workspace planning area

#### Scenario: Avoiding accidental workspace mode
- **GIVEN** a directory has `changes/` but is not an grspec workspace
- **WHEN** grspec resolves the current workspace
- **THEN** it SHALL avoid treating that directory as a workspace
- **AND** it SHALL enter workspace mode only when the workspace identity file is present

### Requirement: Stable Workspace Name
grspec SHALL use one folder-style workspace name across workspace identity, managed storage, and the local registry.

#### Scenario: Using one workspace name
- **WHEN** grspec creates or registers a managed workspace
- **THEN** the workspace name SHALL be stored in `.grspec-workspace/workspace.yaml`
- **AND** the same name SHALL be used as the default managed workspace folder name
- **AND** the same name SHALL be used as the local registry name

#### Scenario: Rejecting invalid folder-style names
- **WHEN** grspec accepts a workspace name
- **THEN** it SHALL reject empty names, `.` or `..`, and names containing path separators
- **AND** setup or create flows SHALL report OS-level folder creation failures clearly

### Requirement: Dedicated Workspace Identity
grspec SHALL distinguish a coordination workspace from a repo-local grspec project.

#### Scenario: Reading workspace identity
- **WHEN** grspec reads or writes workspace identity and workspace state
- **THEN** it SHALL use `.grspec-workspace/`

#### Scenario: Preserving repo-local grspec projects
- **GIVEN** a repo-local grspec project uses `grspec/`
- **WHEN** that repo is linked to a workspace
- **THEN** grspec SHALL continue treating `grspec/` as that repo's local grspec directory
- **AND** workspace planning SHALL remain anchored in the workspace folder

#### Scenario: Avoiding repo-local initialization in the workspace folder
- **WHEN** a user is working from an grspec workspace folder
- **THEN** grspec SHALL treat that folder as a workspace coordination surface
- **AND** users SHALL not need to initialize a repo-local `grspec/` project inside the workspace folder

### Requirement: Safe Workspace Sharing
grspec SHALL keep shared workspace information separate from local machine paths.

#### Scenario: Sharing workspace planning
- **WHEN** a workspace is shared with another user or machine
- **THEN** shared workspace information SHALL include portable workspace identity and stable link names
- **AND** it SHALL not require another user to reuse the original user's absolute checkout paths

#### Scenario: Keeping checkout paths local
- **WHEN** grspec stores local paths for a workspace
- **THEN** those paths SHALL be treated as local to the current machine and runtime
- **AND** another machine MAY map the same link names to different local paths

#### Scenario: Preserving runtime-local paths
- **WHEN** grspec reads or writes machine-local path state
- **THEN** it SHALL preserve path strings valid for the current runtime
- **AND** it SHALL support native Windows paths and WSL2/Linux paths as local state values

#### Scenario: Excluding local state from portable collaboration
- **WHEN** grspec creates a workspace
- **THEN** it SHALL exclude `.grspec-workspace/local.yaml` from portable collaboration state by default
- **AND** `.grspec-workspace/workspace.yaml` SHALL remain the portable workspace identity and link-name state

### Requirement: Standard Workspace Location
grspec SHALL use a standard location for grspec-managed workspaces without asking most users to choose one.

#### Scenario: Using the standard workspace location
- **WHEN** grspec needs the location for grspec-managed workspaces
- **THEN** it SHALL use `<global-data-dir>/workspaces`
- **AND** `<global-data-dir>` SHALL follow existing grspec XDG and platform data directory behavior

#### Scenario: Avoiding workspace-specific storage overrides
- **WHEN** grspec resolves the location for grspec-managed workspaces
- **THEN** it SHALL not use a workspace-specific environment variable, command, or configuration setting in this slice
- **AND** managed workspace storage SHALL remain under `<global-data-dir>/workspaces`

#### Scenario: Running from native Windows
- **WHEN** grspec runs from native Windows shells such as PowerShell
- **AND** `XDG_DATA_HOME` is not set
- **THEN** grspec SHALL store managed workspaces under the Windows global data location
- **AND** paths SHALL follow native Windows path behavior

#### Scenario: Running from WSL2
- **WHEN** grspec runs from WSL2
- **THEN** grspec SHALL store managed workspaces under the Linux/XDG data location inside WSL
- **AND** paths SHALL follow Linux path behavior inside WSL

#### Scenario: Using the workspace location automatically
- **WHEN** grspec creates or resolves grspec-managed workspaces in later workflows
- **THEN** it SHALL use the resolved workspace location by default
- **AND** users SHALL be able to follow the normal workspace flow without choosing a storage location

#### Scenario: Showing the workspace location
- **WHEN** grspec creates a workspace in the standard workspace location
- **THEN** it SHALL report the workspace location to the user
- **AND** it SHALL not hide where planning files were created

#### Scenario: Staying in the current runtime
- **WHEN** grspec resolves workspace locations or local repo paths
- **THEN** it SHALL interpret paths for the runtime running grspec
- **AND** Windows, UNC WSL, and WSL mount paths SHALL remain explicit user-provided paths

### Requirement: Local Workspace Registry
grspec SHALL keep a lightweight local registry of known workspaces on the current machine.

#### Scenario: Recording known workspaces
- **WHEN** grspec creates or learns about a managed workspace
- **THEN** it SHALL be able to record the workspace name and location in a local registry
- **AND** the registry SHALL be machine-local state

#### Scenario: Keeping workspace folders authoritative
- **WHEN** grspec reads workspace details
- **THEN** each workspace folder's `.grspec-workspace/workspace.yaml` SHALL remain the source of truth for that workspace
- **AND** the local registry SHALL act only as an index of known workspace locations

#### Scenario: Finding workspaces from anywhere
- **WHEN** a later workspace command runs outside a workspace directory
- **THEN** grspec MAY use the local registry to find known workspaces
- **AND** commands that need one workspace MAY use the registry to support an interactive picker

### Requirement: Stable Link Names
grspec SHALL use stable link names to refer to repos and folders in workspace planning.

#### Scenario: Referring to a repo or folder in workspace planning
- **WHEN** workspace state or later workspace planning artifacts refer to a linked repo or folder
- **THEN** they SHALL use the stable link name
- **AND** the same link name SHALL remain valid even when local checkout paths differ

#### Scenario: Reusing link names across machines
- **WHEN** a workspace is used on another machine
- **THEN** link names SHALL remain stable
- **AND** local checkout paths MAY differ on that machine

#### Scenario: Rejecting invalid link names
- **WHEN** grspec accepts a workspace link name
- **THEN** it SHALL reject empty names, `.` or `..`, and names containing path separators
- **AND** link names SHALL be unique within the workspace

### Requirement: Linked Repos And Folders
grspec SHALL allow workspace planning to include linked repos and folders before they have repo-local grspec state.

#### Scenario: Planning with a repo that has not adopted grspec
- **WHEN** a workspace links a repo path that does not yet contain repo-local `grspec/`
- **THEN** the repo SHALL still be available for workspace-level planning
- **AND** implementation readiness MAY be handled by a later workflow

#### Scenario: Planning across monorepo folders
- **WHEN** planning spans multiple packages, services, apps, or directories inside one monorepo
- **THEN** the workspace SHALL be able to link those folders separately
- **AND** each folder SHALL not need its own repo-local `grspec/` directory to participate in workspace planning

#### Scenario: Treating repos and folders consistently
- **WHEN** a workspace plan includes both separate repos and folders inside a monorepo
- **THEN** grspec SHALL use the same planning model for both
- **AND** users SHALL not need to create different kinds of workspace plans for multi-repo and monorepo changes

#### Scenario: Recording links without changing targets
- **WHEN** grspec records a link between a workspace and a local repo or folder
- **THEN** it SHALL store the link in workspace state
- **AND** it SHALL not create, copy, move, initialize, or edit files inside the linked repo or folder

### Requirement: Planning Before Implementation
grspec SHALL treat workspace creation and detection as planning setup, not implementation.

#### Scenario: Creating or detecting a workspace
- **WHEN** a workspace exists
- **THEN** grspec SHALL treat it as a place for workspace-level planning
- **AND** repo implementation files SHALL remain unchanged until an explicit implementation workflow runs

#### Scenario: Deferring repo implementation
- **WHEN** repo-local implementation, apply, verify, or archive behavior is needed
- **THEN** that behavior SHALL require an explicit later workspace workflow

### Requirement: Repo Ownership Boundaries
grspec SHALL keep repo ownership legible when planning happens in a workspace.

#### Scenario: Planning across owned repos
- **WHEN** a workspace plan refers to behavior owned by a repo or source area
- **THEN** that owner SHALL remain the home for canonical specs and implementation work
- **AND** the workspace SHALL make the cross-boundary plan visible without taking ownership away from that owner

#### Scenario: Drafting before ownership is clear
- **WHEN** cross-repo behavior is still being explored and ownership is not clear
- **THEN** the workspace MAY hold planning notes or draft behavior
- **AND** those drafts SHALL remain distinguishable from canonical repo-owned specs
