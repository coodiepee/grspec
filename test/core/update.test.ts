import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UpdateCommand, scanInstalledWorkflows } from '../../src/core/update.js';
import { InitCommand } from '../../src/core/init.js';
import { FileSystemUtils } from '../../src/utils/file-system.js';
import type { GlobalConfig } from '../../src/core/global-config.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { randomUUID } from 'crypto';

// Shared mutable mock config state
const mockState = {
  config: {
    featureFlags: {},
    profile: 'standard' as const,
    delivery: 'both' as const,
  } as GlobalConfig,
};

// Mock global config module to isolate tests from the machine's actual config
vi.mock('../../src/core/global-config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core/global-config.js')>();

  return {
    ...actual,
    getGlobalConfig: () => ({ ...mockState.config }),
    saveGlobalConfig: vi.fn(),
  };
});

// Mock migration to prevent interference from real config file state
vi.mock('../../src/core/migration.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core/migration.js')>();
  return {
    ...actual,
    migrateIfNeeded: vi.fn(),
  };
});

// Helper to set mock config for tests
function setMockConfig(config: GlobalConfig) {
  mockState.config = config;
}

function resetMockConfig() {
  mockState.config = {
    featureFlags: {},
    profile: 'standard',
    delivery: 'both',
    workflows: ['propose', 'explore', 'apply', 'sync', 'archive', 'tdd', 'validate', 'verify', 'debug', 'review'],
  };
}

describe('UpdateCommand', () => {
  let testDir: string;
  let updateCommand: UpdateCommand;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `grspec-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Create grspec directory
    const grspecDir = path.join(testDir, 'grspec');
    await fs.mkdir(grspecDir, { recursive: true });

    updateCommand = new UpdateCommand();

    // Reset mock config to defaults
    resetMockConfig();

    // Clear all mocks before each test
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    // Restore all mocks after each test
    vi.restoreAllMocks();

    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('basic validation', () => {
    it('should throw error if grspec directory does not exist', async () => {
      // Remove grspec directory
      await fs.rm(path.join(testDir, 'grspec'), {
        recursive: true,
        force: true,
      });

      await expect(updateCommand.execute(testDir)).rejects.toThrow(
        "No grspec directory found. Run 'grspec init' first."
      );
    });

    it('should report no configured tools when none exist', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No configured tools found')
      );

      consoleSpy.mockRestore();
    });

    it('should provision skills and commands for GRCode via --tools', async () => {
      await fs.mkdir(path.join(testDir, '.grcode'), { recursive: true });

      const grcodeUpdate = new UpdateCommand({ force: true, tools: 'grcode' });
      await grcodeUpdate.execute(testDir);

      const exploreSkill = path.join(testDir, '.grcode', 'skills', 'grspec-explore', 'SKILL.md');
      const exploreCommand = path.join(testDir, '.grcode', 'commands', 'grsx-explore.md');
      const uiInitSkill = path.join(testDir, '.grcode', 'skills', 'grspec-ui-init', 'SKILL.md');

      expect(await fs.stat(exploreSkill).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.stat(exploreCommand).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.stat(uiInitSkill).then(() => true).catch(() => false)).toBe(true);
    });
  });

  describe('skill updates', () => {
    it('should update skill files for configured Claude tool', async () => {
      // Set up a configured Claude tool by creating skill directories
      const skillsDir = path.join(testDir, '.claude', 'skills');
      const exploreSkillDir = path.join(skillsDir, 'grspec-explore');
      await fs.mkdir(exploreSkillDir, { recursive: true });

      // Create an existing skill file
      const oldSkillContent = `---
name: grspec-explore (old)
description: Old description
license: MIT
compatibility: Requires grspec CLI.
metadata:
  author: grspec
  version: "0.9"
---

Old instructions content
`;
      await fs.writeFile(
        path.join(exploreSkillDir, 'SKILL.md'),
        oldSkillContent
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Check skill file was updated
      const updatedSkill = await fs.readFile(
        path.join(exploreSkillDir, 'SKILL.md'),
        'utf-8'
      );
      expect(updatedSkill).toContain('name: grspec-explore');
      expect(updatedSkill).not.toContain('Old instructions content');
      expect(updatedSkill).toContain('license: MIT');

      // Check console output
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating 1 tool(s): claude')
      );

      consoleSpy.mockRestore();
    });

    it('should update standard profile skill files when tool is configured', async () => {
      // Set up a configured tool with one skill directory
      const skillsDir = path.join(testDir, '.claude', 'skills');

      // Create at least one skill to mark tool as configured
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      // Verify standard profile skill files were created/updated
      const standardSkillNames = [
        'grspec-explore',
        'grspec-apply-change',
        'grspec-sync-specs',
        'grspec-archive-change',
        'grspec-propose',
        'grspec-validate',
        'grspec-verify',
      ];

      for (const skillName of standardSkillNames) {
        const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
        const exists = await FileSystemUtils.fileExists(skillFile);
        expect(exists).toBe(true);

        const content = await fs.readFile(skillFile, 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('name:');
        expect(content).toContain('description:');
      }

      // Verify full-only skills are NOT created under standard profile
      const nonStandardSkillNames = [
        'grspec-new-change',
        'grspec-continue-change',
        'grspec-ff-change',
        'grspec-bulk-archive-change',
      ];

      for (const skillName of nonStandardSkillNames) {
        const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
        const exists = await FileSystemUtils.fileExists(skillFile);
        expect(exists).toBe(false);
      }
    });
  });

  describe('command updates', () => {
    it('should update grsx commands for configured Claude tool', async () => {
      // Set up a configured Claude tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      // Check grsx command files were created
      const commandsDir = path.join(testDir, '.claude', 'commands', 'grsx');
      const exploreCmd = path.join(commandsDir, 'explore.md');
      const exists = await FileSystemUtils.fileExists(exploreCmd);
      expect(exists).toBe(true);

      const content = await fs.readFile(exploreCmd, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('category:');
      expect(content).toContain('tags:');
    });

    it('should update standard profile grsx commands when tool is configured', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      // Verify standard profile commands were created
      const standardCommandIds = [
        'explore',
        'apply',
        'sync',
        'archive',
        'propose',
        'validate',
        'verify',
      ];
      const commandsDir = path.join(testDir, '.claude', 'commands', 'grsx');
      for (const cmdId of standardCommandIds) {
        const cmdFile = path.join(commandsDir, `${cmdId}.md`);
        const exists = await FileSystemUtils.fileExists(cmdFile);
        expect(exists).toBe(true);
      }

      // Verify full-only commands are NOT created under standard profile
      const nonStandardCommandIds = ['new', 'continue', 'ff', 'bulk-archive'];
      for (const cmdId of nonStandardCommandIds) {
        const cmdFile = path.join(commandsDir, `${cmdId}.md`);
        const exists = await FileSystemUtils.fileExists(cmdFile);
        expect(exists).toBe(false);
      }
    });

  });

  describe('multi-tool support', () => {
    it('should update multiple configured tools', async () => {
      // Set up Claude
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(claudeSkillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      // Set up Cursor
      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(cursorSkillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Both tools should be updated
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating 2 tool(s)')
      );

      // Verify Claude skills updated
      const claudeSkill = await fs.readFile(
        path.join(claudeSkillsDir, 'grspec-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(claudeSkill).toContain('name: grspec-explore');

      // Verify Cursor skills updated
      const cursorSkill = await fs.readFile(
        path.join(cursorSkillsDir, 'grspec-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(cursorSkill).toContain('name: grspec-explore');

      consoleSpy.mockRestore();
    });

    it('should update Qwen tool with correct command format', async () => {
      // Set up Qwen
      const qwenSkillsDir = path.join(testDir, '.qwen', 'skills');
      await fs.mkdir(path.join(qwenSkillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(qwenSkillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      // Check Qwen command format (TOML) - Qwen uses flat path structure: grsx-<id>.toml
      const qwenCmd = path.join(
        testDir,
        '.qwen',
        'commands',
        'grsx-explore.toml'
      );
      const exists = await FileSystemUtils.fileExists(qwenCmd);
      expect(exists).toBe(true);

      const content = await fs.readFile(qwenCmd, 'utf-8');
      expect(content).toContain('description =');
      expect(content).toContain('prompt =');
    });

    it('should update Windsurf tool with correct command format', async () => {
      // Set up Windsurf
      const windsurfSkillsDir = path.join(testDir, '.windsurf', 'skills');
      await fs.mkdir(path.join(windsurfSkillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(windsurfSkillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      // Check Windsurf command format
      const windsurfCmd = path.join(
        testDir,
        '.windsurf',
        'workflows',
        'grsx-explore.md'
      );
      const exists = await FileSystemUtils.fileExists(windsurfCmd);
      expect(exists).toBe(true);

      const content = await fs.readFile(windsurfCmd, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('name:');
    });
  });

  describe('error handling', () => {
    it('should handle tool update failures gracefully', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      // Mock writeFile to fail for skills
      const originalWriteFile = FileSystemUtils.writeFile.bind(FileSystemUtils);
      const writeSpy = vi
        .spyOn(FileSystemUtils, 'writeFile')
        .mockImplementation(async (filePath, content) => {
          if (filePath.includes('SKILL.md')) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile(filePath, content);
        });

      const consoleSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // Should not throw
      await updateCommand.execute(testDir);

      // Should report failure (errors go to console.error via logger.error)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed')
      );

      writeSpy.mockRestore();
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should continue updating other tools when one fails', async () => {
      // Set up Claude and Cursor
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(claudeSkillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(cursorSkillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      // Mock writeFile to fail only for Claude
      const originalWriteFile = FileSystemUtils.writeFile.bind(FileSystemUtils);
      const writeSpy = vi
        .spyOn(FileSystemUtils, 'writeFile')
        .mockImplementation(async (filePath, content) => {
          if (filePath.includes('.claude') && filePath.includes('SKILL.md')) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile(filePath, content);
        });

      const consoleSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      await updateCommand.execute(testDir);

      // Cursor should still be updated - check the actual format from ora spinner
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated: Cursor')
      );

      // Claude should be reported as failed (errors go to console.error via logger.error)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed')
      );

      writeSpy.mockRestore();
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('tool detection', () => {
    it('should detect tool as configured only when skill file exists', async () => {
      // Create skills directory but no skill files
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(skillsDir, { recursive: true });

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should report no configured tools
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No configured tools found')
      );

      consoleSpy.mockRestore();
    });

    it('should detect tool when any single skill exists', async () => {
      // Create only one skill file
      const skillDir = path.join(
        testDir,
        '.claude',
        'skills',
        'grspec-archive-change'
      );
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), 'old');

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should detect and update Claude
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating 1 tool(s): claude')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('skill content validation', () => {
    it('should generate valid YAML frontmatter in skill files', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      const skillContent = await fs.readFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'utf-8'
      );

      // Validate frontmatter structure
      expect(skillContent).toMatch(/^---\n/);
      expect(skillContent).toContain('name:');
      expect(skillContent).toContain('description:');
      expect(skillContent).toContain('license:');
      expect(skillContent).toContain('compatibility:');
      expect(skillContent).toContain('metadata:');
      expect(skillContent).toContain('author:');
      expect(skillContent).toContain('version:');
      expect(skillContent).toMatch(/---\n\n/);
    });

    it('should include proper instructions in skill files', async () => {
      // Set up a configured tool with apply-change skill (which is in core profile)
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-apply-change'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-apply-change', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      const skillContent = await fs.readFile(
        path.join(skillsDir, 'grspec-apply-change', 'SKILL.md'),
        'utf-8'
      );

      // Apply skill should contain implementation instructions
      expect(skillContent.toLowerCase()).toContain('plan');
    });
  });

  describe('success output', () => {
    it('should display success message with tool name', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // The success output uses "✓ Updated: <name>"
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated: Claude Code')
      );

      consoleSpy.mockRestore();
    });

    it('should suggest IDE restart after update', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Restart your IDE')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('smart update detection', () => {
    it('should show "up to date" message when skills have current version', async () => {
      // Initialize full core profile output so there is no profile/delivery drift.
      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('up to date')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('--force')
      );

      consoleSpy.mockRestore();
    });

    it('should detect update needed when generatedBy is missing', async () => {
      // Set up a configured tool without generatedBy
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        `---
name: grspec-explore
metadata:
  author: grspec
  version: "1.0"
---

Legacy content without generatedBy
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show "unknown → version" in the update message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown')
      );

      consoleSpy.mockRestore();
    });

    it('should detect update needed when version differs', async () => {
      // Set up a configured tool with old version
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        `---
name: grspec-explore
metadata:
  generatedBy: "0.1.0"
---

Old version content
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show version transition
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('0.1.0')
      );

      consoleSpy.mockRestore();
    });

    it('should embed generatedBy in updated skill files', async () => {
      // Set up a configured tool without generatedBy
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old content without version'
      );

      await updateCommand.execute(testDir);

      const updatedContent = await fs.readFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'utf-8'
      );

      // Should contain generatedBy field
      expect(updatedContent).toMatch(/generatedBy:\s*["']\d+\.\d+\.\d+["']/);
    });
  });

  describe('--force flag', () => {
    it('should update when force is true even if up to date', async () => {
      // Set up a configured tool with current version
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });

      const { version } = await import('../../package.json');
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        `---
metadata:
  generatedBy: "${version}"
---
Content
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show "Force updating" message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Force updating')
      );

      // Should show updated message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated: Claude Code')
      );

      consoleSpy.mockRestore();
    });

    it('should not show --force hint when force is used', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old content'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Get all console.log calls as strings
      const allCalls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );

      // Should not show "Use --force" since force was used
      const hasForceHint = allCalls.some(call => call.includes('Use --force'));
      expect(hasForceHint).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should update all tools when force is used with mixed versions', async () => {
      // Set up Claude with current version
      const { version } = await import('../../package.json');
      const claudeSkillDir = path.join(testDir, '.claude', 'skills', 'grspec-explore');
      await fs.mkdir(claudeSkillDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeSkillDir, 'SKILL.md'),
        `---
metadata:
  generatedBy: "${version}"
---
`
      );

      // Set up Cursor with old version
      const cursorSkillDir = path.join(testDir, '.cursor', 'skills', 'grspec-explore');
      await fs.mkdir(cursorSkillDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorSkillDir, 'SKILL.md'),
        `---
metadata:
  generatedBy: "0.1.0"
---
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show both tools being force updated
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Force updating 2 tool(s)')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('version tracking', () => {
    it('should show version in success message', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show version in success message
      const { version } = await import('../../package.json');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`(v${version})`)
      );

      consoleSpy.mockRestore();
    });

    it('should only update tools that need updating', async () => {
      // Initialize both tools so Cursor is fully synced with profile/delivery.
      const initCommand = new InitCommand({ tools: 'claude,cursor', force: true });
      await initCommand.execute(testDir);

      // Make Claude stale to force a version update.
      const claudeSkillFile = path.join(testDir, '.claude', 'skills', 'grspec-explore', 'SKILL.md');
      const claudeContent = await fs.readFile(claudeSkillFile, 'utf-8');
      await fs.writeFile(
        claudeSkillFile,
        claudeContent.replace(/generatedBy:\s*["'][^"']+["']/, 'generatedBy: "0.0.1"')
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show only Claude being updated
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating 1 tool(s)')
      );

      // Should mention Cursor is already up to date
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already up to date: cursor')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('profile-aware updates', () => {
    it('should generate only profile workflows when custom profile is set', async () => {
      // Set custom profile with only explore and new
      setMockConfig({
        featureFlags: {},
        profile: 'custom',
        delivery: 'both',
        workflows: ['explore', 'new'],
      });

      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // Should create explore and new skills
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md')
      )).toBe(true);
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'grspec-new-change', 'SKILL.md')
      )).toBe(true);

      // Should NOT create non-profile skills
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'grspec-apply-change', 'SKILL.md')
      )).toBe(false);
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'grspec-propose', 'SKILL.md')
      )).toBe(false);
    });

    it('should suggest standard preset when custom profile preserves the old minimal workflow set', async () => {
      setMockConfig({
        featureFlags: {},
        profile: 'custom',
        delivery: 'both',
        workflows: ['propose', 'explore', 'apply', 'archive'],
      });

      const initCommand = new InitCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      expect(calls.some(call =>
        call.includes('The standard profile now includes sync')
      )).toBe(true);
      expect(calls.some(call =>
        call.includes('grspec config profile standard') && call.includes('grspec update')
      )).toBe(true);

      expect(await FileSystemUtils.fileExists(
        path.join(testDir, '.claude', 'skills', 'grspec-sync-specs', 'SKILL.md')
      )).toBe(false);
      expect(await FileSystemUtils.fileExists(
        path.join(testDir, '.claude', 'commands', 'grsx', 'sync.md')
      )).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should respect skills-only delivery setting', async () => {
      setMockConfig({
        featureFlags: {},
        profile: 'core',
        delivery: 'skills',
      });

      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // Skills should be created
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md')
      )).toBe(true);

      // Commands should NOT be created
      const commandsDir = path.join(testDir, '.claude', 'commands', 'grsx');
      expect(await FileSystemUtils.fileExists(
        path.join(commandsDir, 'explore.md')
      )).toBe(false);
    });

    it('should respect commands-only delivery setting', async () => {
      setMockConfig({
        featureFlags: {},
        profile: 'core',
        delivery: 'commands',
      });

      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // Commands should be created
      const commandsDir = path.join(testDir, '.claude', 'commands', 'grsx');
      expect(await FileSystemUtils.fileExists(
        path.join(commandsDir, 'explore.md')
      )).toBe(true);

      // Skills should be removed for commands-only delivery
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md')
      )).toBe(false);
    });

    it('should remove skills for configured tools without command adapters in commands-only delivery', async () => {
      setMockConfig({
        featureFlags: {},
        profile: 'core',
        delivery: 'commands',
      });

      const { AI_TOOLS } = await import('../../src/core/config.js');
      const { CommandAdapterRegistry } = await import('../../src/core/command-generation/index.js');
      const adapterlessTool = AI_TOOLS.find((tool) => tool.skillsDir && !CommandAdapterRegistry.get(tool.value));
      expect(adapterlessTool).toBeDefined();
      if (!adapterlessTool?.skillsDir) {
        return;
      }

      const skillsDir = path.join(testDir, adapterlessTool.skillsDir, 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      await expect(updateCommand.execute(testDir)).resolves.toBeUndefined();

      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md')
      )).toBe(false);
    });

    it('should apply config sync when templates are up to date', async () => {
      setMockConfig({
        featureFlags: {},
        profile: 'core',
        delivery: 'skills',
      });

      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), { recursive: true });
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8')) as { version: string };
      await fs.writeFile(
        path.join(skillsDir, 'grspec-explore', 'SKILL.md'),
        `---
name: grspec-explore
metadata:
  generatedBy: "${packageJson.version}"
---
content
`
      );

      const commandsDir = path.join(testDir, '.claude', 'commands', 'grsx');
      await fs.mkdir(commandsDir, { recursive: true });
      await fs.writeFile(path.join(commandsDir, 'explore.md'), 'old command');

      await updateCommand.execute(testDir);

      // Command files should be removed due to delivery change, even though skill version is current
      expect(await FileSystemUtils.fileExists(
        path.join(commandsDir, 'explore.md')
      )).toBe(false);
    });

    it('should detect commands-only tool configuration', async () => {
      setMockConfig({
        featureFlags: {},
        profile: 'core',
        delivery: 'commands',
      });

      const commandsDir = path.join(testDir, '.claude', 'commands', 'grsx');
      await fs.mkdir(commandsDir, { recursive: true });
      await fs.writeFile(path.join(commandsDir, 'explore.md'), 'existing command');

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should not short-circuit with "No configured tools found"
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasNoConfiguredMessage = calls.some(call =>
        call.includes('No configured tools found')
      );
      expect(hasNoConfiguredMessage).toBe(false);

      // Commands should be updated/generated for the core profile
      expect(await FileSystemUtils.fileExists(
        path.join(commandsDir, 'propose.md')
      )).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should remove workflows outside profile during update sync', async () => {
      // Set core profile (propose, explore, apply, sync, archive)
      setMockConfig({
        featureFlags: {},
        profile: 'core',
        delivery: 'both',
      });

      // Set up tool with extra workflows beyond core profile
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      // Add a non-core workflow
      await fs.mkdir(path.join(skillsDir, 'grspec-new-change'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'grspec-new-change', 'SKILL.md'), 'old');
      const extraCommandFile = path.join(testDir, '.claude', 'commands', 'grsx', 'new.md');
      await fs.mkdir(path.dirname(extraCommandFile), { recursive: true });
      await fs.writeFile(extraCommandFile, 'old');

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Deselected workflow artifacts should be removed for both delivery surfaces.
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'grspec-new-change', 'SKILL.md')
      )).toBe(false);
      expect(await FileSystemUtils.fileExists(extraCommandFile)).toBe(false);

      // Should report deselected workflow cleanup.
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasDeselectedRemovalNote = calls.some(call =>
        call.includes('deselected workflows')
      );
      expect(hasDeselectedRemovalNote).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('new tool detection', () => {
    it('should detect new tool directories not currently configured', async () => {
      // Set up a configured Claude tool
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      // Create a Cursor directory (not configured — no skills)
      await fs.mkdir(path.join(testDir, '.cursor'), { recursive: true });

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should detect Cursor as a new tool
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasNewToolMessage = calls.some(call =>
        call.includes("Detected new tool: Cursor. Run 'grspec update --tools <id>' or 'grspec init' to add it.")
      );
      expect(hasNewToolMessage).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should consolidate multiple new tools into one message', async () => {
      // Set up a configured Claude tool
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      // Create two unconfigured tool directories
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');
      await fs.mkdir(path.join(testDir, '.windsurf'), { recursive: true });

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );

      const consolidatedCalls = calls.filter(call =>
        call.includes('Detected new tools:')
      );
      expect(consolidatedCalls).toHaveLength(1);
      expect(consolidatedCalls[0]).toContain('GitHub Copilot');
      expect(consolidatedCalls[0]).toContain('Windsurf');
      expect(consolidatedCalls[0]).toContain("Run 'grspec update --tools <id>' or 'grspec init' to add them.");

      const repeatedSingularCalls = calls.filter(call =>
        call.includes('Detected new tool:')
      );
      expect(repeatedSingularCalls).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should not show new tool message when no new tools detected', async () => {
      // Set up a configured tool (only Claude, no other tool directories)
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasNewToolMessage = calls.some(call =>
        call.includes('Detected new tool')
      );
      expect(hasNewToolMessage).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('scanInstalledWorkflows', () => {
    it('should detect installed workflows across tools', async () => {
      // Create skills for Claude
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'grspec-explore', 'SKILL.md'), 'content');
      await fs.mkdir(path.join(claudeSkillsDir, 'grspec-apply-change'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'grspec-apply-change', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toContain('explore');
      expect(workflows).toContain('apply');
      expect(workflows).not.toContain('propose');
    });

    it('should return union of workflows across multiple tools', async () => {
      // Claude has explore
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'grspec-explore', 'SKILL.md'), 'content');

      // Cursor has apply
      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'grspec-apply-change'), { recursive: true });
      await fs.writeFile(path.join(cursorSkillsDir, 'grspec-apply-change', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude', 'cursor']);
      expect(workflows).toContain('explore');
      expect(workflows).toContain('apply');
    });

    it('should only match workflows in ALL_WORKFLOWS', async () => {
      // Create a custom skill directory that doesn't match any workflow
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'my-custom-skill'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'my-custom-skill', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toHaveLength(0);
    });

    it('should return empty array when no tools have skills', async () => {
      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toHaveLength(0);
    });

    it('should detect installed workflows from managed command files', async () => {
      const commandsDir = path.join(testDir, '.claude', 'commands', 'grsx');
      await fs.mkdir(commandsDir, { recursive: true });
      await fs.writeFile(path.join(commandsDir, 'explore.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toContain('explore');
    });
  });

  describe('tools output', () => {
    it('should list affected tools in output', async () => {
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'grspec-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'grspec-explore', 'SKILL.md'), 'old');

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasToolsList = calls.some(call =>
        call.includes('Tools:') && call.includes('Claude Code')
      );
      expect(hasToolsList).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
