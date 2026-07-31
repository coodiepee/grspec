import type { SkillTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getParallelDispatchSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-parallel',
    description: 'Parallel dispatch: split independent work across agents or sessions, partition by bounded context, pick models by strategy, then merge results safely.',
    instructions: loadWorkflowTemplate('parallel-dispatch'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}
