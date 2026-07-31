## REMOVED Requirements

### Requirement: Spec Command
**Reason**: Duplicate of verb-first show/list/validate for specs.
**Migration**: Use `grspec show`, `grspec list --specs` (or equivalent), and `grspec validate --specs`.

### Requirement: Interactive spec show
**Reason**: Interactive selection belongs on verb-first show.
**Migration**: Use `grspec show` with spec type/filters as documented.

### Requirement: Interactive spec validation
**Reason**: Interactive validation belongs on verb-first validate.
**Migration**: Use `grspec validate --specs`.

### Requirement: JSON Schema Definition
**Reason**: Documented as part of the retired `spec` command surface; Zod schemas remain as internal validation implementation.
**Migration**: No user migration; continue using `grspec validate --specs`.
