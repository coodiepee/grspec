/**
 * Rule Templates
 *
 * Registry of rule content templates that grspec generates during init/update.
 * Each entry defines a rule's id, description (for frontmatter), and body (shared content).
 */

import type { RuleContent } from './types.js';

export interface RuleTemplateEntry {
  content: RuleContent;
  ruleId: string;
}

function getCodePhilosophyRuleContent(): RuleContent {
  return {
    id: 'code-philosophy',
    description: 'Seven code standards: naming, abstraction, comments, logic, assumptions, simplicity — DO/DO NOT format',
    body: `# Code Standards

## Naming
- DO: Use self-documenting names readable without surrounding code
  \`\`\`
  ✓ userAuthToken, specValidationErrors, changeArchivePath
  \`\`\`
- DO NOT: Use generic placeholders
  \`\`\`
  ✗ data, info, process, tmp, result, item, val, resp
  \`\`\`

## Abstraction Level
- DO: Keep every statement in a function at the same abstraction level. Delegate formatting, I/O, and data manipulation to named helpers.
- DO NOT: Mix business decisions with low-level operations in the same function.
- Test: Can you describe the function in one sentence without "and"? If not, split it.

## Abstraction Timing
- DO: Tolerate local duplication until a pattern appears a third time.
- DO NOT: Extract shared abstractions on the second occurrence. The wrong abstraction is more expensive than repetition.

## Comments
- DO: Explain WHY — decisions, constraints, non-obvious trade-offs.
  \`\`\`
  ✓ // Rate-limit window uses 60s because 429 responses are cached by the CDN
  \`\`\`
- DO NOT: Explain WHAT the code does. If you need a "what" comment, the code itself is unclear — fix the code.
  \`\`\`
  ✗ // Increment the counter
  ✗ // Return the result
  ✗ // Loop through the array
  \`\`\`

## Logic Justification
- DO: Ensure every line is justifiable from first principles in the current context.
- DO NOT: Copy patterns that "look right" without verifying they apply here. Code that resembles common patterns without verified reasoning for this use case is prohibited.

## Explicit Assumptions
- DO: Encode preconditions as types, guard clauses, or assertions. Make constraints visible in the signature or the first lines of the body.
  \`\`\`
  ✓ function archiveChange(changeName: string): asserts changeName is non-empty via guard clause
  \`\`\`
- DO NOT: Leave invariants as implicit caller conventions. If a function requires non-empty input, positive numbers, or specific state, that must be visible in code.

## Simplicity
- DO: Default to the plainest, most conventional approach.
- DO NOT: Use clever ternary chains, implicit coercion, or advanced type tricks unless the savings clearly justify the reader pausing to decode it. When in doubt, write it the boring way.`,
  };
}

/**
 * Returns all available rule templates.
 */
export function getRuleTemplates(): RuleTemplateEntry[] {
  return [
    { content: getCodePhilosophyRuleContent(), ruleId: 'code-philosophy' },
  ];
}
