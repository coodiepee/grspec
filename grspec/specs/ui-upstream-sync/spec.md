# ui-upstream-sync Specification

## Purpose
Check for updates from the upstream ui-ux-pro-max-skill data source and synchronize local assets when newer versions are available.
## Requirements
### Requirement: Check for upstream updates
The system SHALL compare local data against an upstream source path and report differences when the user runs `grspec ui sync --check`.

#### Scenario: Updates available
- **WHEN** user runs `grspec ui sync --check` and the upstream source has newer or modified CSV files
- **THEN** the system displays a summary of changes (new files, modified files with row-count diff, removed files) without modifying any local data

#### Scenario: Already up to date
- **WHEN** user runs `grspec ui sync --check` and local data matches upstream
- **THEN** the system displays "Already up to date" with the current version

#### Scenario: Upstream path not found
- **WHEN** the configured upstream path does not exist
- **THEN** the system displays an error with instructions to set the upstream path via `--from` flag or configure it

### Requirement: Execute data sync
The system SHALL copy updated CSV files from the upstream source to `assets/ui/data/` when the user runs `grspec ui sync`.

#### Scenario: Successful sync
- **WHEN** user runs `grspec ui sync` and upstream has changes
- **THEN** the system copies all changed CSV files, updates `assets/ui/UPSTREAM.md` with new version and timestamp, and displays a summary of changes applied

#### Scenario: Force sync
- **WHEN** user runs `grspec ui sync --force`
- **THEN** the system copies all upstream CSV files regardless of modification state and updates `assets/ui/UPSTREAM.md`

### Requirement: Custom upstream path
The system SHALL support `--from <path>` to specify the upstream source directory.

#### Scenario: Custom source path
- **WHEN** user runs `grspec ui sync --from /path/to/ui-ux-pro-max-skill/src/ui-ux-pro-max/data/`
- **THEN** the system uses that path as the upstream source for comparison and copying

### Requirement: UPSTREAM.md version tracking
The system SHALL maintain `assets/ui/UPSTREAM.md` with metadata about the synced version.

#### Scenario: UPSTREAM.md content after sync
- **WHEN** a sync completes successfully
- **THEN** `assets/ui/UPSTREAM.md` contains: source name, synced version (from upstream `skill.json` version field), sync date, source path, and file count summary

### Requirement: Cross-platform path handling
The system SHALL use Node.js path module for all file operations during sync.

#### Scenario: Windows path handling
- **WHEN** sync runs on Windows with backslash-separated upstream path
- **THEN** the system correctly resolves and copies files using platform-appropriate path separators

