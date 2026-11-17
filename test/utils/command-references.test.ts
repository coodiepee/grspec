import { describe, it, expect } from 'vitest';
import {
  resolveSkillInstructionTransformer,
  transformToGrspecSkillCommands,
  transformToHyphenCommands,
} from '../../src/utils/command-references.js';

describe('transformToHyphenCommands', () => {
  describe('basic transformations', () => {
    it('should transform single command reference', () => {
      expect(transformToHyphenCommands('/grsx:new')).toBe('/grsx-new');
    });

    it('should transform multiple command references', () => {
      const input = '/grsx:new and /grsx:apply';
      const expected = '/grsx-new and /grsx-apply';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });

    it('should transform command reference in context', () => {
      const input = 'Use /grsx:apply to implement tasks';
      const expected = 'Use /grsx-apply to implement tasks';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });

    it('should handle backtick-quoted commands', () => {
      const input = 'Run `/grsx:continue` to proceed';
      const expected = 'Run `/grsx-continue` to proceed';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should return unchanged text with no command references', () => {
      const input = 'This is plain text without commands';
      expect(transformToHyphenCommands(input)).toBe(input);
    });

    it('should return empty string unchanged', () => {
      expect(transformToHyphenCommands('')).toBe('');
    });

    it('should not transform similar but non-matching patterns', () => {
      const input = '/ops:new grsx: /other:command';
      expect(transformToHyphenCommands(input)).toBe(input);
    });

    it('should handle multiple occurrences on same line', () => {
      const input = '/grsx:new /grsx:continue /grsx:apply';
      const expected = '/grsx-new /grsx-continue /grsx-apply';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('multiline content', () => {
    it('should transform references across multiple lines', () => {
      const input = `Use /grsx:new to start
Then /grsx:continue to proceed
Finally /grsx:apply to implement`;
      const expected = `Use /grsx-new to start
Then /grsx-continue to proceed
Finally /grsx-apply to implement`;
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('all known commands', () => {
    const commands = [
      'new',
      'continue',
      'apply',
      'ff',
      'sync',
      'archive',
      'bulk-archive',
      'verify',
      'explore',
      'onboard',
    ];

    for (const cmd of commands) {
      it(`should transform /grsx:${cmd}`, () => {
        expect(transformToHyphenCommands(`/grsx:${cmd}`)).toBe(`/grsx-${cmd}`);
      });
    }
  });
});

describe('transformToGrspecSkillCommands', () => {
  it('should map command ids to generated skill names', () => {
    expect(transformToGrspecSkillCommands('/grsx:apply')).toBe('/grspec-apply-change');
    expect(transformToGrspecSkillCommands('/grsx:new')).toBe('/grspec-new-change');
    expect(transformToGrspecSkillCommands('/grsx:sync')).toBe('/grspec-sync-specs');
    expect(transformToGrspecSkillCommands('/grsx:archive')).toBe('/grspec-archive-change');
    expect(transformToGrspecSkillCommands('/grsx:propose')).toBe('/grspec-propose');
  });

  it('should rewrite references inside sentences and backticks', () => {
    const input = 'Run `/grsx:apply` after /grsx:verify';
    expect(transformToGrspecSkillCommands(input)).toBe(
      'Run `/grspec-apply-change` after /grspec-verify'
    );
  });

  it('should leave unknown command ids untouched', () => {
    expect(transformToGrspecSkillCommands('/grsx:unknown')).toBe('/grsx:unknown');
  });

  it('should leave text without references unchanged', () => {
    const input = 'No commands here';
    expect(transformToGrspecSkillCommands(input)).toBe(input);
  });
});

describe('resolveSkillInstructionTransformer', () => {
  it('should return the skill-name transform for DeepSeek Harness', () => {
    const transformer = resolveSkillInstructionTransformer('deepseek');
    expect(transformer?.('/grsx:apply')).toBe('/grspec-apply-change');
  });

  it('should return the hyphen transform for OpenCode and Pi', () => {
    expect(resolveSkillInstructionTransformer('opencode')?.('/grsx:new')).toBe('/grsx-new');
    expect(resolveSkillInstructionTransformer('pi')?.('/grsx:new')).toBe('/grsx-new');
  });

  it('should return undefined for tools with native commands', () => {
    expect(resolveSkillInstructionTransformer('claude')).toBeUndefined();
    expect(resolveSkillInstructionTransformer('kimi')).toBeUndefined();
  });
});
