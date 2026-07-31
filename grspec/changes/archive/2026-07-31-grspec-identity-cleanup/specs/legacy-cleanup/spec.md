## REMOVED Requirements

### Requirement: Legacy artifact detection
**Reason**: Pre-skills marker-init migration window is closed; product no longer auto-detects or upgrades those artifacts.
**Migration**: Users on marker-era installs must manually remove obsolete marker blocks / old slash-command layouts, or re-init on a clean tool config. Prefer `grspec init` / `grspec update` on a current install only.

### Requirement: Legacy cleanup confirmation
**Reason**: Cleanup flow retired with the migration window.
**Migration**: None — command path removed.

### Requirement: Surgical removal of config file content
**Reason**: Cleanup flow retired with the migration window.
**Migration**: Edit or remove marker blocks manually if present.

### Requirement: Legacy directory removal
**Reason**: Cleanup flow retired with the migration window.
**Migration**: Delete obsolete command directories manually if present.

### Requirement: project.md migration hint
**Reason**: Cleanup flow retired with the migration window.
**Migration**: Move useful content from `grspec/project.md` into `grspec/grspec.yaml` `context:` manually if still present.

### Requirement: Cleanup reporting
**Reason**: Cleanup flow retired with the migration window.
**Migration**: None.
