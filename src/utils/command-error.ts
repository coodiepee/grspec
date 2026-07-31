export interface CommandErrorContext {
  command: string;
  changeName?: string;
  json?: boolean;
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error === null || error === undefined) return 'Unknown error';
  return String(error);
}

/**
 * Unified error handler for CLI commands. All command action handlers should
 * delegate to this in their catch block instead of using ad-hoc error formatting.
 *
 * - Sets `process.exitCode = 1` (no `process.exit()` call for graceful cleanup)
 * - JSON mode: writes `{ "error": "<message>" }` to stderr (no spinner)
 * - Normal mode: writes a human-readable error line to stderr with context
 */
export function handleCommandError(error: unknown, context: CommandErrorContext): void {
  process.exitCode = 1;
  const message = extractMessage(error);

  if (context.json) {
    process.stderr.write(JSON.stringify({ error: message }));
    return;
  }

  const prefix = context.changeName
    ? `[${context.command}:${context.changeName}]`
    : `[${context.command}]`;

  process.stderr.write(`Error ${prefix}: ${message}\n`);
}
