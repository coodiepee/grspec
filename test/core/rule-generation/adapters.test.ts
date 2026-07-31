import { describe, it, expect } from 'vitest';
import path from 'path';
import { cursorRuleAdapter } from '../../../src/core/rule-generation/adapters/cursor.js';
import { claudeRuleAdapter } from '../../../src/core/rule-generation/adapters/claude.js';
import { windsurfRuleAdapter } from '../../../src/core/rule-generation/adapters/windsurf.js';
import { clineRuleAdapter } from '../../../src/core/rule-generation/adapters/cline.js';
import { roocodeRuleAdapter } from '../../../src/core/rule-generation/adapters/roocode.js';
import { githubCopilotRuleAdapter } from '../../../src/core/rule-generation/adapters/github-copilot.js';
import { kilocodeRuleAdapter } from '../../../src/core/rule-generation/adapters/kilocode.js';
import { createGenericRuleAdapter, genericRuleAdapters } from '../../../src/core/rule-generation/adapters/generic.js';
import type { RuleContent } from '../../../src/core/rule-generation/types.js';

describe('rule-generation/adapters', () => {
  const sampleContent: RuleContent = {
    id: 'code-philosophy',
    description: 'Seven meta-rules governing code quality',
    body: '# Code Philosophy\n\nRule content here.',
  };

  describe('cursorRuleAdapter', () => {
    it('should have correct toolId', () => {
      expect(cursorRuleAdapter.toolId).toBe('cursor');
    });

    it('should generate correct file path with .mdc extension', () => {
      expect(cursorRuleAdapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.cursor', 'rules', 'grspec-code-philosophy.mdc'));
    });

    it('should generate different paths for different rule IDs', () => {
      expect(cursorRuleAdapter.getRuleFilePath('testing-conventions'))
        .toBe(path.join('.cursor', 'rules', 'grspec-testing-conventions.mdc'));
    });

    it('should format file with alwaysApply frontmatter', () => {
      const output = cursorRuleAdapter.formatRuleFile(sampleContent);

      expect(output).toContain('---\n');
      expect(output).toContain('description: Seven meta-rules governing code quality');
      expect(output).toContain('alwaysApply: true');
      expect(output).toContain('---\n\n');
      expect(output).toContain('# Code Philosophy');
      expect(output).toContain('Rule content here.');
    });
  });

  describe('claudeRuleAdapter', () => {
    it('should have correct toolId', () => {
      expect(claudeRuleAdapter.toolId).toBe('claude');
    });

    it('should generate correct file path', () => {
      expect(claudeRuleAdapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.claude', 'rules', 'grspec-code-philosophy.md'));
    });

    it('should format file without frontmatter', () => {
      const output = claudeRuleAdapter.formatRuleFile(sampleContent);

      expect(output).not.toContain('---');
      expect(output).toContain('# Code Philosophy');
      expect(output).toContain('Rule content here.');
    });
  });

  describe('windsurfRuleAdapter', () => {
    it('should have correct toolId', () => {
      expect(windsurfRuleAdapter.toolId).toBe('windsurf');
    });

    it('should generate correct file path', () => {
      expect(windsurfRuleAdapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.windsurf', 'rules', 'grspec-code-philosophy.md'));
    });

    it('should format file with trigger: always_on frontmatter', () => {
      const output = windsurfRuleAdapter.formatRuleFile(sampleContent);

      expect(output).toContain('trigger: always_on');
      expect(output).toContain('description: Seven meta-rules governing code quality');
      expect(output).toContain('# Code Philosophy');
    });
  });

  describe('clineRuleAdapter', () => {
    it('should have correct toolId', () => {
      expect(clineRuleAdapter.toolId).toBe('cline');
    });

    it('should generate correct file path in .clinerules/', () => {
      expect(clineRuleAdapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.clinerules', 'grspec-code-philosophy.md'));
    });

    it('should format file with alwaysApply frontmatter', () => {
      const output = clineRuleAdapter.formatRuleFile(sampleContent);

      expect(output).toContain('alwaysApply: true');
      expect(output).toContain('description: Seven meta-rules governing code quality');
      expect(output).toContain('# Code Philosophy');
    });
  });

  describe('roocodeRuleAdapter', () => {
    it('should have correct toolId', () => {
      expect(roocodeRuleAdapter.toolId).toBe('roocode');
    });

    it('should generate correct file path in .roo/rules/', () => {
      expect(roocodeRuleAdapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.roo', 'rules', 'grspec-code-philosophy.md'));
    });

    it('should format file without frontmatter', () => {
      const output = roocodeRuleAdapter.formatRuleFile(sampleContent);

      expect(output).not.toContain('---');
      expect(output).toContain('# Code Philosophy');
    });
  });

  describe('githubCopilotRuleAdapter', () => {
    it('should have correct toolId', () => {
      expect(githubCopilotRuleAdapter.toolId).toBe('github-copilot');
    });

    it('should generate correct file path with .instructions.md extension', () => {
      expect(githubCopilotRuleAdapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.github', 'instructions', 'grspec-code-philosophy.instructions.md'));
    });

    it('should format file with applyTo: "**" frontmatter', () => {
      const output = githubCopilotRuleAdapter.formatRuleFile(sampleContent);

      expect(output).toContain('applyTo: "**"');
      expect(output).toContain('description: Seven meta-rules governing code quality');
      expect(output).toContain('# Code Philosophy');
    });
  });

  describe('kilocodeRuleAdapter', () => {
    it('should have correct toolId', () => {
      expect(kilocodeRuleAdapter.toolId).toBe('kilocode');
    });

    it('should generate correct file path', () => {
      expect(kilocodeRuleAdapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.kilocode', 'rules', 'grspec-code-philosophy.md'));
    });

    it('should format file with alwaysApply frontmatter', () => {
      const output = kilocodeRuleAdapter.formatRuleFile(sampleContent);

      expect(output).toContain('alwaysApply: true');
      expect(output).toContain('description: Seven meta-rules governing code quality');
    });
  });

  describe('createGenericRuleAdapter', () => {
    it('should create adapter with correct toolId', () => {
      const adapter = createGenericRuleAdapter('auggie', '.augment');
      expect(adapter.toolId).toBe('auggie');
    });

    it('should generate file path using skillsDir', () => {
      const adapter = createGenericRuleAdapter('auggie', '.augment');
      expect(adapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.augment', 'rules', 'grspec-code-philosophy.md'));
    });

    it('should format file without frontmatter', () => {
      const adapter = createGenericRuleAdapter('auggie', '.augment');
      const output = adapter.formatRuleFile(sampleContent);

      expect(output).not.toContain('---');
      expect(output).toContain('# Code Philosophy');
    });

    it('should use different skillsDir for different tools', () => {
      const bobAdapter = createGenericRuleAdapter('bob', '.bob');
      expect(bobAdapter.getRuleFilePath('code-philosophy'))
        .toBe(path.join('.bob', 'rules', 'grspec-code-philosophy.md'));
    });
  });

  describe('genericRuleAdapters', () => {
    it('should contain adapters for Tier 2 tools', () => {
      const toolIds = genericRuleAdapters.map(a => a.toolId);
      expect(toolIds).toContain('grcode');
      expect(toolIds).toContain('auggie');
      expect(toolIds).toContain('gemini');
      expect(toolIds).toContain('codex');
    });

    it('should NOT contain Tier 1 tools', () => {
      const toolIds = new Set(genericRuleAdapters.map(a => a.toolId));
      expect(toolIds.has('cursor')).toBe(false);
      expect(toolIds.has('claude')).toBe(false);
      expect(toolIds.has('windsurf')).toBe(false);
      expect(toolIds.has('cline')).toBe(false);
      expect(toolIds.has('roocode')).toBe(false);
      expect(toolIds.has('github-copilot')).toBe(false);
      expect(toolIds.has('kilocode')).toBe(false);
    });
  });

  describe('shared body across tools', () => {
    it('should produce identical body content for different tools', () => {
      const cursorOutput = cursorRuleAdapter.formatRuleFile(sampleContent);
      const claudeOutput = claudeRuleAdapter.formatRuleFile(sampleContent);

      expect(cursorOutput).toContain(sampleContent.body);
      expect(claudeOutput).toContain(sampleContent.body);
    });
  });
});
