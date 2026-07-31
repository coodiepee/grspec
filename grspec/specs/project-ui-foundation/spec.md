# project-ui-foundation Specification

## Purpose
Define the project-level UI foundation at flat grspec/ui/MASTER.md and related discovery rules.
## Requirements
### Requirement: Project UI foundation path
The project-level UI foundation SHALL live at flat path `grspec/ui/MASTER.md` relative to the project root. The system SHALL NOT use `grspec/design-system/` or slug subdirectories under `grspec/ui/` for the project MASTER file.

#### Scenario: Init persists to flat MASTER
- **WHEN** user runs `grspec ui init --type saas` successfully
- **THEN** the system SHALL write `grspec/ui/MASTER.md`
- **AND** SHALL NOT write `grspec/ui/<slug>/MASTER.md`

#### Scenario: Status reports flat path
- **WHEN** user runs `grspec ui status --json` and a foundation exists
- **THEN** the JSON output SHALL reference `grspec/ui/MASTER.md` as the design system path

### Requirement: Project foundation created only by init
Only `grspec ui init` (or equivalent `persistProjectFoundation`) SHALL create or overwrite `grspec/ui/MASTER.md`. `grspec ui design-system --persist` SHALL NOT write project-level MASTER.

#### Scenario: design-system persist does not create project MASTER
- **WHEN** user runs `grspec ui design-system "billing page" --persist` in a change context
- **THEN** the system SHALL NOT create or modify `grspec/ui/MASTER.md`

### Requirement: Optional project pages directory
When `grspec/ui/pages/*.md` files exist, the system SHALL discover them for apply context alongside `grspec/ui/MASTER.md`. Absence of that directory SHALL NOT be an error.

#### Scenario: Project pages included in discovery
- **WHEN** `grspec/ui/pages/shell.md` exists alongside `grspec/ui/MASTER.md`
- **THEN** UI context discovery SHALL include both files in `contextFiles.ui`

### Requirement: Idempotency guard uses grspec/ui
`checkExistingDesignSystem` (or successor) SHALL detect existing foundation at `grspec/ui/MASTER.md` and refuse init without `--force`.

#### Scenario: Init refused when MASTER exists
- **WHEN** `grspec/ui/MASTER.md` exists
- **AND** user runs `grspec ui init --type saas` without `--force`
- **THEN** the CLI SHALL refuse to overwrite and report the existing path

