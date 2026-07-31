## Why

<!-- 1-2 sentences. What problem does this solve? Why now? -->

## What Changes

<!-- Bullet list. Be specific about new capabilities, modifications, or removals. Mark breaking changes with **BREAKING**. -->

## Capabilities

### New Capabilities
<!-- Each becomes specs/<name>/spec.md. Use kebab-case. -->
- `<name>`: <brief description>

### Modified Capabilities
<!-- ONLY list if spec-level REQUIREMENTS change (not just implementation).
     Use existing spec names from grspec/specs/. Leave EMPTY if no requirement changes.
     ANTI-CHECK: If you're listing something here, can you point to a specific SHALL statement that changes? If not, it doesn't belong here. -->
- `<existing-name>`: <what requirement is changing>

## Domain Context

<!-- Which bounded contexts does this change affect? What core entities are involved?
     Reference grspec/domain-model.md for context names.
     SKIP this section if the project has no domain-model.md. -->

## Risk Assessment

<!-- REQUIRED. Think adversarially:
     - Impact scope: how many modules/services touched?
     - Regression risk: what existing behavior could break?
     - Performance implications: any hot paths affected?
     WARNING: "No risk" is almost never true. If you wrote that, reconsider. -->

## Impact

<!-- Affected code, APIs, dependencies, systems -->
