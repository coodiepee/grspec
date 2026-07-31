import { Command } from 'commander';
import { execSync, execFileSync } from 'child_process';
import { createRequire } from 'module';
import os from 'os';
import { handleCommandError } from '../utils/command-error.js';
import { logger } from '../utils/logger.js';

const require = createRequire(import.meta.url);

/**
 * Check if gh CLI is installed and available in PATH
 * Uses platform-appropriate command: 'where' on Windows, 'which' on Unix/macOS
 */
function isGhInstalled(): boolean {
  try {
    const command = process.platform === 'win32' ? 'where gh' : 'which gh';
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if gh CLI is authenticated
 */
function isGhAuthenticated(): boolean {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get grspec version from package.json
 */
function getVersion(): string {
  try {
    const { version } = require('../../package.json');
    return version;
  } catch {
    return 'unknown';
  }
}

/**
 * Get platform name
 */
function getPlatform(): string {
  return os.platform();
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate metadata footer for feedback
 */
function generateMetadata(): string {
  const version = getVersion();
  const platform = getPlatform();
  const timestamp = getTimestamp();

  return `---
Submitted via grspec CLI
- Version: ${version}
- Platform: ${platform}
- Timestamp: ${timestamp}`;
}

/**
 * Format the feedback title
 */
function formatTitle(message: string): string {
  return `Feedback: ${message}`;
}

/**
 * Format the full feedback body
 */
function formatBody(bodyText?: string): string {
  const parts: string[] = [];

  if (bodyText) {
    parts.push(bodyText);
    parts.push(''); // Empty line before metadata
  }

  parts.push(generateMetadata());

  return parts.join('\n');
}

/**
 * Generate a pre-filled GitHub issue URL for manual submission
 */
function generateManualSubmissionUrl(title: string, body: string): string {
  const repo = 'grspec/grspec';
  const encodedTitle = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(body);
  const encodedLabels = encodeURIComponent('feedback');

  return `https://github.com/${repo}/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=${encodedLabels}`;
}

/**
 * Display formatted feedback content for manual submission
 */
function displayFormattedFeedback(title: string, body: string): void {
  logger.info('\n--- FORMATTED FEEDBACK ---');
  logger.info(`Title: ${title}`);
  logger.info(`Labels: feedback`);
  logger.info('\nBody:');
  logger.info(body);
  logger.info('--- END FEEDBACK ---\n');
}

/**
 * Submit feedback via gh CLI
 * Uses execFileSync to prevent shell injection vulnerabilities
 */
function submitViaGhCli(title: string, body: string): void {
  try {
    const result = execFileSync(
      'gh',
      [
        'issue',
        'create',
        '--repo',
        'grspec/grspec',
        '--title',
        title,
        '--body',
        body,
        '--label',
        'feedback',
      ],
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    const issueUrl = result.trim();
    logger.info(`\n✓ Feedback submitted successfully!`);
    logger.info(`Issue URL: ${issueUrl}\n`);
  } catch (error: unknown) {
    const execErr = error as { stderr?: Buffer; message?: string; status?: number };
    const errorMessage = execErr.stderr
      ? execErr.stderr.toString()
      : execErr.message ?? 'Unknown gh CLI error';
    throw new Error(`Failed to submit feedback: ${errorMessage}`);
  }
}

/**
 * Handle fallback when gh CLI is not available or not authenticated
 */
function handleFallback(title: string, body: string, reason: 'missing' | 'unauthenticated'): void {
  if (reason === 'missing') {
    logger.info('⚠️  GitHub CLI not found. Manual submission required.');
  } else {
    logger.info('⚠️  GitHub authentication required. Manual submission required.');
  }

  displayFormattedFeedback(title, body);

  const manualUrl = generateManualSubmissionUrl(title, body);
  logger.info('Please submit your feedback manually:');
  logger.info(manualUrl);

  if (reason === 'unauthenticated') {
    logger.info('\nTo auto-submit in the future: gh auth login');
  }
}

/**
 * Feedback command implementation
 */
export class FeedbackCommand {
  async execute(message: string, options?: { body?: string }): Promise<void> {
    // Format title and body once for all code paths
    const title = formatTitle(message);
    const body = formatBody(options?.body);

    // Check if gh CLI is installed
    if (!isGhInstalled()) {
      handleFallback(title, body, 'missing');
      return;
    }

    // Check if gh CLI is authenticated
    if (!isGhAuthenticated()) {
      handleFallback(title, body, 'unauthenticated');
      return;
    }

    // Submit via gh CLI
    submitViaGhCli(title, body);
  }
}

export function registerFeedbackCommand(program: Command): void {
  program
    .command('feedback <message>')
    .description('Submit feedback about grspec')
    .option('--body <text>', 'Detailed description for the feedback')
    .action(async (message: string, options?: { body?: string }) => {
      try {
        const feedbackCommand = new FeedbackCommand();
        await feedbackCommand.execute(message, options);
      } catch (error) {
        handleCommandError(error, { command: 'feedback' });
      }
    });
}
