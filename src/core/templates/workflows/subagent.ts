import type { SkillTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getSubagentSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-subagent',
    description: 'Subagent-driven development: delegate isolated slices to subagents with clear contracts, then review and merge with verification.',
    instructions: loadWorkflowTemplate('subagent'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}
