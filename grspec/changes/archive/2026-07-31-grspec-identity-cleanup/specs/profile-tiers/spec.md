## REMOVED Requirements

### Requirement: Backward compatibility with core profile
**Reason**: Transition period ended; `core` is no longer a valid profile value.
**Migration**: Set `profile: standard` (previous alias target) or choose `minimal` / `full` / `custom` via `grspec config`.

## ADDED Requirements

### Requirement: Invalid profile rejected without core alias

Profile resolution SHALL accept only `minimal`, `standard`, `full`, and `custom`. The value `core` SHALL be treated as invalid.

#### Scenario: Unknown profile value rejected
- **WHEN** the user's global config contains a profile value that is not one of `minimal`, `standard`, `full`, or `custom`
- **THEN** grspec SHALL display an error listing valid profile values
- **AND** SHALL fall back to the `standard` profile

#### Scenario: core is not a valid profile
- **WHEN** the user's global config contains `profile: core`
- **THEN** grspec SHALL treat `core` as an invalid profile value
- **AND** SHALL follow the same error and fallback behavior as other unknown values
