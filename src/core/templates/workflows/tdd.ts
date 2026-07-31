import type { SkillTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getTddSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-tdd',
    description: 'Test-driven development: RED → GREEN → REFACTOR. Use when implementing or refactoring code where behavior must be proven by tests (especially core logic).',
    instructions: loadWorkflowTemplate('tdd'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}
