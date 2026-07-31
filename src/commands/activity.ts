import { Command } from 'commander';
import { execSync } from 'node:child_process';
import { parseStructuredCommits, aggregateActivity, computeHotFiles } from '../core/activity.js';
import { handleCommandError } from '../utils/command-error.js';
import { logger } from '../utils/logger.js';

export class ActivityCommand {
  async execute(options: {
    since?: string;
    file?: string;
    hot?: boolean;
    change?: string;
    json?: boolean;
  }): Promise<void> {
    const cwd = process.cwd();

    if (options.hot) {
      return this.showHotFiles(cwd, options);
    }

    if (options.file) {
      return this.showFileActivity(cwd, options.file, options);
    }

    if (options.change) {
      return this.showChangeActivity(cwd, options.change, options);
    }

    return this.showRecentActivity(cwd, options);
  }

  private async showRecentActivity(cwd: string, options: { since?: string; json?: boolean }): Promise<void> {
    const since = options.since ?? '2w';
    const commits = this.getStructuredCommits(cwd, since);
    const summary = aggregateActivity(commits);

    if (options.json) {
      logger.info(JSON.stringify(summary, null, 2));
    } else {
      if (summary.changes.length === 0) {
        logger.info('No structured activity found in the specified time window.');
        return;
      }
      logger.info(`Activity (since ${since}):`);
      for (const change of summary.changes) {
        logger.info(`\n  ${change.name} (${change.commits} commits, by ${change.author})`);
        if (change.modules.added.length > 0) {
          logger.info(`    Added: ${change.modules.added.join(', ')}`);
        }
        if (change.modules.modified.length > 0) {
          logger.info(`    Modified: ${change.modules.modified.join(', ')}`);
        }
      }
    }
  }

  private async showFileActivity(cwd: string, filePath: string, options: { since?: string; json?: boolean }): Promise<void> {
    const since = options.since ?? '4w';
    const commits = this.getStructuredCommits(cwd, since);

    const fileCommits = commits.filter((c) => {
      const allPaths = [
        ...c.modules.added.map((m) => m.path),
        ...c.modules.modified.map((m) => m.path),
        ...c.modules.deleted.map((m) => m.path),
      ];
      return allPaths.includes(filePath);
    });

    const summary = aggregateActivity(fileCommits);

    if (options.json) {
      logger.info(JSON.stringify({ file: filePath, ...summary }, null, 2));
    } else {
      if (summary.changes.length === 0) {
        logger.info(`No structured activity found for "${filePath}".`);
        return;
      }
      logger.info(`Activity for "${filePath}":`);
      for (const change of summary.changes) {
        const intent = change.intents[filePath] ?? '(no intent)';
        logger.info(`  - ${change.name}: ${intent} (by ${change.author})`);
      }
    }
  }

  private async showHotFiles(cwd: string, options: { since?: string; json?: boolean }): Promise<void> {
    const since = options.since ?? '4w';
    const commits = this.getStructuredCommits(cwd, since);
    const hotFiles = computeHotFiles(commits);

    if (options.json) {
      logger.info(JSON.stringify({ hotFiles }, null, 2));
    } else {
      if (hotFiles.length === 0) {
        logger.info('No contested files found.');
        return;
      }
      logger.info('Hot files (contested by multiple changes/authors):');
      for (const hf of hotFiles) {
        logger.info(`\n  ${hf.path}`);
        logger.info(`    Changes: ${hf.changes.join(', ')}`);
        logger.info(`    Authors: ${hf.authors.join(', ')}`);
        logger.info(`    Commits: ${hf.commitCount}`);
      }
    }
  }

  private async showChangeActivity(cwd: string, changeName: string, options: { since?: string; json?: boolean }): Promise<void> {
    const since = options.since ?? '8w';
    const commits = this.getStructuredCommits(cwd, since);
    const changeCommits = commits.filter((c) => c.changeName === changeName);

    if (options.json) {
      const summary = aggregateActivity(changeCommits);
      logger.info(JSON.stringify(summary.changes[0] ?? null, null, 2));
    } else {
      if (changeCommits.length === 0) {
        logger.info(`No structured commits found for change "${changeName}".`);
        return;
      }
      logger.info(`Activity for change "${changeName}":`);
      for (const commit of changeCommits) {
        logger.info(`\n  Task group ${commit.taskGroup} (${commit.date}):`);
        for (const m of commit.modules.added) {
          logger.info(`    + ${m.path}: ${m.intent}`);
        }
        for (const m of commit.modules.modified) {
          logger.info(`    ~ ${m.path}: ${m.intent}`);
        }
        for (const m of commit.modules.deleted) {
          logger.info(`    - ${m.path}: ${m.intent}`);
        }
      }
    }
  }

  private getStructuredCommits(cwd: string, since: string) {
    try {
      const output = execSync(
        `git log --since="${since}" --format="%H|%an|%ad|%s%n%b" --date=short`,
        { cwd, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );
      return parseStructuredCommits(output);
    } catch {
      return [];
    }
  }
}

export function registerActivityCommand(program: Command): void {
  program
    .command('activity')
    .description('Query structured git activity from grspec commits')
    .option('--since <duration>', 'Time window (e.g., 2w, 30d)', '2w')
    .option('--file <path>', 'Show activity for a specific file')
    .option('--hot', 'Show contested files ranked by frequency')
    .option('--change <name>', 'Show activity for a specific change')
    .option('--json', 'Output as JSON')
    .action(async (options: { since?: string; file?: string; hot?: boolean; change?: string; json?: boolean }) => {
      try {
        const activityCommand = new ActivityCommand();
        await activityCommand.execute(options);
      } catch (error) {
        handleCommandError(error, { command: 'activity', json: options?.json });
      }
    });
}
