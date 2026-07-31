import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getValidateSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-validate',
    description:
      'Run grspec validate for structural checks on changes and specs. Use when checking delta/spec format before verify or archive — not for implementation completeness.',
    instructions: loadWorkflowTemplate('validate'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}

export function getGrsxValidateCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Validate',
    description: 'Run grspec validate — structural checks on changes and specs',
    category: 'Workflow',
    tags: ['workflow', 'validate'],
    content: loadWorkflowTemplate('validate'),
  };
}
