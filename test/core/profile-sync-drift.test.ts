import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  hasProjectConfigDrift,
  hasToolProfileOrDeliveryDrift,
  LEGACY_UI_HUB_SKILL_DIR,
  LEGACY_VERIFY_CHANGE_SKILL_DIR,
  removeLegacyUiHubCommandFile,
  removeLegacyUiHubSkillDir,
  removeLegacyVerifyChangeSkillDir,
  UI_SUBCOMMAND_SKILL_DIRS,
  WORKFLOW_TO_COMMAND_IDS,
  WORKFLOW_TO_SKILL_DIR,
} from '../../src/core/profile-sync-drift.js';
import { CORE_WORKFLOWS } from '../../src/core/profiles.js';
import { CommandAdapterRegistry } from '../../src/core/command-generation/index.js';

function writeSkill(projectDir: string, workflowId: string): void {
  const skillDirName = WORKFLOW_TO_SKILL_DIR[workflowId as keyof typeof WORKFLOW_TO_SKILL_DIR];
  const skillPath = path.join(projectDir, '.claude', 'skills', skillDirName, 'SKILL.md');
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, `name: ${skillDirName}\n`);
}

function writeCommand(projectDir: string, workflowId: string): void {
  const adapter = CommandAdapterRegistry.get('claude');
  if (!adapter) throw new Error('Claude adapter unavailable in test environment');
  const cmdPath = adapter.getFilePath(workflowId);
  const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectDir, cmdPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `# ${workflowId}\n`);
}

function setupCoreSkills(projectDir: string): void {
  for (const workflow of CORE_WORKFLOWS) {
    writeSkill(projectDir, workflow);
  }
}

function setupCoreCommands(projectDir: string): void {
  for (const workflow of CORE_WORKFLOWS) {
    writeCommand(projectDir, workflow);
  }
}

describe('profile sync drift detection', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `grspec-profile-sync-drift-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(path.join(tempDir, 'grspec'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects drift for skills-only delivery when commands still exist', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'skills');
    expect(hasDrift).toBe(true);
  });

  it('detects drift for commands-only delivery when skills still exist', () => {
    setupCoreCommands(tempDir);
    setupCoreSkills(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'commands');
    expect(hasDrift).toBe(true);
  });

  it('detects drift when required profile workflow files are missing', () => {
    writeSkill(tempDir, 'explore');

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(true);
  });

  it('returns false when project files match core profile and delivery', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(false);
  });

  it('detects drift when extra workflows are installed for both delivery', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);
    writeSkill(tempDir, 'new');
    writeCommand(tempDir, 'new');

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(true);
  });
});

function writeUiSubSkills(projectDir: string, toolId: string): void {
  const tool = { cursor: '.cursor', claude: '.claude' }[toolId] ?? '.cursor';
  const skillsDir = path.join(projectDir, tool, 'skills');
  for (const dirName of UI_SUBCOMMAND_SKILL_DIRS) {
    const skillPath = path.join(skillsDir, dirName, 'SKILL.md');
    fs.mkdirSync(path.dirname(skillPath), { recursive: true });
    fs.writeFileSync(skillPath, `name: ${dirName}\n`);
  }
}

describe('legacy UI hub removal', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(
      os.tmpdir(),
      `grspec-legacy-ui-hub-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('removeLegacyUiHubSkillDir deletes hub directory when present', async () => {
    const skillsDir = path.join(tempDir, '.cursor', 'skills');
    const legacyHubDir = path.join(skillsDir, LEGACY_UI_HUB_SKILL_DIR);
    fs.mkdirSync(legacyHubDir, { recursive: true });
    fs.writeFileSync(path.join(legacyHubDir, 'SKILL.md'), 'name: grspec-ui\n');

    const removed = await removeLegacyUiHubSkillDir(skillsDir);
    expect(removed).toBe(true);
    expect(fs.existsSync(legacyHubDir)).toBe(false);
  });

  it('removeLegacyUiHubSkillDir returns false when hub directory is absent', async () => {
    const skillsDir = path.join(tempDir, '.cursor', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    const removed = await removeLegacyUiHubSkillDir(skillsDir);
    expect(removed).toBe(false);
  });

  it('removeLegacyUiHubCommandFile deletes grsx-ui.md when present', async () => {
    const commandPath = path.join(tempDir, '.cursor', 'commands', 'grsx-ui.md');
    fs.mkdirSync(path.dirname(commandPath), { recursive: true });
    fs.writeFileSync(commandPath, '# legacy hub\n');

    const removed = await removeLegacyUiHubCommandFile(tempDir, 'cursor');
    expect(removed).toBe(true);
    expect(fs.existsSync(commandPath)).toBe(false);
  });

  it('removeLegacyUiHubCommandFile returns false when hub command is absent', async () => {
    const removed = await removeLegacyUiHubCommandFile(tempDir, 'cursor');
    expect(removed).toBe(false);
  });

  it('hasToolProfileOrDeliveryDrift reports drift when legacy hub skill remains', () => {
    writeUiSubSkills(tempDir, 'cursor');
    const legacyHubDir = path.join(tempDir, '.cursor', 'skills', LEGACY_UI_HUB_SKILL_DIR);
    fs.mkdirSync(legacyHubDir, { recursive: true });
    fs.writeFileSync(path.join(legacyHubDir, 'SKILL.md'), 'name: grspec-ui\n');

    const hasDrift = hasToolProfileOrDeliveryDrift(tempDir, 'cursor', ['ui'], 'skills');
    expect(hasDrift).toBe(true);
  });

  it('hasToolProfileOrDeliveryDrift reports drift when legacy hub command remains', () => {
    writeUiSubSkills(tempDir, 'cursor');
    const commandPath = path.join(tempDir, '.cursor', 'commands', 'grsx-ui.md');
    fs.mkdirSync(path.dirname(commandPath), { recursive: true });
    fs.writeFileSync(commandPath, '# legacy hub\n');

    const hasDrift = hasToolProfileOrDeliveryDrift(tempDir, 'cursor', ['ui'], 'skills');
    expect(hasDrift).toBe(true);
  });

  it('removeLegacyVerifyChangeSkillDir deletes the renamed skill directory', async () => {
    const skillsDir = path.join(tempDir, '.cursor', 'skills');
    const legacyDir = path.join(skillsDir, LEGACY_VERIFY_CHANGE_SKILL_DIR);
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, 'SKILL.md'), 'name: grspec-verify-change\n');

    const removed = await removeLegacyVerifyChangeSkillDir(skillsDir);
    expect(removed).toBe(true);
    expect(fs.existsSync(legacyDir)).toBe(false);
  });

  it('hasToolProfileOrDeliveryDrift reports drift when legacy verify-change skill remains', () => {
    const skillsDir = path.join(tempDir, '.cursor', 'skills');
    const verifyDir = path.join(skillsDir, 'grspec-verify');
    fs.mkdirSync(verifyDir, { recursive: true });
    fs.writeFileSync(path.join(verifyDir, 'SKILL.md'), 'name: grspec-verify\n');
    const legacyDir = path.join(skillsDir, LEGACY_VERIFY_CHANGE_SKILL_DIR);
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(path.join(legacyDir, 'SKILL.md'), 'name: grspec-verify-change\n');

    const hasDrift = hasToolProfileOrDeliveryDrift(tempDir, 'cursor', ['verify'], 'skills');
    expect(hasDrift).toBe(true);
  });

  it('WORKFLOW_TO_COMMAND_IDS wiki includes hub command', () => {
    expect(WORKFLOW_TO_COMMAND_IDS.wiki).toEqual([
      'wiki',
      'wiki-init',
      'wiki-ingest',
      'wiki-lint',
      'wiki-query',
      'wiki-sync',
      'wiki-status',
    ]);
  });
});
