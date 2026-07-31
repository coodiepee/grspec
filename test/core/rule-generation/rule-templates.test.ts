import { describe, it, expect } from 'vitest';
import { getRuleTemplates } from '../../../src/core/rule-generation/rule-templates.js';

describe('rule-generation/rule-templates', () => {
  describe('getRuleTemplates', () => {
    it('should return at least one template', () => {
      const templates = getRuleTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(1);
    });

    it('should include code-philosophy template', () => {
      const templates = getRuleTemplates();
      const codePhilosophy = templates.find(t => t.ruleId === 'code-philosophy');
      expect(codePhilosophy).toBeDefined();
    });

    it('should have matching ruleId and content.id', () => {
      const templates = getRuleTemplates();
      for (const entry of templates) {
        expect(entry.ruleId).toBe(entry.content.id);
      }
    });

    it('code-philosophy template should cover all seven code standards', () => {
      const templates = getRuleTemplates();
      const codePhilosophy = templates.find(t => t.ruleId === 'code-philosophy')!;

      expect(codePhilosophy.content.body).toContain('## Naming');
      expect(codePhilosophy.content.body).toContain('## Abstraction Level');
      expect(codePhilosophy.content.body).toContain('## Abstraction Timing');
      expect(codePhilosophy.content.body).toContain('## Comments');
      expect(codePhilosophy.content.body).toContain('## Logic Justification');
      expect(codePhilosophy.content.body).toContain('## Explicit Assumptions');
      expect(codePhilosophy.content.body).toContain('## Simplicity');
    });

    it('code-philosophy template should use DO/DO NOT format with examples', () => {
      const templates = getRuleTemplates();
      const codePhilosophy = templates.find(t => t.ruleId === 'code-philosophy')!;
      const body = codePhilosophy.content.body;

      expect(body).toContain('- DO:');
      expect(body).toContain('- DO NOT:');
      expect(body).toContain('✓');
      expect(body).toContain('✗');
    });

    it('code-philosophy template should have a description', () => {
      const templates = getRuleTemplates();
      const codePhilosophy = templates.find(t => t.ruleId === 'code-philosophy')!;

      expect(codePhilosophy.content.description).toBeTruthy();
      expect(codePhilosophy.content.description.length).toBeGreaterThan(10);
    });
  });
});
