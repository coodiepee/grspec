import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getSyncSpecsSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-sync-specs',
    description: 'Sync delta specs from a change to main specs. Use when the user wants to update main specs with changes from a delta spec, without archiving the change.',
    instructions: loadWorkflowTemplate('sync-specs'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxSyncCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Sync',
    description: 'Sync delta specs from a change to main specs',
    category: 'Workflow',
    tags: ['workflow', 'specs', 'experimental'],
    content: loadWorkflowTemplate('sync-specs'),
  };
}
