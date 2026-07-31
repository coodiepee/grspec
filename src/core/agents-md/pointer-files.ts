/**
 * Tool-Specific Pointer File Generators
 *
 * Generates CLAUDE.md and GEMINI.md as lightweight files that reference
 * AGENTS.md for shared project context and add tool-specific behavioral hints.
 */

export function generateClaudeMd(projectName: string): string {
  return `# ${projectName}

Read @AGENTS.md for project context, commands, and conventions.

## Claude-specific

- Use \`/compact\` when context grows large
- Use \`TodoWrite\` for multi-step tasks to track progress
- Always read a file before editing — never guess at content
- Prefer editing existing files over creating new ones
`;
}

export function generateGeminiMd(projectName: string): string {
  return `# ${projectName}

Read AGENTS.md for project context, commands, and conventions.

## Gemini-specific

- Tool equivalents: Read → cat, Write → write_file, Grep → search
- Use \`activate_skill\` tool to load skills on demand
- Prefer concise responses; expand only when asked
`;
}
