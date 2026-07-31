import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, 'content');

/**
 * Load a workflow template's markdown content by name.
 * Resolves from the given directory or the built-in content directory.
 */
export function loadWorkflowTemplate(name: string, baseDir: string = CONTENT_DIR): string {
  const filePath = path.join(baseDir, `${name}.md`);
  try {
    return readFileSync(filePath, 'utf-8').trimEnd();
  } catch {
    throw new Error(`Workflow template not found: ${filePath}`);
  }
}
