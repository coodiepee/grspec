# Domain Model

## Bounded Contexts

### CLI Interface

- **Purpose**: User-facing command parsing and execution
- **Core Entities**: Command, Option, Argument
- **Key Modules**: src/cli/, src/commands/

### Artifact Workflow

- **Purpose**: Manage change lifecycle (propose → plan → apply → archive)
- **Core Entities**: Change, Artifact, Schema, ArtifactGraph
- **Key Modules**: src/core/artifact-graph/, src/commands/workflow/

### Template System

- **Purpose**: Generate skill/command files for AI tools
- **Core Entities**: SkillTemplate, CommandTemplate, WorkflowTemplate
- **Key Modules**: src/core/templates/, src/core/command-generation/

### Spec Management

- **Purpose**: Manage domain specifications and delta sync
- **Core Entities**: Spec, Requirement, Scenario, DeltaOperation
- **Key Modules**: src/core/parsers/, src/core/specs-apply.ts

### Configuration

- **Purpose**: Project and global configuration management
- **Core Entities**: ProjectConfig, GlobalConfig, Profile
- **Key Modules**: src/core/project-config.ts, src/core/global-config.ts

### Shell Completions

- **Purpose**: Generate shell completion scripts for multiple shells
- **Core Entities**: CompletionProvider, CompletionInstaller
- **Key Modules**: src/core/completions/

## Context Map

| Source | Target | Relationship |
|--------|--------|-------------|
| CLI Interface | Artifact Workflow | Upstream (CLI dispatches to workflow) |
| Artifact Workflow | Template System | Downstream (workflow uses templates) |
| Artifact Workflow | Spec Management | Downstream (workflow triggers spec sync) |
| Template System | Configuration | Downstream (templates read config) |
| CLI Interface | Configuration | Downstream (CLI reads/writes config) |

## Ubiquitous Language

| Term | Definition | Context |
|------|-----------|---------|
| Change | A unit of work with proposal, specs, design, and plan | Artifact Workflow |
| Artifact | A document produced during a change (proposal.md, plan.md, etc.) | Artifact Workflow |
| Schema | A workflow definition specifying artifacts and their dependencies | Artifact Workflow |
| Skill | A template-generated instruction file for AI tools | Template System |
| Spec | A capability specification with requirements and scenarios | Spec Management |
| Delta | A set of requirement changes (ADDED/MODIFIED/REMOVED) | Spec Management |
