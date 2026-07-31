# execution-discipline Specification (Delta)

## MODIFIED Requirements

### Requirement: Execution discipline skill generation via init tools

When the user runs `grspec init --tools`, grspec SHALL generate all execution discipline skill templates (`grspec-tdd`, `grspec-verify`, `grspec-debug`, `grspec-review`) into each selected tool's appropriate skills directory (for example `.cursor/skills/` for Cursor). These skills SHALL be included when the active profile is `standard`, `full`, or `custom` (with those workflows listed).

#### Scenario: Init tools writes all four skills for standard profile

- **WHEN** the user runs `grspec init --tools` and selects tooling surfaces that support skills directories
- **AND** the active profile is `standard` or higher
- **THEN** grspec SHALL emit `grspec-tdd`, `grspec-verify`, `grspec-debug`, and `grspec-review` artifacts into the effective paths for those tools
- **AND** SHALL not omit any of the four execution discipline skills unless the tool surface explicitly does not support that artifact type (in which case grspec SHALL report the omission)

#### Scenario: Init tools skips discipline skills for minimal profile

- **WHEN** the user runs `grspec init --tools`
- **AND** the active profile is `minimal`
- **THEN** grspec SHALL NOT generate execution discipline skill templates
- **AND** SHALL only generate the minimal workflow skills (propose, explore, apply, sync, archive)
