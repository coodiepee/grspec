# wiki-verification Specification

## Purpose
Perform structural and semantic health checks on the wiki — validating frontmatter, wikilink integrity, orphan pages, source paths, and spec coverage — to maintain wiki quality.
## Requirements
### Requirement: Structural lint checks

The system SHALL perform structural wiki health checks without requiring LLM invocation. Structural checks SHALL cover: frontmatter format validation, wikilink integrity, orphan page detection, source path existence, index completeness, and spec capability coverage.

#### Scenario: Frontmatter validation

- **WHEN** running structural lint
- **THEN** the system SHALL check every wiki page for required frontmatter fields (title, type, created, updated, confidence)
- **AND** SHALL report pages with missing or invalid fields

#### Scenario: Wikilink integrity

- **WHEN** running structural lint
- **THEN** the system SHALL resolve all `[[wikilinks]]` in wiki pages
- **AND** SHALL report dead links (links to non-existent pages)

#### Scenario: Orphan page detection

- **WHEN** running structural lint
- **THEN** the system SHALL identify pages with no incoming `[[wikilinks]]` from other pages
- **AND** SHALL exclude structural files (index.md, log.md, overview.md) from orphan detection

#### Scenario: Source path existence

- **WHEN** running structural lint
- **THEN** the system SHALL check that file paths listed in each page's `sources` frontmatter field exist in the repository

#### Scenario: Index completeness

- **WHEN** running structural lint
- **THEN** the system SHALL verify that every wiki page is listed in `index.md`
- **AND** SHALL report pages present in the wiki but missing from the index

#### Scenario: Spec capability coverage

- **WHEN** running structural lint
- **THEN** the system SHALL check that every capability directory in `grspec/specs/` has a corresponding entity page in `wiki/entities/`
- **AND** SHALL report uncovered capabilities

### Requirement: Semantic lint checks

The system SHALL support semantic wiki health checks that require LLM analysis. Semantic checks SHALL cover: cross-page contradiction detection, wiki-vs-spec consistency, staleness detection, and coverage density analysis.

#### Scenario: Cross-page contradiction detection

- **WHEN** running semantic lint
- **THEN** the system SHALL identify claims that conflict between wiki pages

#### Scenario: Wiki-vs-spec consistency

- **WHEN** running semantic lint
- **THEN** the system SHALL check that wiki descriptions align with the corresponding spec requirements
- **AND** SHALL report discrepancies

#### Scenario: Staleness detection

- **WHEN** running semantic lint
- **THEN** the system SHALL identify pages with `confidence: low` or pages whose `sources` files have been modified more recently than the page's `updated` date

#### Scenario: Coverage density analysis

- **WHEN** running semantic lint
- **THEN** the system SHALL identify areas of the codebase or spec surface that lack sufficient wiki coverage

### Requirement: Build-time verification

The system SHALL verify wiki content at write time using a separate verifier pass before committing changes to wiki files.

#### Scenario: Verifier approves content

- **WHEN** the writer LLM generates or updates a wiki page
- **AND** the verifier LLM confirms consistency with specs, code references, and existing wiki
- **THEN** the page SHALL be written to disk

#### Scenario: Verifier rejects content

- **WHEN** the verifier LLM identifies issues (contradictions, invalid references, spec misalignment)
- **THEN** the system SHALL return feedback to the writer for correction
- **AND** SHALL retry up to a configurable maximum (default 2 retries)

#### Scenario: Verification exhausted

- **WHEN** the maximum retry count is reached and verification still fails
- **THEN** the page SHALL be written with `confidence: low` in frontmatter
- **AND** the issue SHALL be logged in `wiki/log.md` for human review

### Requirement: Locked page reporting

Wiki lint SHALL report pages that are currently locked by active changes, including lock duration.

#### Scenario: Report locked pages

- **WHEN** running lint (structural or semantic)
- **THEN** the system SHALL report all pages with `blocked_by` frontmatter
- **AND** SHALL include the change name and lock duration

