/**
 * UI/UX Design Intelligence Module
 *
 * BM25-powered search over 67 UI styles, 161 color palettes, 57 font pairings,
 * 99 UX guidelines, and 25 chart types across 16 technology stacks.
 */

export { BM25 } from './bm25.js';
export { loadCsv, getDataDir, parseCsvLine, type CsvRow } from './csv-loader.js';
export {
  CSV_CONFIG,
  STACK_CONFIG,
  STACK_COLS,
  DOMAIN_KEYWORDS,
  MAX_RESULTS,
  AVAILABLE_DOMAINS,
  AVAILABLE_STACKS,
  type DomainConfig,
  type StackConfig,
} from './config.js';
export {
  search,
  searchStack,
  detectDomain,
  type SearchResult,
} from './search.js';
export {
  generateDesignSystem,
  type DesignSystem,
  type DesignSystemPattern,
  type DesignSystemStyle,
  type DesignSystemColors,
  type DesignSystemTypography,
} from './design-system.js';
export { formatAsciiBox, formatMarkdown } from './formatters.js';
export {
  persistDesignSystem,
  persistProjectFoundation,
  persistChangePage,
  isChangeDirectory,
  type PersistResult,
} from './persist.js';
export {
  detectUiContent,
  detectUiContentInChange,
  type UiDetectionResult,
} from './detect.js';
export {
  loadRules,
  filterByCategory,
  filterByPlatform,
  filterBySeverity,
  searchRules,
  formatChecklist,
  type Rule,
} from './rules.js';
export {
  parseDesignCsv,
  listStyles,
  getStyleSpec,
  searchStyles,
  type StyleBlock,
  type StyleListItem,
} from './reference.js';
export {
  checkCursorPointer,
  checkEmojiIcons,
  checkTransitionTiming,
  checkReducedMotion,
  aggregateFindings,
  type ReviewFinding,
  type ReviewReport,
} from './review.js';
export {
  detectDesignSystem,
  readUpstreamVersion,
  buildStatusReport,
  type DesignSystemStatus,
  type StatusReport,
} from './status.js';
export {
  listPlatforms,
  loadPlatformTemplate,
  assembleSkillContent,
  getOutputPath,
  getSkillOutputPath,
  resolveInstallSkillBundle,
  DEFAULT_UI_INSTALL_SKILLS,
  ALL_UI_INSTALL_SKILLS,
  type PlatformTemplate,
} from './installer.js';
export {
  resolveUpstreamPath,
  checkForUpdates,
  generateUpstreamMd,
  type SyncStatus,
} from './sync.js';
export {
  detectProjectStack,
  assembleInitQuery,
  checkExistingDesignSystem,
  generateRulesChecklist,
  type DetectedStack,
  type InitQueryOptions,
  type ExistingDesignSystemInfo,
} from './init.js';
