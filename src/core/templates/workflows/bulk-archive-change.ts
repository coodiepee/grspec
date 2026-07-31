import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getBulkArchiveChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-bulk-archive-change',
    description: 'Archive multiple completed changes at once. Use when archiving several parallel changes.',
    instructions: loadWorkflowTemplate('bulk-archive-change'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxBulkArchiveCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Bulk Archive',
    description: 'Archive multiple completed changes at once',
    category: 'Workflow',
    tags: ['workflow', 'archive', 'experimental', 'bulk'],
    content: loadWorkflowTemplate('bulk-archive-change'),
  };
}
