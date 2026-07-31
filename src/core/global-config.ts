import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { logger } from '../utils/logger.js';
import { sanitizeWorkflowIds } from './retired-workflows.js';

// Constants
export const GLOBAL_CONFIG_DIR_NAME = 'grspec';
export const GLOBAL_CONFIG_FILE_NAME = 'config.json';
export const GLOBAL_DATA_DIR_NAME = 'grspec';

// TypeScript types
export type Profile = 'minimal' | 'standard' | 'full' | 'custom';
export type Delivery = 'both' | 'skills' | 'commands';

// TypeScript interfaces
export interface GlobalConfig {
  featureFlags?: Record<string, boolean>;
  profile?: Profile;
  delivery?: Delivery;
  workflows?: string[];
}

export const DEFAULT_CONFIG: GlobalConfig = {
  featureFlags: {},
  profile: 'standard',
  delivery: 'both',
};

/**
 * Gets the global configuration directory path following XDG Base Directory Specification.
 *
 * - All platforms: $XDG_CONFIG_HOME/grspec/ if XDG_CONFIG_HOME is set
 * - Unix/macOS fallback: ~/.config/grspec/
 * - Windows fallback: %APPDATA%/grspec/
 */
export function getGlobalConfigDir(): string {
  // XDG_CONFIG_HOME takes precedence on all platforms when explicitly set
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return path.join(xdgConfigHome, GLOBAL_CONFIG_DIR_NAME);
  }

  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: use %APPDATA%
    const appData = process.env.APPDATA;
    if (appData) {
      return path.join(appData, GLOBAL_CONFIG_DIR_NAME);
    }
    // Fallback for Windows if APPDATA is not set
    return path.join(os.homedir(), 'AppData', 'Roaming', GLOBAL_CONFIG_DIR_NAME);
  }

  // Unix/macOS fallback: ~/.config
  return path.join(os.homedir(), '.config', GLOBAL_CONFIG_DIR_NAME);
}

/**
 * Gets the global data directory path following XDG Base Directory Specification.
 * Used for user data like schema overrides.
 *
 * - All platforms: $XDG_DATA_HOME/grspec/ if XDG_DATA_HOME is set
 * - Unix/macOS fallback: ~/.local/share/grspec/
 * - Windows fallback: %LOCALAPPDATA%/grspec/
 */
export interface GlobalDataDirOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  homedir?: string;
}

function joinGlobalDataPath(platform: NodeJS.Platform, ...segments: string[]): string {
  return platform === 'win32'
    ? path.win32.join(...segments)
    : path.posix.join(...segments);
}

export function getGlobalDataDir(options: GlobalDataDirOptions = {}): string {
  const env = options.env ?? process.env;
  const platform = options.platform ?? os.platform();

  // XDG_DATA_HOME takes precedence on all platforms when explicitly set
  const xdgDataHome = env.XDG_DATA_HOME;
  if (xdgDataHome) {
    return joinGlobalDataPath(platform, xdgDataHome, GLOBAL_DATA_DIR_NAME);
  }

  const homedir = options.homedir ?? os.homedir();

  if (platform === 'win32') {
    // Windows: use %LOCALAPPDATA%
    const localAppData = env.LOCALAPPDATA;
    if (localAppData) {
      return joinGlobalDataPath(platform, localAppData, GLOBAL_DATA_DIR_NAME);
    }
    // Fallback for Windows if LOCALAPPDATA is not set
    return joinGlobalDataPath(platform, homedir, 'AppData', 'Local', GLOBAL_DATA_DIR_NAME);
  }

  // Unix/macOS fallback: ~/.local/share
  return joinGlobalDataPath(platform, homedir, '.local', 'share', GLOBAL_DATA_DIR_NAME);
}

/**
 * Gets the path to the global config file.
 */
export function getGlobalConfigPath(): string {
  return path.join(getGlobalConfigDir(), GLOBAL_CONFIG_FILE_NAME);
}

/**
 * Loads the global configuration from disk.
 * Returns default configuration if file doesn't exist or is invalid.
 * Merges loaded config with defaults to ensure new fields are available.
 */
export function getGlobalConfig(): GlobalConfig {
  const configPath = getGlobalConfigPath();

  try {
    if (!fs.existsSync(configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Merge with defaults (loaded values take precedence)
    const merged: GlobalConfig = {
      ...DEFAULT_CONFIG,
      ...parsed,
      // Deep merge featureFlags
      featureFlags: {
        ...DEFAULT_CONFIG.featureFlags,
        ...(parsed.featureFlags || {})
      }
    };

    // Schema evolution: apply defaults for new fields if not present in loaded config
    if (parsed.profile === undefined) {
      merged.profile = DEFAULT_CONFIG.profile;
    } else {
      const validProfiles = new Set(['minimal', 'standard', 'full', 'custom']);
      if (!validProfiles.has(String(parsed.profile))) {
        logger.error(
          `Warning: Invalid profile "${parsed.profile}" in ${configPath}; using standard. Valid: minimal, standard, full, custom`
        );
        merged.profile = 'standard';
      }
    }
    if (parsed.delivery === undefined) {
      merged.delivery = DEFAULT_CONFIG.delivery;
    }
    if (merged.workflows) {
      merged.workflows = sanitizeWorkflowIds(merged.workflows);
    }

    return merged;
  } catch (error) {
    // Log warning for parse errors, but not for missing files
    if (error instanceof SyntaxError) {
      logger.error(`Warning: Invalid JSON in ${configPath}, using defaults`);
    }
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves the global configuration to disk using atomic write (temp file + rename).
 * Prevents partial reads from concurrent CLI invocations.
 * Creates the config directory if it doesn't exist.
 */
export function saveGlobalConfig(config: GlobalConfig): void {
  const configDir = getGlobalConfigDir();
  const configPath = getGlobalConfigPath();

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const toWrite: GlobalConfig = {
    ...config,
    workflows: config.workflows ? sanitizeWorkflowIds(config.workflows) : config.workflows,
  };

  const content = JSON.stringify(toWrite, null, 2) + '\n';
  const tempPath = `${configPath}.${process.pid}.tmp`;

  try {
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, configPath);
  } catch (err) {
    // Clean up temp file on failure
    try { fs.unlinkSync(tempPath); } catch { /* best effort */ }
    throw err;
  }
}

/**
 * Atomically updates the global configuration by loading the current config,
 * applying a mutation, and saving the result.
 *
 * While not a true cross-process lock, this minimizes the read-modify-write
 * window and ensures the written file is never partially written.
 */
export function updateGlobalConfig(mutate: (config: GlobalConfig) => void): void {
  const config = getGlobalConfig();
  mutate(config);
  saveGlobalConfig(config);
}
