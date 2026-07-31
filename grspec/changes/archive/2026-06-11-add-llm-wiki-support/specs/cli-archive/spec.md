## MODIFIED Requirements

### Requirement: Archive Process

The archive operation SHALL follow a structured process to safely move changes to the archive.

#### Scenario: Performing archive

- **WHEN** archiving a change
- **THEN** execute these steps:
  1. Create archive/ directory if it doesn't exist
  2. Generate target name as `YYYY-MM-DD-[change-name]` using current date
  3. Check if target directory already exists
  4. Update main specs from the change's delta specs (see Spec Update Process)
  5. Merge wiki deltas from the change to `grspec/wiki/` if wiki is enabled and deltas exist
  6. Generate a source summary page at `wiki/sources/YYYY-MM-DD-<change-name>.md` if wiki is enabled
  7. Update `wiki/index.md` and append to `wiki/log.md` if wiki pages were changed
  8. Release page locks held by this change (remove `blocked_by` frontmatter)
  9. Move the entire change directory to the archive location

#### Scenario: Archive already exists

- **WHEN** target archive already exists
- **THEN** fail with error message
- **AND** do not overwrite existing archive

#### Scenario: Successful archive

- **WHEN** move succeeds
- **THEN** display success message with archived name, list of updated specs, and list of updated wiki pages

## ADDED Requirements

### Requirement: Skip wiki option

The archive command SHALL support a `--skip-wiki` flag that skips all wiki update operations during archive.

#### Scenario: Skipping wiki updates with flag

- **WHEN** executing `grspec archive <change> --skip-wiki`
- **THEN** skip wiki delta discovery, merge, index update, log update, and source summary generation
- **AND** proceed with all other archive steps normally
- **AND** display a message indicating wiki updates were skipped

### Requirement: Wiki delta validation before archive

Before merging wiki deltas, the archive command SHALL validate the delta files.

#### Scenario: Valid wiki deltas

- **WHEN** wiki delta files have valid frontmatter and structure
- **THEN** proceed with wiki merge

#### Scenario: Invalid wiki deltas

- **WHEN** wiki delta files have invalid frontmatter (missing required fields, invalid type)
- **THEN** display validation errors
- **AND** skip wiki merge with a warning (non-blocking — archive continues)

### Requirement: Wiki merge display output

The archive command SHALL display wiki merge operations alongside spec merge output.

#### Scenario: Showing wiki merge results

- **WHEN** wiki deltas are merged during archive
- **THEN** display for each wiki operation:
  - Number of pages added
  - Number of pages modified (replaced)
  - Number of pages removed
  - Source summary page generated
- **AND** use symbols: `+ added`, `~ modified`, `- removed`, `📄 source summary`
