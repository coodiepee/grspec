import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getNewChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-new-change',
    description: 'Start a new grspec change using the experimental artifact workflow. Use when the user wants to create a new feature, fix, or modification with a structured step-by-step approach.',
    instructions: loadWorkflowTemplate('new-change'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxNewCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: New',
    description: 'Start a new change using the experimental artifact workflow (GRSX)',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: loadWorkflowTemplate('new-change'),
  };
}
