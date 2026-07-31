## REMOVED Requirements

### Requirement: Change Command
**Reason**: Duplicate of verb-first `grspec show` / `grspec list` / `grspec validate --changes`.
**Migration**: Use verb-first commands. Stacking helpers remain under `grspec change overlap|graph|next|split`.

### Requirement: Legacy Compatibility
**Reason**: Deprecation bridge for noun/verb list confusion is retired.
**Migration**: Use `grspec list` directly.

### Requirement: Interactive show selection
**Reason**: Interactive show belongs on verb-first `grspec show`.
**Migration**: Use `grspec show` without a name where interactive selection is supported.

### Requirement: Interactive validation selection
**Reason**: Interactive validate belongs on verb-first `grspec validate`.
**Migration**: Use `grspec validate --changes`.
