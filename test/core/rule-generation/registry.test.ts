import { describe, it, expect } from 'vitest';
import { RuleAdapterRegistry } from '../../../src/core/rule-generation/registry.js';

describe('rule-generation/registry', () => {
  describe('RuleAdapterRegistry', () => {
    it('should return Cursor adapter', () => {
      const adapter = RuleAdapterRegistry.get('cursor');
      expect(adapter).toBeDefined();
      expect(adapter!.toolId).toBe('cursor');
    });

    it('should return Claude adapter', () => {
      const adapter = RuleAdapterRegistry.get('claude');
      expect(adapter).toBeDefined();
      expect(adapter!.toolId).toBe('claude');
    });

    it('should return Windsurf adapter', () => {
      const adapter = RuleAdapterRegistry.get('windsurf');
      expect(adapter).toBeDefined();
      expect(adapter!.toolId).toBe('windsurf');
    });

    it('should return Cline adapter', () => {
      expect(RuleAdapterRegistry.get('cline')).toBeDefined();
    });

    it('should return RooCode adapter', () => {
      expect(RuleAdapterRegistry.get('roocode')).toBeDefined();
    });

    it('should return GitHub Copilot adapter', () => {
      expect(RuleAdapterRegistry.get('github-copilot')).toBeDefined();
    });

    it('should return Kilo Code adapter', () => {
      expect(RuleAdapterRegistry.get('kilocode')).toBeDefined();
    });

    it('should return generic adapter for Tier 2 tools', () => {
      const adapter = RuleAdapterRegistry.get('grcode');
      expect(adapter).toBeDefined();
      expect(adapter!.toolId).toBe('grcode');
    });

    it('should return undefined for unregistered tool', () => {
      expect(RuleAdapterRegistry.get('nonexistent')).toBeUndefined();
    });

    it('should report has() correctly', () => {
      expect(RuleAdapterRegistry.has('cursor')).toBe(true);
      expect(RuleAdapterRegistry.has('nonexistent')).toBe(false);
    });

    it('should return all adapters', () => {
      const all = RuleAdapterRegistry.getAll();
      expect(all.length).toBeGreaterThan(7);
      const toolIds = all.map(a => a.toolId);
      expect(toolIds).toContain('cursor');
      expect(toolIds).toContain('claude');
      expect(toolIds).toContain('grcode');
    });
  });
});
