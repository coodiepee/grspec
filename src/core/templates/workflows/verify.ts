import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getVerifySkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-verify',
    description:
      'Verify implementation matches change artifacts and require build/test/lint evidence before claiming ready. Use before archiving or when validating completeness, correctness, and coherence.',
    instructions: loadWorkflowTemplate('verify'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}

export function getGrsxVerifyCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Verify',
    description: 'Verify implementation matches change artifacts before archiving',
    category: 'Workflow',
    tags: ['workflow', 'verify'],
    content: loadWorkflowTemplate('verify'),
  };
}
