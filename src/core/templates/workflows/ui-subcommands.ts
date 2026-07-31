import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

interface UiSubcommandDefinition {
  commandId: string;
  skillName: string;
  description: string;
  contentTemplateName: string;
  tags: string[];
}

const UI_SUBCOMMAND_DEFINITIONS = [
  {
    commandId: 'ui-init',
    skillName: 'grspec-ui-init',
    description:
      'Smart UI initialization — analyzes your codebase, infers design system parameters, and generates a persisted design system with adaptive user confirmation. Use when setting up a project\'s design system for the first time.',
    contentTemplateName: 'ui-init',
    tags: ['ui', 'ux', 'design', 'init'],
  },
  {
    commandId: 'ui-search',
    skillName: 'grspec-ui-search',
    description:
      'Search the grspec UI/UX knowledge base by domain or stack. Use when exploring styles, colors, typography, UX patterns, or stack-specific guidance.',
    contentTemplateName: 'ui-search',
    tags: ['ui', 'ux', 'design', 'search'],
  },
  {
    commandId: 'ui-design-system',
    skillName: 'grspec-ui-design-system',
    description:
      'Generate a complete design system from a natural-language query. Use when persisting change-level ui/pages/ or project pages (not project MASTER — use init for that).',
    contentTemplateName: 'ui-design-system',
    tags: ['ui', 'ux', 'design', 'design-system'],
  },
  {
    commandId: 'ui-rules',
    skillName: 'grspec-ui-rules',
    description:
      'Query structured UI/UX rules with platform, severity, and checklist filters. Use during implementation and review for compliance guidance.',
    contentTemplateName: 'ui-rules',
    tags: ['ui', 'ux', 'design', 'rules'],
  },
  {
    commandId: 'ui-reference',
    skillName: 'grspec-ui-reference',
    description:
      'View full design specifications for a named style. Use when you need token and component detail for a chosen style.',
    contentTemplateName: 'ui-reference',
    tags: ['ui', 'ux', 'design', 'reference'],
  },
  {
    commandId: 'ui-review',
    skillName: 'grspec-ui-review',
    description:
      'Agent-driven UX quality review combining static analysis with semantic understanding to audit UI code against 205 rules across 10 categories.',
    contentTemplateName: 'ui-review',
    tags: ['ui', 'ux', 'design', 'review'],
  },
  {
    commandId: 'ui-status',
    skillName: 'grspec-ui-status',
    description:
      'Show project UI configuration — design-system presence, style, and upstream version. Use before init or when validating token sources.',
    contentTemplateName: 'ui-status',
    tags: ['ui', 'ux', 'design', 'status'],
  },
  {
    commandId: 'ui-detect',
    skillName: 'grspec-ui-detect',
    description:
      'Detect UI content in a grspec change and write structured ui metadata. Use for catch-up or manual UI concern activation.',
    contentTemplateName: 'ui-detect',
    tags: ['ui', 'ux', 'design', 'detect', 'workflow'],
  },
  {
    commandId: 'ui-install',
    skillName: 'grspec-ui-install',
    description:
      'Export grspec UI skill content to other AI platforms. Use when setting up UI intelligence outside Cursor.',
    contentTemplateName: 'ui-install',
    tags: ['ui', 'ux', 'design', 'install'],
  },
  {
    commandId: 'ui-sync',
    skillName: 'grspec-ui-sync',
    description:
      'Check and synchronize upstream UI knowledge base data. Use when datasets may be stale.',
    contentTemplateName: 'ui-sync',
    tags: ['ui', 'ux', 'design', 'sync'],
  },
] as const satisfies readonly UiSubcommandDefinition[];

function createUiSubcommandSkillTemplate(definition: UiSubcommandDefinition): SkillTemplate {
  return {
    name: definition.skillName,
    description: definition.description,
    instructions: loadWorkflowTemplate(definition.contentTemplateName),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}

function createUiSubcommandCommandTemplate(definition: UiSubcommandDefinition): CommandTemplate {
  return {
    name: `/grsx-${definition.commandId}`,
    description: definition.description,
    category: 'design',
    tags: [...definition.tags],
    content: loadWorkflowTemplate(definition.contentTemplateName),
  };
}

export const UI_SUBCOMMAND_SKILL_DIR_NAMES: Record<string, string> = Object.fromEntries(
  UI_SUBCOMMAND_DEFINITIONS.map((definition) => [definition.commandId, definition.skillName])
);

export function getUiSubcommandDefinitions(): readonly UiSubcommandDefinition[] {
  return UI_SUBCOMMAND_DEFINITIONS;
}

export function getUiInitSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[0]);
}

export function getUiSearchSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[1]);
}

export function getUiDesignSystemSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[2]);
}

export function getUiRulesSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[3]);
}

export function getUiReferenceSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[4]);
}

export function getUiReviewSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[5]);
}

export function getUiStatusSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[6]);
}

export function getUiDetectSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[7]);
}

export function getUiInstallSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[8]);
}

export function getUiSyncSkillTemplate(): SkillTemplate {
  return createUiSubcommandSkillTemplate(UI_SUBCOMMAND_DEFINITIONS[9]);
}

export function getGrsxUiInitCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[0]);
}

export function getGrsxUiSearchCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[1]);
}

export function getGrsxUiDesignSystemCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[2]);
}

export function getGrsxUiRulesCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[3]);
}

export function getGrsxUiReferenceCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[4]);
}

export function getGrsxUiReviewCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[5]);
}

export function getGrsxUiStatusCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[6]);
}

export function getGrsxUiDetectCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[7]);
}

export function getGrsxUiInstallCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[8]);
}

export function getGrsxUiSyncCommandTemplate(): CommandTemplate {
  return createUiSubcommandCommandTemplate(UI_SUBCOMMAND_DEFINITIONS[9]);
}
