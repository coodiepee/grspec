/**
 * Agent Skill Templates
 *
 * Compatibility facade that re-exports split workflow template modules.
 */

export type { SkillTemplate, CommandTemplate } from './types.js';

export { getExploreSkillTemplate, getGrsxExploreCommandTemplate } from './workflows/explore.js';
export { getNewChangeSkillTemplate, getGrsxNewCommandTemplate } from './workflows/new-change.js';
export { getContinueChangeSkillTemplate, getGrsxContinueCommandTemplate } from './workflows/continue-change.js';
export { getApplyChangeSkillTemplate, getGrsxApplyCommandTemplate } from './workflows/apply-change.js';
export { getFfChangeSkillTemplate, getGrsxFfCommandTemplate } from './workflows/ff-change.js';
export { getSyncSpecsSkillTemplate, getGrsxSyncCommandTemplate } from './workflows/sync-specs.js';
export { getArchiveChangeSkillTemplate, getGrsxArchiveCommandTemplate } from './workflows/archive-change.js';
export { getBulkArchiveChangeSkillTemplate, getGrsxBulkArchiveCommandTemplate } from './workflows/bulk-archive-change.js';
export { getVerifySkillTemplate, getGrsxVerifyCommandTemplate } from './workflows/verify.js';
export { getValidateSkillTemplate, getGrsxValidateCommandTemplate } from './workflows/validate.js';
export { getOnboardSkillTemplate, getGrsxOnboardCommandTemplate } from './workflows/onboard.js';
export { getGrsxProposeSkillTemplate, getGrsxProposeCommandTemplate } from './workflows/propose.js';
export { getFeedbackSkillTemplate } from './workflows/feedback.js';
export { getTddSkillTemplate } from './workflows/tdd.js';
export { getDebugSkillTemplate } from './workflows/debug.js';
export { getReviewSkillTemplate } from './workflows/review.js';
export { getParallelDispatchSkillTemplate } from './workflows/parallel-dispatch.js';
export { getSubagentSkillTemplate } from './workflows/subagent.js';
export {
  getWikiSkillTemplate,
  getGrsxWikiCommandTemplate,
  getGrsxWikiInitCommandTemplate,
  getGrsxWikiIngestCommandTemplate,
  getGrsxWikiLintCommandTemplate,
  getGrsxWikiQueryCommandTemplate,
  getGrsxWikiSyncCommandTemplate,
  getGrsxWikiStatusCommandTemplate,
} from './workflows/wiki.js';
export {
  getUiInitSkillTemplate,
  getUiSearchSkillTemplate,
  getUiDesignSystemSkillTemplate,
  getUiRulesSkillTemplate,
  getUiReferenceSkillTemplate,
  getUiReviewSkillTemplate,
  getUiStatusSkillTemplate,
  getUiDetectSkillTemplate,
  getUiInstallSkillTemplate,
  getUiSyncSkillTemplate,
  getGrsxUiInitCommandTemplate,
  getGrsxUiSearchCommandTemplate,
  getGrsxUiDesignSystemCommandTemplate,
  getGrsxUiRulesCommandTemplate,
  getGrsxUiReferenceCommandTemplate,
  getGrsxUiReviewCommandTemplate,
  getGrsxUiStatusCommandTemplate,
  getGrsxUiDetectCommandTemplate,
  getGrsxUiInstallCommandTemplate,
  getGrsxUiSyncCommandTemplate,
} from './workflows/ui.js';
