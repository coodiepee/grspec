import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getGrsxProposeSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-propose',
    description: 'Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.',
    instructions: loadWorkflowTemplate('propose'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxProposeCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Propose',
    description: 'Propose a new change - create it and generate all artifacts in one step',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: loadWorkflowTemplate('propose'),
  };
}
