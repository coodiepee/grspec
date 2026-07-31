/**
 * AGENTS.md Generation Module
 *
 * Generates project-aware AGENTS.md and tool-specific pointer files during grspec init.
 */

export {
  generateAgentsMdContent,
  detectProjectMetadata,
  type ProjectMetadata,
  type EcosystemDetail,
  type CommandEntry,
} from './generator.js';
export { assembleAgentsMd, getCodeStyleSummary, type AgentsMdSections } from './template.js';
export { generateClaudeMd, generateGeminiMd } from './pointer-files.js';
