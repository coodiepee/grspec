import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getApplyChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-apply-change',
    description: 'Implement plan items from an grspec change. Use when the user wants to start implementing, continue implementation, or work through the plan.',
    instructions: loadWorkflowTemplate('apply-change'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxApplyCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Apply',
    description: 'Implement plan items from an grspec change (Experimental)',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: loadWorkflowTemplate('apply-change'),
  };
}
