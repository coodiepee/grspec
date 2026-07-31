# ui-content-detection Specification

## Purpose
Provide a `detectUiContent` function that scans text for UI-related keywords and returns a structured detection result, enabling automated UI workflow hooks.

## Requirements

### Requirement: UI content detection function
The system SHALL provide a `detectUiContent(text: string)` function in `src/core/ui/detect.ts` that scans text for UI-related keywords and returns a detection result.

The function SHALL return an object with:
- `detected: boolean` — true if ≥3 distinct UI keywords matched
- `keywords: string[]` — list of matched keyword strings

#### Scenario: Text with 3+ UI keywords
- **WHEN** `detectUiContent` is called with text containing "color palette for the dashboard"
- **THEN** `detected` SHALL be `true`
- **AND** `keywords` SHALL include `color`, `palette`, and `dashboard`

#### Scenario: Text with fewer than 3 UI keywords
- **WHEN** `detectUiContent` is called with text containing "this component uses a new style"
- **THEN** `detected` SHALL be `false`
- **AND** `keywords` SHALL include `component` and `style`

#### Scenario: Text with no UI keywords
- **WHEN** `detectUiContent` is called with text containing "refactor the database migration scripts"
- **THEN** `detected` SHALL be `false`
- **AND** `keywords` SHALL be an empty array

#### Scenario: Case-insensitive matching still counts
- **WHEN** `detectUiContent` is called with text containing "Dark Mode responsive layout with custom Typography"
- **THEN** `detected` SHALL be `true`
- **AND** `keywords` SHALL include `dark mode`, `responsive`, `layout`, and `typography`
