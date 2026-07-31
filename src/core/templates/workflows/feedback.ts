import type { SkillTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getFeedbackSkillTemplate(): SkillTemplate {
  return {
    name: 'feedback',
    description: 'Collect and submit user feedback about grspec with context enrichment and anonymization.',
    instructions: loadWorkflowTemplate('feedback'),
    license: 'MIT',
    compatibility: 'Requires grspec CLI.',
    metadata: { author: 'grspec', version: '1.0' },
  };
}
