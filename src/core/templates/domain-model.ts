export function getDomainModelTemplate(track: 'new-project' | 'existing-project'): string {
  if (track === 'new-project') {
    return NEW_PROJECT_DOMAIN_MODEL;
  }
  return EXISTING_PROJECT_DOMAIN_MODEL;
}

const NEW_PROJECT_DOMAIN_MODEL = `# Domain Model

## Bounded Contexts

<!-- Define the business domains in your system -->

### <!-- Context Name -->

- **Purpose**: <!-- what this context is responsible for -->
- **Core Entities**: <!-- list key entities -->
- **Aggregates**: <!-- list aggregate roots -->

## Context Map

<!-- Define relationships between bounded contexts -->

| Source Context | Target Context | Relationship |
|---------------|---------------|-------------|
| <!-- context --> | <!-- context --> | <!-- upstream/downstream/partnership --> |

## Ubiquitous Language

<!-- Define key terms used across the team -->

| Term | Definition | Context |
|------|-----------|---------|
| <!-- term --> | <!-- definition --> | <!-- which bounded context --> |
`;

const EXISTING_PROJECT_DOMAIN_MODEL = `# Domain Model

> This file was generated for an existing project. Use grspec explore to reverse-engineer your domain model.
> Suggested command: Tell your AI assistant "Help me identify bounded contexts from the codebase structure"

## Bounded Contexts

<!-- Analyze directory structure, modules, and packages to identify domains -->

## Context Map

<!-- Analyze imports and dependencies between modules -->

## Ubiquitous Language

<!-- Extract key terms from code, docs, and domain logic -->
`;
