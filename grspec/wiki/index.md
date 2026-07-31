---
title: "Wiki Index"
type: index
created: 2026-05-22
updated: 2026-05-22
---

# Wiki Index

Navigation catalog for the grspec wiki. Start here to find any topic.

## Concepts

| Page | Summary |
|------|---------|
| [[artifact-graph]] | DAG-based artifact dependency model for schema-driven workflows |
| [[artifact-gate-enforcement]] | Gate enforcement for artifact dependencies and plan completion |
| [[context-injection]] | How project context is injected into AI instructions |
| [[cross-platform-paths]] | Cross-platform path handling strategy (macOS, Linux, Windows) |
| [[delta-specs]] | Delta-based spec management with ADDED/MODIFIED/REMOVED/RENAMED |
| [[llm-wiki]] | The LLM wiki knowledge layer concept and three-layer architecture |
| [[profile-tiers]] | Four-tier profile system (minimal, standard, full, custom) |
| [[schema-resolution]] | Schema resolution precedence chain and directory lookup |
| [[spec-driven-workflow]] | The propose → design → specs → plan → apply → archive lifecycle |
| [[template-system]] | Template-based skill/command generation for 25+ AI tools |

## Entities — CLI Commands

| Page | Summary |
|------|---------|
| [[cli-archive]] | Archive command — moves changes to archive, applies delta specs |
| [[cli-artifact-workflow]] | Artifact workflow CLI — status, instructions, templates |
| [[cli-change]] | Change command — show, list, validate change proposals |
| [[cli-completion]] | Shell completion scripts for Zsh, Bash, Fish, PowerShell |
| [[cli-config]] | Config command — view and modify global configuration |
| [[cli-feedback]] | Feedback command — create GitHub issues via gh CLI |
| [[cli-init]] | Init command — create grspec structure, configure AI tools |
| [[cli-list]] | List command — overview of active changes with progress |
| [[cli-show]] | Show command — interactive display of changes and specs |
| [[cli-spec]] | Spec command — list, show, validate specifications |
| [[cli-update]] | Update command — refresh AI tool instructions |
| [[cli-validate]] | Validate command — validate changes and specs with remediation |
| [[cli-view]] | View command — comprehensive project dashboard |
| [[schema-commands]] | Schema management — init, validate, fork, which |
| [[schema-init-command]] | Schema init — create project-local schema skeletons |
| [[schema-validate-command]] | Schema validate — check schema syntax and dependency graphs |
| [[schema-fork-command]] | Schema fork — clone schemas into project-local directory |
| [[schema-which-command]] | Schema which — report resolved schema source and location |

## Entities — Core Modules

| Page | Summary |
|------|---------|
| [[ai-tool-paths]] | AI tool path metadata for skill/command generation |
| [[change-creation]] | Programmatic utilities for creating change directories |
| [[command-generation]] | Tool-agnostic command content and adapter system |
| [[config-loading]] | Config file discovery, parsing, validation with safe fallbacks |
| [[constitution]] | Constitution spec — template generation and validation |
| [[constitution-template]] | Constitution template for project bootstrap |
| [[context-injection]] | Context injection implementation module |
| [[docs-agent-instructions]] | Authoring standards for generated agent instruction docs |
| [[domain-model]] | Domain model spec — template generation and validation |
| [[domain-model-template]] | Domain model template for project bootstrap |
| [[global-config]] | Global user configuration (XDG-compliant) |
| [[instruction-loader]] | Template loading, enrichment, and parameter substitution |
| [[legacy-cleanup]] | Legacy artifact detection and cleanup |
| [[grspec-conventions]] | Meta-specification for conventions, format, and structure |
| [[plan-artifact]] | Plan artifact — implementation checklist with checkbox tracking |
| [[project-bootstrap]] | Ordered bootstrap phases for new/existing projects |
| [[project-config]] | Project-level configuration (grspec.yaml) |
| [[rules-injection]] | Per-artifact behavioral rules injection into instructions |
| [[telemetry]] | Anonymous usage telemetry via PostHog |
| [[wiki-management]] | Wiki operational module — CLI, linting, delta merging |

## Entities — Skills & Infrastructure

| Page | Summary |
|------|---------|
| [[artifact-gate-enforcement]] | Artifact gate enforcement implementation module |
| [[artifact-graph]] | Artifact graph implementation module |
| [[ci-nix-validation]] | Nix flake CI validation for reproducible builds |
| [[collaboration-infra]] | Parallel dispatch and subagent skill templates |
| [[execution-discipline]] | TDD, verify, debug, review skills with anti-rationalization |
| [[grsx-archive-skill]] | /grsx:archive skill — guided archive workflow |
| [[grsx-onboard-skill]] | /grsx:onboard skill — guided onboarding walkthrough |
| [[grsx-verify-skill]] | /grsx:verify skill — implementation verification |
| [[profile-tiers]] | Profile tiers implementation module |
| [[schema-resolution]] | Schema resolution implementation module |
| [[specs-sync-skill]] | /grsx:sync skill — merge delta specs without archiving |
| [[workspace-foundation]] | Coordination workspaces for cross-repo planning |

## Sources

| Page | Summary |
|------|---------|
| [[project-evolution]] | Project history across 85 archived changes |
| [[recent-milestones]] | Notable recent changes (2026-05) |

## Comparisons

| Page | Summary |
|------|---------|
| [[delta-vs-monolithic-changes]] | Why grspec uses delta-based spec changes |
| [[programmatic-vs-agent-merge]] | Programmatic spec merge vs agent-driven merge |
