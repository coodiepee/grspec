import * as yaml from 'yaml';

export interface ModuleEntry {
  path: string;
  domain: string;
  intent: string;
}

export interface StructuredCommit {
  hash: string;
  author: string;
  date: string;
  changeName: string;
  taskGroup: number;
  modules: {
    added: ModuleEntry[];
    modified: ModuleEntry[];
    deleted: ModuleEntry[];
  };
}

export interface ChangeActivity {
  name: string;
  author: string;
  commits: number;
  modules: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  intents: Record<string, string>;
  lastCommit: string;
  status: string;
}

export interface HotFileEntry {
  path: string;
  changes: string[];
  commitCount: number;
  authors: string[];
}

export interface ActivitySummary {
  changes: ChangeActivity[];
  hotFiles: HotFileEntry[];
}

export function parseStructuredCommits(gitLogOutput: string): StructuredCommit[] {
  if (!gitLogOutput.trim()) return [];

  const commits: StructuredCommit[] = [];
  const commitBlocks = gitLogOutput.split(/\n(?=[a-f0-9]+\|)/);

  for (const block of commitBlocks) {
    const lines = block.split('\n');
    if (lines.length === 0) continue;

    const headerLine = lines[0];
    const parts = headerLine.split('|');
    if (parts.length < 4) continue;

    const hash = parts[0].trim();
    const author = parts[1].trim();
    const date = parts[2].trim();

    const bodyText = lines.slice(1).join('\n');
    const yamlMatch = bodyText.match(/---\n([\s\S]*?)\n---/);
    if (!yamlMatch) continue;

    try {
      const parsed = yaml.parse(yamlMatch[1]);
      if (!parsed?.grspec) continue;

      commits.push({
        hash,
        author,
        date,
        changeName: parsed.grspec,
        taskGroup: parsed['task-group'] ?? 0,
        modules: {
          added: normalizeModules(parsed.modules?.added),
          modified: normalizeModules(parsed.modules?.modified),
          deleted: normalizeModules(parsed.modules?.deleted),
        },
      });
    } catch {
      // Skip commits with invalid YAML
    }
  }

  return commits;
}

function normalizeModules(raw: unknown): ModuleEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, string> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      path: entry.path ?? '',
      domain: entry.domain ?? '',
      intent: entry.intent ?? '',
    }));
}

export function aggregateActivity(commits: StructuredCommit[]): ActivitySummary {
  const changeMap = new Map<string, {
    author: string;
    commits: number;
    added: Set<string>;
    modified: Set<string>;
    deleted: Set<string>;
    intents: Record<string, string>;
    lastCommit: string;
  }>();

  for (const commit of commits) {
    const existing = changeMap.get(commit.changeName) ?? {
      author: commit.author,
      commits: 0,
      added: new Set<string>(),
      modified: new Set<string>(),
      deleted: new Set<string>(),
      intents: {},
      lastCommit: commit.date,
    };

    existing.commits++;
    if (commit.date > existing.lastCommit) {
      existing.lastCommit = commit.date;
    }

    for (const m of commit.modules.added) {
      existing.added.add(m.path);
      if (m.intent) existing.intents[m.path] = m.intent;
    }
    for (const m of commit.modules.modified) {
      existing.modified.add(m.path);
      if (m.intent) existing.intents[m.path] = m.intent;
    }
    for (const m of commit.modules.deleted) {
      existing.deleted.add(m.path);
      if (m.intent) existing.intents[m.path] = m.intent;
    }

    changeMap.set(commit.changeName, existing);
  }

  const changes: ChangeActivity[] = [];
  for (const [name, data] of changeMap) {
    changes.push({
      name,
      author: data.author,
      commits: data.commits,
      modules: {
        added: [...data.added],
        modified: [...data.modified],
        deleted: [...data.deleted],
      },
      intents: data.intents,
      lastCommit: data.lastCommit,
      status: 'applied',
    });
  }

  const hotFiles = computeHotFiles(commits);

  return { changes, hotFiles };
}

export function computeHotFiles(commits: StructuredCommit[]): HotFileEntry[] {
  const fileMap = new Map<string, { changes: Set<string>; authors: Set<string>; count: number }>();

  for (const commit of commits) {
    const allFiles = [
      ...commit.modules.added,
      ...commit.modules.modified,
      ...commit.modules.deleted,
    ];

    for (const mod of allFiles) {
      const entry = fileMap.get(mod.path) ?? { changes: new Set(), authors: new Set(), count: 0 };
      entry.changes.add(commit.changeName);
      entry.authors.add(commit.author);
      entry.count++;
      fileMap.set(mod.path, entry);
    }
  }

  const hotFiles: HotFileEntry[] = [];
  for (const [filePath, data] of fileMap) {
    if (data.changes.size >= 2 || data.authors.size >= 2) {
      hotFiles.push({
        path: filePath,
        changes: [...data.changes].sort(),
        commitCount: data.count,
        authors: [...data.authors].sort(),
      });
    }
  }

  return hotFiles.sort((a, b) => b.commitCount - a.commitCount);
}
