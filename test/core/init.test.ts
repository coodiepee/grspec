import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { InitCommand } from '../../src/core/init.js';
import { saveGlobalConfig, getGlobalConfig } from '../../src/core/global-config.js';

const { confirmMock, showWelcomeScreenMock, searchableMultiSelectMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  showWelcomeScreenMock: vi.fn().mockResolvedValue(undefined),
  searchableMultiSelectMock: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock,
}));

vi.mock('../../src/ui/welcome-screen.js', () => ({
  showWelcomeScreen: showWelcomeScreenMock,
}));

vi.mock('../../src/prompts/searchable-multi-select.js', () => ({
  searchableMultiSelect: searchableMultiSelectMock,
}));

describe('InitCommand', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `grspec-init-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid reading real config
    configTempDir = path.join(os.tmpdir(), `grspec-config-init-${Date.now()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;

    // Mock console.log to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => { });
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('execute with --tools flag', () => {
    it('should create grspec directory structure', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const grspecPath = path.join(testDir, 'grspec');
      expect(await directoryExists(grspecPath)).toBe(true);
      expect(await directoryExists(path.join(grspecPath, 'specs'))).toBe(true);
      expect(await directoryExists(path.join(grspecPath, 'changes'))).toBe(true);
      expect(await directoryExists(path.join(grspecPath, 'changes', 'archive'))).toBe(true);
    });

    it('should create grspec.yaml with default schema', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const configPath = path.join(testDir, 'grspec', 'grspec.yaml');
      expect(await fileExists(configPath)).toBe(true);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('schema: spec-driven');
    });

    it('should create standard profile skills for Claude Code by default', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // Standard profile: propose, explore, apply, sync, archive + tdd, validate, verify, debug, review
      const standardSkillNames = [
        'grspec-propose',
        'grspec-explore',
        'grspec-apply-change',
        'grspec-sync-specs',
        'grspec-archive-change',
        'grspec-tdd',
        'grspec-validate',
        'grspec-verify',
        'grspec-debug',
        'grspec-review',
      ];

      for (const skillName of standardSkillNames) {
        const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await fileExists(skillFile)).toBe(true);

        const content = await fs.readFile(skillFile, 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('name:');
        expect(content).toContain('description:');
      }

      // Non-standard skills should NOT be created
      const nonStandardSkillNames = [
        'grspec-new-change',
        'grspec-continue-change',
        'grspec-ff-change',
        'grspec-bulk-archive-change',
        'grspec-parallel',
        'grspec-subagent',
      ];

      for (const skillName of nonStandardSkillNames) {
        const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await fileExists(skillFile)).toBe(false);
      }
    });

    it('should create standard profile commands for Claude Code by default', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // Standard profile includes validate + verify (not full-only workflows)
      const standardCommandNames = [
        'grsx/propose.md',
        'grsx/explore.md',
        'grsx/apply.md',
        'grsx/sync.md',
        'grsx/archive.md',
        'grsx/validate.md',
        'grsx/verify.md',
      ];

      for (const cmdName of standardCommandNames) {
        const cmdFile = path.join(testDir, '.claude', 'commands', cmdName);
        expect(await fileExists(cmdFile)).toBe(true);
      }

      // Full-only commands should NOT be created under default standard profile
      const nonStandardCommandNames = [
        'grsx/new.md',
        'grsx/continue.md',
        'grsx/ff.md',
        'grsx/bulk-archive.md',
      ];

      for (const cmdName of nonStandardCommandNames) {
        const cmdFile = path.join(testDir, '.claude', 'commands', cmdName);
        expect(await fileExists(cmdFile)).toBe(false);
      }
    });

    it('should create skills in Cursor skills directory', async () => {
      const initCommand = new InitCommand({ tools: 'cursor', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.cursor', 'skills', 'grspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should create skills in Windsurf skills directory', async () => {
      const initCommand = new InitCommand({ tools: 'windsurf', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.windsurf', 'skills', 'grspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should support Kimi CLI as an adapterless skills-only tool', async () => {
      saveGlobalConfig({
        featureFlags: {},
        profile: 'standard',
        delivery: 'both',
      });

      const initCommand = new InitCommand({ tools: 'kimi', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.kimi', 'skills', 'grspec-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);

      const commandsDir = path.join(testDir, '.kimi', 'commands');
      expect(await directoryExists(commandsDir)).toBe(false);

      const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
      expect(
        logCalls.some(
          (entry) => entry.includes('Commands skipped for: kimi') && entry.includes('(no adapter)'),
        ),
      ).toBe(true);
    });

    it('should create skills for multiple tools at once', async () => {
      const initCommand = new InitCommand({ tools: 'claude,cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'grspec-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should select all tools with --tools all option', async () => {
      const initCommand = new InitCommand({ tools: 'all', force: true });

      await initCommand.execute(testDir);

      // Check a few representative tools
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'grspec-explore', 'SKILL.md');
      const windsurfSkill = path.join(testDir, '.windsurf', 'skills', 'grspec-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
      expect(await fileExists(windsurfSkill)).toBe(true);
    });

    it('should skip tool configuration with --tools none option', async () => {
      const initCommand = new InitCommand({ tools: 'none', force: true });

      await initCommand.execute(testDir);

      // Should create grspec structure but no skills
      const grspecPath = path.join(testDir, 'grspec');
      expect(await directoryExists(grspecPath)).toBe(true);

      // No tool-specific directories should be created
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      expect(await directoryExists(claudeSkillsDir)).toBe(false);
    });

    it('should throw error for invalid tool names', async () => {
      const initCommand = new InitCommand({ tools: 'invalid-tool', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(/Invalid tool\(s\): invalid-tool/);
    });

    it('should handle comma-separated tool names with spaces', async () => {
      const initCommand = new InitCommand({ tools: 'claude, cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'grspec-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should reject combining reserved keywords with explicit tool ids', async () => {
      const initCommand = new InitCommand({ tools: 'all,claude', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(
        /Cannot combine reserved values "all" or "none" with specific tool IDs/
      );
    });

    it('should not overwrite project config if it already exists', async () => {
      // Pre-create grspec.yaml
      const grspecDir = path.join(testDir, 'grspec');
      await fs.mkdir(grspecDir, { recursive: true });
      const configPath = path.join(grspecDir, 'grspec.yaml');
      const existingContent = 'schema: custom-schema\n';
      await fs.writeFile(configPath, existingContent);

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toBe(existingContent);
    });

    it('should handle non-existent target directory', async () => {
      const newDir = path.join(testDir, 'new-project');
      const initCommand = new InitCommand({ tools: 'claude', force: true });

      await initCommand.execute(newDir);

      const grspecPath = path.join(newDir, 'grspec');
      expect(await directoryExists(grspecPath)).toBe(true);
    });

    it('should work in extend mode (re-running init)', async () => {
      const initCommand1 = new InitCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      // Run init again with a different tool
      const initCommand2 = new InitCommand({ tools: 'cursor', force: true });
      await initCommand2.execute(testDir);

      // Both tools should have skills
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'grspec-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should refresh skills on re-run for the same tool', async () => {
      const initCommand1 = new InitCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const originalContent = await fs.readFile(skillFile, 'utf-8');

      // Modify the file
      await fs.writeFile(skillFile, '# Modified content\n');

      // Run init again
      const initCommand2 = new InitCommand({ tools: 'claude', force: true });
      await initCommand2.execute(testDir);

      const newContent = await fs.readFile(skillFile, 'utf-8');
      expect(newContent).toBe(originalContent);
    });
  });

  describe('skill content validation', () => {
    it('should generate valid SKILL.md with YAML frontmatter', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Should have YAML frontmatter
      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name: grspec-explore');
      expect(content).toContain('description:');
      expect(content).toContain('license:');
      expect(content).toContain('compatibility:');
      expect(content).toContain('metadata:');
      expect(content).toMatch(/---\n\n/); // End of frontmatter
    });

    it('should include explore mode instructions', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('Enter explore mode');
      expect(content).toContain('thinking partner');
    });

    it('should include propose skill instructions', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-propose', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('name: grspec-propose');
    });

    it('should include apply-change skill instructions', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-apply-change', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('name: grspec-apply-change');
    });

    it('should embed generatedBy version in skill files', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Should contain generatedBy field with a version string
      expect(content).toMatch(/generatedBy:\s*["']?\d+\.\d+\.\d+["']?/);
    });
  });

  describe('command generation', () => {
    it('should generate Claude Code commands with correct format', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.claude', 'commands', 'grsx', 'explore.md');
      const content = await fs.readFile(cmdFile, 'utf-8');

      // Claude commands use YAML frontmatter
      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name:');
      expect(content).toContain('description:');
    });

    it('should generate Cursor commands with correct format', async () => {
      const initCommand = new InitCommand({ tools: 'cursor', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.cursor', 'commands', 'grsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(true);

      const content = await fs.readFile(cmdFile, 'utf-8');
      expect(content).toMatch(/^---\n/);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error for insufficient permissions', async () => {
      // Mock the permission check to fail
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);

      const originalWriteFile = fs.writeFile;
      vi.spyOn(fs, 'writeFile').mockImplementation(
        async (filePath: any, ...args: any[]) => {
          if (
            typeof filePath === 'string' &&
            filePath.includes('.grspec-test-')
          ) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile.call(fs, filePath, ...args);
        }
      );

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await expect(initCommand.execute(readOnlyDir)).rejects.toThrow(/Insufficient permissions/);
    });

    it('should throw error in non-interactive mode without --tools flag and no detected tools', async () => {
      const initCommand = new InitCommand({ interactive: false });

      await expect(initCommand.execute(testDir)).rejects.toThrow(/No tools detected and no --tools flag/);
    });
  });

  describe('tool-specific adapters', () => {
    it('should generate Gemini CLI commands as TOML files', async () => {
      const initCommand = new InitCommand({ tools: 'gemini', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.gemini', 'commands', 'grsx', 'explore.toml');
      expect(await fileExists(cmdFile)).toBe(true);

      const content = await fs.readFile(cmdFile, 'utf-8');
      expect(content).toContain('description =');
      expect(content).toContain('prompt =');
    });

    it('should generate Windsurf commands', async () => {
      const initCommand = new InitCommand({ tools: 'windsurf', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.windsurf', 'workflows', 'grsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(true);
    });

    it('should generate Continue prompt files', async () => {
      const initCommand = new InitCommand({ tools: 'continue', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.continue', 'prompts', 'grsx-explore.prompt');
      expect(await fileExists(cmdFile)).toBe(true);

      const content = await fs.readFile(cmdFile, 'utf-8');
      expect(content).toContain('name: grsx-explore');
      expect(content).toContain('invokable: true');
    });

    it('should generate Cline workflow files', async () => {
      const initCommand = new InitCommand({ tools: 'cline', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.clinerules', 'workflows', 'grsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(true);
    });

    it('should generate GitHub Copilot prompt files', async () => {
      const initCommand = new InitCommand({ tools: 'github-copilot', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.github', 'prompts', 'grsx-explore.prompt.md');
      expect(await fileExists(cmdFile)).toBe(true);
    });
  });
});

describe('InitCommand - profile and detection features', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `grspec-init-profile-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid polluting real config
    configTempDir = path.join(os.tmpdir(), `grspec-config-test-${Date.now()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should use --profile flag to override global config', async () => {
    // Set global config to custom profile
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new', 'apply'],
    });

    // Override with --profile standard (former core alias target)
    const initCommand = new InitCommand({ tools: 'claude', force: true, profile: 'standard' });
    await initCommand.execute(testDir);

    // Standard profile skills should be created
    const proposeSkill = path.join(testDir, '.claude', 'skills', 'grspec-propose', 'SKILL.md');
    expect(await fileExists(proposeSkill)).toBe(true);

    // Non-standard skills (from the custom profile) should NOT be created
    const newChangeSkill = path.join(testDir, '.claude', 'skills', 'grspec-new-change', 'SKILL.md');
    expect(await fileExists(newChangeSkill)).toBe(false);
  });

  it('should reject invalid --profile values', async () => {
    const initCommand = new InitCommand({
      tools: 'claude',
      force: true,
      profile: 'invalid-profile',
    });

    await expect(initCommand.execute(testDir)).rejects.toThrow(
      /Invalid profile "invalid-profile"/
    );
  });

  it('should use detected tools in non-interactive mode when no --tools flag', async () => {
    // Create a .claude directory to simulate detected tool
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });

    const initCommand = new InitCommand({ interactive: false, force: true });
    await initCommand.execute(testDir);

    // Should have used claude (detected)
    const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);
  });

  it('should leave marker-era slash leftovers untouched when initializing (cleanup retired)', async () => {
    const legacyDir = path.join(testDir, '.opencode', 'command');
    await fs.mkdir(legacyDir, { recursive: true });
    await fs.writeFile(path.join(legacyDir, 'grsx-propose.md'), 'legacy content');

    const initCommand = new InitCommand({ tools: 'opencode' });
    await initCommand.execute(testDir);

    // Migration window closed: init no longer auto-deletes pre-skills leftovers
    expect(await fileExists(path.join(legacyDir, 'grsx-propose.md'))).toBe(true);

    const newCommandsDir = path.join(testDir, '.opencode', 'commands');
    expect(await directoryExists(newCommandsDir)).toBe(true);
  });

  it('should preselect configured tools but not directory-detected tools in extend mode', async () => {
    // Simulate existing grspec project (extend mode).
    await fs.mkdir(path.join(testDir, 'grspec'), { recursive: true });

    // Configured with grspec
    const claudeSkillDir = path.join(testDir, '.claude', 'skills', 'grspec-explore');
    await fs.mkdir(claudeSkillDir, { recursive: true });
    await fs.writeFile(path.join(claudeSkillDir, 'SKILL.md'), 'configured');

    // Directory detected only (not configured with grspec)
    await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['claude']);

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(testDir);

    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    const [{ choices }] = searchableMultiSelectMock.mock.calls[0] as [{ choices: Array<{ value: string; preSelected?: boolean; detected?: boolean }> }];

    const claude = choices.find((choice) => choice.value === 'claude');
    const githubCopilot = choices.find((choice) => choice.value === 'github-copilot');

    expect(claude?.preSelected).toBe(true);
    expect(githubCopilot?.preSelected).toBe(false);
    expect(githubCopilot?.detected).toBe(true);
  });

  it('should preselect detected tools for first-time interactive setup', async () => {
    // First-time init: no grspec/ directory and no configured grspec skills.
    await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['github-copilot']);

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(testDir);

    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    const [{ choices }] = searchableMultiSelectMock.mock.calls[0] as [{ choices: Array<{ value: string; preSelected?: boolean }> }];
    const githubCopilot = choices.find((choice) => choice.value === 'github-copilot');

    expect(githubCopilot?.preSelected).toBe(true);
  });

  it('should respect custom profile from global config', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new'],
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Custom profile skills should be created
    const exploreSkill = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
    const newChangeSkill = path.join(testDir, '.claude', 'skills', 'grspec-new-change', 'SKILL.md');
    expect(await fileExists(exploreSkill)).toBe(true);
    expect(await fileExists(newChangeSkill)).toBe(true);

    // Non-selected skills should NOT be created
    const proposeSkill = path.join(testDir, '.claude', 'skills', 'grspec-propose', 'SKILL.md');
    expect(await fileExists(proposeSkill)).toBe(false);
  });

  it('should migrate commands-only extend mode to custom profile without injecting propose', async () => {
    await fs.mkdir(path.join(testDir, 'grspec'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'commands', 'grsx'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.claude', 'commands', 'grsx', 'explore.md'), '# explore\n');

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const config = getGlobalConfig();
    expect(config.profile).toBe('custom');
    expect(config.delivery).toBe('commands');
    expect(config.workflows).toEqual(['explore']);

    const exploreCommand = path.join(testDir, '.claude', 'commands', 'grsx', 'explore.md');
    const proposeCommand = path.join(testDir, '.claude', 'commands', 'grsx', 'propose.md');
    expect(await fileExists(exploreCommand)).toBe(true);
    expect(await fileExists(proposeCommand)).toBe(false);

    const exploreSkill = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
    const proposeSkill = path.join(testDir, '.claude', 'skills', 'grspec-propose', 'SKILL.md');
    expect(await fileExists(exploreSkill)).toBe(false);
    expect(await fileExists(proposeSkill)).toBe(false);
  });

  it('should not prompt for confirmation when applying custom profile in interactive init', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'custom',
      delivery: 'both',
      workflows: ['explore', 'new'],
    });

    const initCommand = new InitCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
    vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);

    await initCommand.execute(testDir);

    expect(showWelcomeScreenMock).toHaveBeenCalled();
    expect(confirmMock).not.toHaveBeenCalled();

    const exploreSkill = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
    const newChangeSkill = path.join(testDir, '.claude', 'skills', 'grspec-new-change', 'SKILL.md');
    expect(await fileExists(exploreSkill)).toBe(true);
    expect(await fileExists(newChangeSkill)).toBe(true);

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    expect(logCalls.some((entry) => entry.includes('Applying custom profile'))).toBe(false);
  });

  it('should respect delivery=skills setting (no commands)', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'standard',
      delivery: 'skills',
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Skills should exist
    const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    // Commands should NOT exist
    const cmdFile = path.join(testDir, '.claude', 'commands', 'grsx', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(false);
  });

  it('should respect delivery=commands setting (no skills)', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'standard',
      delivery: 'commands',
    });

    const initCommand = new InitCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Skills should NOT exist
    const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(false);

    // Commands should exist
    const cmdFile = path.join(testDir, '.claude', 'commands', 'grsx', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(true);
  });

  it('should remove commands on re-init when delivery changes to skills', async () => {
    saveGlobalConfig({
      featureFlags: {},
      profile: 'standard',
      delivery: 'both',
    });

    const initCommand1 = new InitCommand({ tools: 'claude', force: true });
    await initCommand1.execute(testDir);

    const cmdFile = path.join(testDir, '.claude', 'commands', 'grsx', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(true);

    saveGlobalConfig({
      featureFlags: {},
      profile: 'standard',
      delivery: 'skills',
    });

    const initCommand2 = new InitCommand({ tools: 'claude', force: true });
    await initCommand2.execute(testDir);

    expect(await fileExists(cmdFile)).toBe(false);

    const skillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);
  });

  describe('AGENTS.md generation', () => {
    it('should generate AGENTS.md on first init', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      expect(await fileExists(agentsMdPath)).toBe(true);

      const content = await fs.readFile(agentsMdPath, 'utf-8');
      expect(content).toContain('Generated by grspec');
      expect(content).toContain('## Commands');
      expect(content).toContain('## Boundaries');
      expect(content).toContain('## Code Style');
      expect(content).toContain('## grspec Workflow');
    });

    it('should not overwrite existing AGENTS.md in extend mode', async () => {
      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      await fs.writeFile(agentsMdPath, '# My custom AGENTS.md\n');

      const initCommand = new InitCommand({ tools: 'claude' });
      await initCommand.execute(testDir);

      const content = await fs.readFile(agentsMdPath, 'utf-8');
      expect(content).toBe('# My custom AGENTS.md\n');
    });

    it('should regenerate AGENTS.md with --force', async () => {
      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      await fs.writeFile(agentsMdPath, '# Old content\n');

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const content = await fs.readFile(agentsMdPath, 'utf-8');
      expect(content).toContain('Generated by grspec');
      expect(content).not.toContain('Old content');
    });

    it('should detect package.json commands for AGENTS.md', async () => {
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-project', scripts: { build: 'tsc', test: 'vitest' } }),
      );

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      const content = await fs.readFile(agentsMdPath, 'utf-8');
      expect(content).toContain('# test-project');
      expect(content).toMatch(/run build/);
      expect(content).toMatch(/run test/);
    });

    it('should generate CLAUDE.md when tools=claude', async () => {
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      expect(await fileExists(claudeMdPath)).toBe(true);

      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toContain('@AGENTS.md');
      expect(content).toContain('Claude-specific');
    });

    it('should not generate CLAUDE.md when tools=cursor', async () => {
      const initCommand = new InitCommand({ tools: 'cursor', force: true });
      await initCommand.execute(testDir);

      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      expect(await fileExists(claudeMdPath)).toBe(false);
    });

    it('should not overwrite existing CLAUDE.md without --force', async () => {
      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      await fs.writeFile(claudeMdPath, '# My custom CLAUDE.md\n');

      const initCommand = new InitCommand({ tools: 'claude' });
      await initCommand.execute(testDir);

      const content = await fs.readFile(claudeMdPath, 'utf-8');
      expect(content).toBe('# My custom CLAUDE.md\n');
    });

    it('should generate AGENTS.md even when tools=none', async () => {
      const initCommand = new InitCommand({ tools: 'none', force: true });
      await initCommand.execute(testDir);

      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      expect(await fileExists(agentsMdPath)).toBe(true);
    });
  });
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
