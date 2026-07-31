/**
 * Rule Generation Types
 *
 * Tool-agnostic interfaces for rule generation.
 * Parallels command-generation/types.ts — separates "what to generate" from "how to format it".
 */

/**
 * Tool-agnostic rule data.
 * Represents the content of a rule without any tool-specific formatting.
 */
export interface RuleContent {
  /** Rule identifier (e.g., 'code-philosophy') */
  id: string;
  /** Human-readable description for tool frontmatter */
  description: string;
  /** The rule instruction content (markdown body, shared across all tools) */
  body: string;
}

/**
 * Per-tool formatting strategy for rules.
 * Each AI tool implements this interface to handle its specific rules directory,
 * file extension, and frontmatter format.
 */
export interface ToolRuleAdapter {
  /** Tool identifier matching AIToolOption.value (e.g., 'cursor', 'claude') */
  toolId: string;
  /**
   * Returns the file path for a rule.
   * @param ruleId - The rule identifier (e.g., 'code-philosophy')
   * @returns Path from project root (e.g., '.cursor/rules/grspec-code-philosophy.mdc')
   */
  getRuleFilePath(ruleId: string): string;
  /**
   * Formats the complete rule file content including frontmatter.
   * @param content - The tool-agnostic rule content
   * @returns Complete file content ready to write
   */
  formatRuleFile(content: RuleContent): string;
}

/**
 * Result of generating a rule file.
 */
export interface GeneratedRule {
  /** File path from project root */
  path: string;
  /** Complete file content (frontmatter + body) */
  fileContent: string;
}
