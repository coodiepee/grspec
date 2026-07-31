# change-ui-pages Specification

## Purpose
Define change-level UI page overrides under ui/pages/ with provisional frontmatter semantics.
## Requirements
### Requirement: Change-level UI pages directory
Change-level UI persist output SHALL live under `grspec/changes/<name>/ui/pages/<page-slug>.md`. Change directories SHALL NOT contain `ui/MASTER.md` or `design-system/`.

#### Scenario: Persist writes page file only
- **WHEN** user runs `grspec ui design-system "billing settings" --persist` with output directed at a change directory
- **THEN** the system SHALL write `ui/pages/billing-settings.md` (or equivalent slug)
- **AND** SHALL NOT write `ui/MASTER.md` under the change directory

#### Scenario: Change pages discovered for apply
- **WHEN** a change contains `ui/pages/dashboard.md`
- **THEN** `generateApplyInstructions` SHALL include that path in `contextFiles.ui`

### Requirement: Provisional page frontmatter
When `ui.md` has `Status: blocked` and a page file is generated, the page file frontmatter SHALL include `provisional: true`.

#### Scenario: Provisional flag on blocked persist
- **WHEN** a page is persisted while `parseUiArtifactStatus` is `blocked`
- **THEN** the page markdown file SHALL contain YAML frontmatter with `provisional: true`

#### Scenario: Done status without provisional flag
- **WHEN** a page is persisted while project MASTER exists and `ui.md` has `Status: done`
- **THEN** the page file SHALL NOT contain `provisional: true`

### Requirement: Page override semantics
Change page files SHALL override project-level page files of the same slug name for apply context. Project `grspec/ui/MASTER.md` SHALL remain the global token source.

#### Scenario: Change page overrides project page of same name
- **WHEN** both `grspec/ui/pages/settings.md` and `change/ui/pages/settings.md` exist
- **THEN** apply instructions SHALL include both paths in `contextFiles.ui`
- **AND** workflow guidance SHALL state that the change page overrides the project page for that screen

