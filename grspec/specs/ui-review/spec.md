# ui-review Specification

## Purpose
Perform automated static UX quality analysis on UI code files, detecting common violations like missing cursor-pointer, emoji-as-icons, timing issues, and missing reduced-motion support.
## Requirements
### Requirement: Static UX code analysis
The system SHALL perform automated static checks on UI code files when the user runs `grspec ui review [path]`. Default path is current working directory.

#### Scenario: Review specific directory
- **WHEN** user runs `grspec ui review src/components/`
- **THEN** the system scans all supported files (.tsx, .jsx, .vue, .svelte, .html, .css) in that directory and reports findings

#### Scenario: Review specific file
- **WHEN** user runs `grspec ui review src/pages/landing.tsx`
- **THEN** the system scans only that file and reports findings

### Requirement: Cursor-pointer detection
The system SHALL detect clickable elements (onClick, onPress, button, a[href], role="button") that lack `cursor-pointer` styling.

#### Scenario: Missing cursor-pointer
- **WHEN** a JSX element has `onClick` handler but no `cursor-pointer` class or `cursor: pointer` style
- **THEN** the system reports a HIGH severity finding with rule ID `cursor-pointer`

### Requirement: Emoji-as-icon detection
The system SHALL detect emoji characters used in icon-like contexts (navigation, buttons, labels).

#### Scenario: Emoji in component
- **WHEN** a JSX file contains emoji characters (Unicode emoji ranges) adjacent to clickable elements or in navigation structures
- **THEN** the system reports a HIGH severity finding with rule ID `no-emoji-icons`

### Requirement: Transition timing check
The system SHALL detect CSS transitions with duration outside the 150-500ms range.

#### Scenario: Zero-duration transition
- **WHEN** a CSS/Tailwind class specifies `transition: 0ms` or `duration-0`
- **THEN** the system reports a MEDIUM severity finding with rule ID `duration-timing`

#### Scenario: Excessively slow transition
- **WHEN** a CSS transition specifies duration > 500ms for UI interactions
- **THEN** the system reports a MEDIUM severity finding with rule ID `duration-timing`

### Requirement: Reduced-motion support check
The system SHALL check whether the project includes `prefers-reduced-motion` media query or equivalent.

#### Scenario: No reduced-motion support
- **WHEN** no file in the scanned path contains `prefers-reduced-motion`
- **THEN** the system reports a HIGH severity finding with rule ID `reduced-motion`

### Requirement: Platform-specific review
The system SHALL support `--platform` flag to apply platform-appropriate checks.

#### Scenario: Web platform review
- **WHEN** user runs `grspec ui review --platform web`
- **THEN** checks include cursor-pointer, viewport meta, hover states; exclude touch-target sizing below 44pt

#### Scenario: App platform review
- **WHEN** user runs `grspec ui review --platform app`
- **THEN** checks include touch-target sizing, safe-area compliance; exclude cursor-pointer

### Requirement: Structured output
The system SHALL group findings by severity (CRITICAL, HIGH, MEDIUM) and include passed checks.

#### Scenario: Output structure
- **WHEN** review completes with findings
- **THEN** output shows findings grouped by severity, each with file path, line number (when available), description, and rule ID, followed by a summary count

### Requirement: JSON output
The system SHALL support `--json` for CI-friendly output.

#### Scenario: JSON output
- **WHEN** user runs `grspec ui review src/ --json`
- **THEN** output is valid JSON with `findings` array and `summary` object

