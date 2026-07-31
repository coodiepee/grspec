## ADDED Requirements

### Requirement: Wiki directory structure

The system SHALL support a `grspec/wiki/` directory containing `overview.md`, `index.md`, `log.md`, and four category subdirectories: `concepts/`, `entities/`, `sources/`, `comparisons/`.

#### Scenario: Valid wiki structure

- **WHEN** `grspec/wiki/` exists and contains `index.md`
- **THEN** the system SHALL recognize it as an initialized wiki
- **AND** wiki-aware features SHALL be activated

#### Scenario: Wiki not initialized

- **WHEN** `grspec/wiki/` does not exist or lacks `index.md`
- **THEN** wiki-aware features SHALL be skipped gracefully
- **AND** no errors SHALL be raised for missing wiki

### Requirement: Wiki page format

Every wiki page SHALL use YAML frontmatter with required fields: `title` (string), `type` (one of `concept`, `entity`, `source-summary`, `comparison`), `created` (date), `updated` (date), `confidence` (one of `high`, `medium`, `low`), followed by a free-form markdown body supporting `[[wikilinks]]` for cross-references.

#### Scenario: Valid page with all required fields

- **WHEN** a wiki page contains valid YAML frontmatter with all required fields
- **THEN** the system SHALL accept the page as valid

#### Scenario: Page missing required frontmatter fields

- **WHEN** a wiki page is missing any of the required frontmatter fields
- **THEN** structural lint SHALL report the missing fields

#### Scenario: Page with optional fields

- **WHEN** a wiki page includes optional frontmatter fields (`sources`, `related`, `blocked_by`, `blocked_since`, `deleted`, `deleted_reason`)
- **THEN** the system SHALL accept them without error

### Requirement: Wiki index management

The system SHALL maintain `wiki/index.md` as a navigation catalog listing every wiki page with a `[[wikilink]]` and a one-line summary, organized by page type category.

#### Scenario: Index reflects all pages

- **WHEN** the wiki contains N pages across categories
- **THEN** `index.md` SHALL contain exactly N entries with accurate summaries

#### Scenario: Index updated after merge

- **WHEN** wiki deltas are merged (ADDED, MODIFIED, or REMOVED pages)
- **THEN** `index.md` SHALL be updated to reflect the current page set

### Requirement: Wiki log management

The system SHALL maintain `wiki/log.md` as an append-only chronological record. Each entry SHALL use the format `## [YYYY-MM-DD] operation | description` followed by a summary of affected pages.

#### Scenario: Log entry appended after operation

- **WHEN** a wiki operation completes (init, ingest, lint, merge)
- **THEN** a new entry SHALL be appended to `log.md`
- **AND** the entry SHALL list affected pages and noteworthy findings

### Requirement: Wiki delta detection

The system SHALL detect wiki deltas by scanning `changes/<name>/wiki/` and classifying each file by comparing against the main `grspec/wiki/` directory.

#### Scenario: New page (ADDED)

- **WHEN** a delta file exists at `changes/<name>/wiki/<type>/<topic>/page.md`
- **AND** no corresponding page exists at `grspec/wiki/<type>/<topic>/page.md`
- **THEN** the system SHALL classify this as an ADDED page

#### Scenario: Modified page (whole-page replacement)

- **WHEN** a delta file exists at `changes/<name>/wiki/<type>/<topic>/page.md`
- **AND** a corresponding page exists at `grspec/wiki/<type>/<topic>/page.md`
- **AND** the delta file does NOT have `deleted: true` in frontmatter
- **THEN** the system SHALL classify this as a MODIFIED page (whole-page replacement)

#### Scenario: Removed page

- **WHEN** a delta file has `deleted: true` in its YAML frontmatter
- **THEN** the system SHALL classify this as a REMOVED page regardless of whether the main page exists

### Requirement: Wiki delta merge

The system SHALL merge wiki deltas from a change directory to the main wiki using whole-page operations.

#### Scenario: Merge ADDED page

- **WHEN** merging an ADDED delta
- **THEN** the system SHALL create the page at the corresponding path in `grspec/wiki/`
- **AND** create parent directories if needed

#### Scenario: Merge MODIFIED page

- **WHEN** merging a MODIFIED delta
- **THEN** the system SHALL overwrite the existing main wiki page with the delta file content

#### Scenario: Merge REMOVED page

- **WHEN** merging a REMOVED delta (frontmatter `deleted: true`)
- **THEN** the system SHALL delete the corresponding page from `grspec/wiki/`
- **AND** remove the page's entry from `index.md`
- **AND** log the deletion in `log.md`

### Requirement: Page locking for parallel changes

The system SHALL support page-level locking via `blocked_by` and `blocked_since` frontmatter fields to prevent conflicting edits from parallel changes.

#### Scenario: Lock a page

- **WHEN** a change creates a wiki delta for a page
- **THEN** the system SHALL add `blocked_by: <change-name>` and `blocked_since: <YYYY-MM-DD>` to the main wiki page's frontmatter

#### Scenario: Detect locked page

- **WHEN** another change attempts to create a wiki delta for a page with `blocked_by` set
- **THEN** the system SHALL warn that the page is locked by another change
- **AND** SHALL skip generating a delta for that page

#### Scenario: Release lock on merge

- **WHEN** a change's wiki deltas are merged (via archive or sync)
- **THEN** the system SHALL remove `blocked_by` and `blocked_since` from all pages that were locked by that change

### Requirement: Source summary generation on archive

The system SHALL automatically generate a `wiki/sources/` page when a change is archived, summarizing the knowledge contribution of that change.

#### Scenario: Archive generates source summary

- **WHEN** a change is archived
- **AND** wiki is enabled
- **THEN** the system SHALL create `wiki/sources/YYYY-MM-DD-<change-name>.md`
- **AND** the page SHALL have type `source-summary` in frontmatter
- **AND** SHALL summarize what was changed, what knowledge was added or modified, and link to affected wiki pages
