import type { SkillTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getReviewSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-review',
    description: 'Dual-stage code review: (1) spec compliance, then (2) code quality. Use after implementation or before merge when changes must match written intent.',
    instructions: loadWorkflowTemplate('review'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}
