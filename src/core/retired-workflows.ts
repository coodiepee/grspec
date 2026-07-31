/**
 * Workflow ids removed from the product surface.
 * Strip from saved custom lists so stale config cannot resurrect dead packaging.
 */
export const RETIRED_WORKFLOW_IDS = ['verify-gate'] as const;

export function sanitizeWorkflowIds(workflows: readonly string[]): string[] {
  const retired = new Set<string>(RETIRED_WORKFLOW_IDS);
  const seen = new Set<string>();
  const sanitized: string[] = [];

  for (const workflowId of workflows) {
    if (retired.has(workflowId) || seen.has(workflowId)) {
      continue;
    }
    seen.add(workflowId);
    sanitized.push(workflowId);
  }

  return sanitized;
}
