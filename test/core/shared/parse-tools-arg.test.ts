import { describe, it, expect } from 'vitest';
import { parseToolsArg } from '../../../src/core/shared/parse-tools-arg.js';

describe('parseToolsArg', () => {
  it('returns all tools when value is all', () => {
    const tools = parseToolsArg('all');
    expect(tools).toContain('cursor');
    expect(tools).toContain('grcode');
  });

  it('returns empty list for none', () => {
    expect(parseToolsArg('none')).toEqual([]);
  });

  it('parses comma-separated tool ids', () => {
    expect(parseToolsArg('grcode,cursor')).toEqual(['grcode', 'cursor']);
  });

  it('throws for unknown tool id', () => {
    expect(() => parseToolsArg('not-a-tool')).toThrow(/Invalid tool\(s\): not-a-tool/);
  });
});
