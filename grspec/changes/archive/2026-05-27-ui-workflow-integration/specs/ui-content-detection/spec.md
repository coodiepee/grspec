## ADDED Requirements

### Requirement: UI content detection function
The system SHALL provide a `detectUiContent(text: string)` function in `src/core/ui/detect.ts` that scans text for UI-related keywords and returns a detection result.

The function SHALL return an object with:
- `detected: boolean` — true if any UI keyword matched
- `keywords: string[]` — list of matched keyword strings

#### Scenario: Text with UI keywords
- **WHEN** `detectUiContent` is called with text containing "color palette for the dashboard"
- **THEN** `detected` SHALL be `true`
- **AND** `keywords` SHALL include `color`, `palette`, and `dashboard`

#### Scenario: Text with no UI keywords
- **WHEN** `detectUiContent` is called with text containing "refactor the database migration scripts"
- **THEN** `detected` SHALL be `false`
- **AND** `keywords` SHALL be an empty array

#### Scenario: Case-insensitive matching
- **WHEN** `detectUiContent` is called with text containing "Dark Mode support"
- **THEN** `detected` SHALL be `true`
- **AND** `keywords` SHALL include `dark mode`

### Requirement: Curated keyword list
The detection function SHALL use a curated subset of UI-related keywords, NOT the full `DOMAIN_KEYWORDS` map from `src/core/ui/config.ts`.

The curated list SHALL include at minimum: `color`, `palette`, `style`, `ui`, `layout`, `font`, `typography`, `component`, `responsive`, `animation`, `dark mode`, `landing`, `dashboard`, `icon`, `accessibility`, `wcag`, `chart`, `visualization`.

The curated list SHALL exclude generic terms that produce false positives on non-UI changes (e.g. `page`, `form`, `input`, `navigation`).

#### Scenario: Generic terms do not trigger detection
- **WHEN** `detectUiContent` is called with text containing only "add a new page with a form input"
- **THEN** `detected` SHALL be `false`

### Requirement: Detection from change artifacts
The system SHALL provide a `detectUiContentInChange(changeDir: string)` function that reads `proposal.md` and `design.md` (if they exist) from the change directory and runs `detectUiContent` on their concatenated content.

#### Scenario: Detection from proposal only
- **WHEN** `detectUiContentInChange` is called on a change directory containing only `proposal.md` with UI keywords
- **THEN** the result SHALL indicate `detected: true`

#### Scenario: Neither artifact exists
- **WHEN** `detectUiContentInChange` is called on a change directory with no `proposal.md` or `design.md`
- **THEN** the result SHALL indicate `detected: false`
