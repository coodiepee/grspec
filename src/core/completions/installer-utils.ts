import { promises as fs } from 'fs';

/**
 * Backup an existing file if it exists, creating a timestamped copy.
 *
 * @param targetPath - Path to the file to backup
 * @returns Path to the backup file, or undefined if no backup was needed
 */
export async function backupExistingFile(targetPath: string): Promise<string | undefined> {
  try {
    await fs.access(targetPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${targetPath}.backup-${timestamp}`;
    await fs.copyFile(targetPath, backupPath);
    return backupPath;
  } catch {
    return undefined;
  }
}
