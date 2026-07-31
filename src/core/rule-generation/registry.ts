/**
 * Rule Adapter Registry
 *
 * Centralized registry for tool rule adapters.
 * Mirrors CommandAdapterRegistry in command-generation/.
 */

import type { ToolRuleAdapter } from './types.js';
import { cursorRuleAdapter } from './adapters/cursor.js';
import { claudeRuleAdapter } from './adapters/claude.js';
import { windsurfRuleAdapter } from './adapters/windsurf.js';
import { clineRuleAdapter } from './adapters/cline.js';
import { roocodeRuleAdapter } from './adapters/roocode.js';
import { githubCopilotRuleAdapter } from './adapters/github-copilot.js';
import { kilocodeRuleAdapter } from './adapters/kilocode.js';
import { genericRuleAdapters } from './adapters/generic.js';

export class RuleAdapterRegistry {
  private static adapters: Map<string, ToolRuleAdapter> = new Map();

  static {
    // Tier 1: tools with documented rules directory conventions
    RuleAdapterRegistry.register(cursorRuleAdapter);
    RuleAdapterRegistry.register(claudeRuleAdapter);
    RuleAdapterRegistry.register(windsurfRuleAdapter);
    RuleAdapterRegistry.register(clineRuleAdapter);
    RuleAdapterRegistry.register(roocodeRuleAdapter);
    RuleAdapterRegistry.register(githubCopilotRuleAdapter);
    RuleAdapterRegistry.register(kilocodeRuleAdapter);

    // Tier 2: generic adapters for tools without documented rules conventions
    for (const adapter of genericRuleAdapters) {
      RuleAdapterRegistry.register(adapter);
    }
  }

  static register(adapter: ToolRuleAdapter): void {
    RuleAdapterRegistry.adapters.set(adapter.toolId, adapter);
  }

  static get(toolId: string): ToolRuleAdapter | undefined {
    return RuleAdapterRegistry.adapters.get(toolId);
  }

  static getAll(): ToolRuleAdapter[] {
    return Array.from(RuleAdapterRegistry.adapters.values());
  }

  static has(toolId: string): boolean {
    return RuleAdapterRegistry.adapters.has(toolId);
  }
}
