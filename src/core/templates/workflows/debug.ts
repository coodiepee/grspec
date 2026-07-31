import type { SkillTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getDebugSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-debug',
    description: 'Systematic debugging: reproduce, isolate, fix, verify. Use for failing tests, production bugs, flaky behavior, or confusing errors.',
    instructions: loadWorkflowTemplate('debug'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}
