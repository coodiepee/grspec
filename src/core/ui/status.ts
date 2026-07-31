/**
 * UI Project Status
 *
 * Detects design-system presence, reads upstream version info,
 * and builds a project UI status report.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

export interface DesignSystemStatus {
  found: boolean;
  style?: string;
  path?: string;
}

export interface UpstreamVersion {
  version: string;
  date: string;
  commit?: string;
}

export interface StatusReport {
  designSystem: DesignSystemStatus;
  upstream: UpstreamVersion | null;
}

export function detectDesignSystem(projectRoot: string): DesignSystemStatus {
  const masterPath = join(projectRoot, 'grspec', 'ui', 'MASTER.md');

  if (!existsSync(masterPath)) {
    return { found: false };
  }

  const content = readFileSync(masterPath, 'utf-8');
  const styleMatch =
    content.match(/\*\*Style:\*\*\s*(.+)/) ?? content.match(/##\s*Style:\s*(.+)/i);
  const style = styleMatch ? styleMatch[1].trim() : 'Unknown';
  return { found: true, style, path: join(projectRoot, 'grspec', 'ui') };
}

export function readUpstreamVersion(filepath: string): UpstreamVersion | null {
  if (!existsSync(filepath)) return null;

  const content = readFileSync(filepath, 'utf-8');

  const versionMatch = content.match(/\*\*Version\*\*:\s*(.+)/);
  const dateMatch = content.match(/\*\*Date\*\*:\s*(.+)/);
  const commitMatch = content.match(/\*\*Commit\*\*:\s*(.+)/);

  if (!versionMatch) return null;

  return {
    version: versionMatch[1].trim(),
    date: dateMatch ? dateMatch[1].trim() : '',
    commit: commitMatch ? commitMatch[1].trim() : undefined,
  };
}

export interface StatusOptions {
  projectRoot: string;
  upstreamPath?: string;
}

export function buildStatusReport(options: StatusOptions): StatusReport {
  const { projectRoot, upstreamPath } = options;

  const designSystem = detectDesignSystem(projectRoot);
  const upstream = upstreamPath ? readUpstreamVersion(upstreamPath) : null;

  return { designSystem, upstream };
}
