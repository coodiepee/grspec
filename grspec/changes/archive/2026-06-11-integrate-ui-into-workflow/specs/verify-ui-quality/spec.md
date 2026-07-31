---
type: spec
change: integrate-ui-into-workflow
created: 2026-06-11
schema: spec-driven
---
## ADDED Requirements

### Requirement: UI quality check in verify workflow
When the verify workflow runs on a change with `ui-detected: true` in its `.grspec.yaml`, or when the change's `touches` include files with UI extensions (`.tsx`, `.jsx`, `.css`, `.scss`, `.vue`, `.svelte`), the Coherence dimension SHALL include a UI Quality sub-check.

The UI Quality check SHALL:
1. Run `grspec ui review` on the change directory (or touched UI files)
2. Map review findings to verification severity levels: CRITICAL → CRITICAL, HIGH → WARNING, MEDIUM → SUGGESTION
3. Include findings in the verification report under Coherence

#### Scenario: UI quality findings in verify report
- **WHEN** `/grsx:verify` is run on a change with `ui-detected: true`
- **AND** `grspec ui review` returns findings (e.g., missing cursor-pointer, emoji as icon)
- **THEN** the verification report's Coherence section SHALL include a "UI Quality" sub-section
- **AND** CRITICAL review findings SHALL appear as CRITICAL verification issues
- **AND** HIGH review findings SHALL appear as WARNING verification issues

#### Scenario: No UI quality issues
- **WHEN** `/grsx:verify` is run on a change with `ui-detected: true`
- **AND** `grspec ui review` returns zero findings
- **THEN** the Coherence section SHALL note "UI Quality: ✓ No issues found"

#### Scenario: Non-UI change skips UI quality check
- **WHEN** `/grsx:verify` is run on a change without `ui-detected` set
- **AND** the change's `touches` do not include UI file extensions
- **THEN** the verification report SHALL NOT include a UI Quality sub-section

#### Scenario: Design-system token coverage note
- **WHEN** `/grsx:verify` is run on a change with `ui-detected: true`
- **AND** `design-system/MASTER.md` exists in the change directory
- **THEN** the UI Quality sub-section SHALL include a note about design-system availability for token verification
