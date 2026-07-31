import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getArchiveChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-archive-change',
    description: 'Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.',
    instructions: loadWorkflowTemplate('archive-change'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxArchiveCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Archive',
    description: 'Archive a completed change in the experimental workflow',
    category: 'Workflow',
    tags: ['workflow', 'archive', 'experimental'],
    content: loadWorkflowTemplate('archive-change'),
  };
}
