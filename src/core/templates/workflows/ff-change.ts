import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getFfChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-ff-change',
    description: 'Fast-forward through grspec artifact creation. Use when the user wants to quickly create all artifacts needed for implementation without stepping through each one individually.',
    instructions: loadWorkflowTemplate('ff-change'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxFfCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Fast Forward',
    description: 'Create a change and generate all artifacts needed for implementation in one go',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: loadWorkflowTemplate('ff-change'),
  };
}
