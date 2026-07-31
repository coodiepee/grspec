import * as path from 'node:path';
import { FileSystemUtils } from '../../utils/file-system.js';

export interface WorkspaceParsedLinkInput {
  name?: string;
  pathInput: string;
}

export interface WorkspaceLinkInputParseOptions {
  cwd?: string;
}

async function resolvedDirectoryExists(inputPath: string, cwd: string): Promise<boolean> {
  if (inputPath.length === 0) {
    return false;
  }

  const resolvedPath = path.isAbsolute(inputPath)
    ? path.resolve(inputPath)
    : path.resolve(cwd, inputPath);

  return FileSystemUtils.directoryExists(resolvedPath);
}

export async function parseWorkspaceSetupLinkInput(
  value: string,
  options: WorkspaceLinkInputParseOptions = {}
): Promise<WorkspaceParsedLinkInput> {
  const cwd = options.cwd ?? process.cwd();

  if (await resolvedDirectoryExists(value, cwd)) {
    return { pathInput: value };
  }

  const separatorIndex = value.indexOf('=');

  if (separatorIndex === -1) {
    return { pathInput: value };
  }

  return {
    name: value.slice(0, separatorIndex),
    pathInput: value.slice(separatorIndex + 1),
  };
}
