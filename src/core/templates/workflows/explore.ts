import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getExploreSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-explore',
    description: 'Enter explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements. Use when the user wants to think through something before or during a change.',
    instructions: loadWorkflowTemplate('explore'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxExploreCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Explore',
    description: 'Enter explore mode - think through ideas, investigate problems, clarify requirements',
    category: 'Workflow',
    tags: ['workflow', 'explore', 'experimental', 'thinking'],
    content: loadWorkflowTemplate('explore'),
  };
}
