import { describe, it, expect } from 'vitest';
import path from 'path';
import { generateRule, generateRules } from '../../../src/core/rule-generation/generator.js';
import type { RuleContent, ToolRuleAdapter } from '../../../src/core/rule-generation/types.js';

describe('rule-generation/generator', () => {
  const sampleContent: RuleContent = {
    id: 'code-philosophy',
    description: 'Test rule description',
    body: '# Test Rule\n\nRule body.',
  };

  const mockAdapter: ToolRuleAdapter = {
    toolId: 'test-tool',
    getRuleFilePath(ruleId: string): string {
      return path.join('.test', 'rules', `grspec-${ruleId}.md`);
    },
    formatRuleFile(content: RuleContent): string {
      return `---\ndescription: ${content.description}\n---\n\n${content.body}\n`;
    },
  };

  describe('generateRule', () => {
    it('should return path from adapter', () => {
      const result = generateRule(sampleContent, mockAdapter);
      expect(result.path).toBe(path.join('.test', 'rules', 'grspec-code-philosophy.md'));
    });

    it('should return formatted content from adapter', () => {
      const result = generateRule(sampleContent, mockAdapter);
      expect(result.fileContent).toContain('description: Test rule description');
      expect(result.fileContent).toContain('# Test Rule');
    });
  });

  describe('generateRules', () => {
    it('should generate one rule per content entry', () => {
      const contents: RuleContent[] = [
        sampleContent,
        { id: 'testing', description: 'Testing rule', body: '# Testing' },
      ];
      const results = generateRules(contents, mockAdapter);
      expect(results).toHaveLength(2);
    });

    it('should use correct rule ID for each entry', () => {
      const contents: RuleContent[] = [
        sampleContent,
        { id: 'testing', description: 'Testing rule', body: '# Testing' },
      ];
      const results = generateRules(contents, mockAdapter);
      expect(results[0].path).toContain('grspec-code-philosophy');
      expect(results[1].path).toContain('grspec-testing');
    });

    it('should handle empty array', () => {
      const results = generateRules([], mockAdapter);
      expect(results).toHaveLength(0);
    });
  });
});
