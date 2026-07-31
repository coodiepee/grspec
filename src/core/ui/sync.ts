/**
 * UI Upstream Sync
 *
 * Handles synchronization of UI/UX data from the upstream
 * ui-ux-pro-max-skill repository.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';

export interface SyncStatus {
  hasUpdates: boolean;
  upstreamVersion: string;
  localVersion: string;
}

export interface UpstreamMdOptions {
  version: string;
  commit: string;
  date: string;
  assets: string[];
}

export function resolveUpstreamPath(grspecRoot: string, customPath?: string): string {
  if (customPath) return customPath;
  return resolve(dirname(grspecRoot), 'ui-ux-pro-max-skill');
}

export function checkForUpdates(localUpstreamMd: string, upstreamDir: string): SyncStatus {
  const localVersion = readLocalVersion(localUpstreamMd);
  const upstreamVersion = readUpstreamPackageVersion(upstreamDir);

  return {
    hasUpdates: localVersion !== upstreamVersion,
    upstreamVersion,
    localVersion,
  };
}

function readLocalVersion(upstreamMdPath: string): string {
  if (!existsSync(upstreamMdPath)) return '0.0.0';
  const content = readFileSync(upstreamMdPath, 'utf-8');
  const match = content.match(/\*\*Version\*\*:\s*(.+)/);
  return match ? match[1].trim() : '0.0.0';
}

function readUpstreamPackageVersion(upstreamDir: string): string {
  const pkgPath = join(upstreamDir, 'cli', 'package.json');
  if (!existsSync(pkgPath)) return '0.0.0';
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg.version ?? '0.0.0';
}

export function generateUpstreamMd(options: UpstreamMdOptions): string {
  const { version, commit, date, assets } = options;
  const assetList = assets.map((a) => `  - \`${a}\``).join('\n');

  return `# Upstream Source

## Source

- **Repository**: ui-ux-pro-max-skill
- **Version**: ${version}
- **Commit**: ${commit}

## Last Sync

- **Date**: ${date}
- **Synced by**: grspec ui sync
- **Assets synced**:
${assetList}
`;
}
