import * as fs from 'node:fs';
import * as path from 'node:path';

export type UiArtifactStatus = 'na' | 'blocked' | 'done' | 'unknown';

const STATUS_SECTION_PATTERN = /^##\s+Status\s*$/im;
const VALID_STATUS_PATTERN = /^(na|blocked|done)\s*$/i;

/**
 * Reads the ## Status section first non-empty line from ui.md.
 */
export function parseUiArtifactStatus(uiMdPath: string): UiArtifactStatus {
  if (!fs.existsSync(uiMdPath)) {
    return 'unknown';
  }

  let content: string;
  try {
    content = fs.readFileSync(uiMdPath, 'utf-8');
  } catch {
    return 'unknown';
  }

  const sectionMatch = content.match(STATUS_SECTION_PATTERN);
  if (!sectionMatch || sectionMatch.index === undefined) {
    return 'unknown';
  }

  const afterSection = content.slice(sectionMatch.index + sectionMatch[0].length);
  const lines = afterSection.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith('#')) break;
    if (VALID_STATUS_PATTERN.test(trimmed)) {
      return trimmed.toLowerCase() as UiArtifactStatus;
    }
    return 'unknown';
  }

  return 'unknown';
}

/**
 * True when flat project foundation exists at grspec/ui/MASTER.md.
 */
export function isUiFoundationReady(projectRoot: string): boolean {
  const masterPath = path.join(projectRoot, 'grspec', 'ui', 'MASTER.md');
  return fs.existsSync(masterPath);
}

export interface EffectiveUiActiveInput {
  changeDir: string;
  schemaVersion: number;
  uiDetected: boolean;
}

/**
 * v2: ui.md Status drives gates (na = inactive; blocked/done/unknown = active).
 * v1: metadata dual-read only.
 */
export function resolveEffectiveUiActive(input: EffectiveUiActiveInput): boolean {
  const uiMdPath = path.join(input.changeDir, 'ui.md');

  if (input.schemaVersion >= 2 && fs.existsSync(uiMdPath)) {
    return parseUiArtifactStatus(uiMdPath) !== 'na';
  }

  return input.uiDetected;
}
