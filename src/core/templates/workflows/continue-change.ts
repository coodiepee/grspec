import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getContinueChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-continue-change',
    description: 'Continue working on an grspec change by creating the next artifact. Use when the user wants to progress their change, create the next artifact, or continue their workflow.',
    instructions: loadWorkflowTemplate('continue-change'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxContinueCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Continue',
    description: 'Continue working on a change - create the next artifact (Experimental)',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: loadWorkflowTemplate('continue-change'),
  };
}
