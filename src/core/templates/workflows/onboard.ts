import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getOnboardSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-onboard',
    description: 'Guided onboarding for grspec - walk through a complete workflow cycle with narration and real codebase work.',
    instructions: loadWorkflowTemplate('onboard'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}


export function getGrsxOnboardCommandTemplate(): CommandTemplate {
  return {
    name: 'GRSX: Onboard',
    description: 'Guided onboarding - walk through a complete grspec workflow cycle with narration',
    category: 'Workflow',
    tags: ['workflow', 'onboarding', 'tutorial', 'learning'],
    content: loadWorkflowTemplate('onboard'),
  };
}
