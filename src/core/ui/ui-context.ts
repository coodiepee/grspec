import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Discovers UI context file paths for apply instructions.
 * Order: change ui.md → project MASTER → project pages → change pages.
 */
export function discoverUiContextFiles(
  projectRoot: string,
  changeDir: string
): string[] {
  const discovered: string[] = [];

  const changeUiMd = path.join(changeDir, 'ui.md');
  if (fs.existsSync(changeUiMd)) {
    discovered.push(changeUiMd);
  }

  const projectMaster = path.join(projectRoot, 'grspec', 'ui', 'MASTER.md');
  if (fs.existsSync(projectMaster)) {
    discovered.push(projectMaster);
  }

  appendMdFilesFromDir(path.join(projectRoot, 'grspec', 'ui', 'pages'), discovered);
  appendMdFilesFromDir(path.join(changeDir, 'ui', 'pages'), discovered);

  return discovered;
}

function appendMdFilesFromDir(dirPath: string, discovered: string[]): void {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  try {
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue;
      const filePath = path.join(dirPath, entry);
      if (!discovered.includes(filePath)) {
        discovered.push(filePath);
      }
    }
  } catch {
    // unreadable directory — skip
  }
}
