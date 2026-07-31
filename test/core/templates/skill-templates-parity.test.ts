import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getGrsxApplyCommandTemplate,
  getGrsxArchiveCommandTemplate,
  getGrsxBulkArchiveCommandTemplate,
  getGrsxContinueCommandTemplate,
  getGrsxExploreCommandTemplate,
  getGrsxFfCommandTemplate,
  getGrsxNewCommandTemplate,
  getGrsxOnboardCommandTemplate,
  getGrsxSyncCommandTemplate,
  getGrsxProposeCommandTemplate,
  getGrsxProposeSkillTemplate,
  getGrsxVerifyCommandTemplate,
  getGrsxValidateCommandTemplate,
  getValidateSkillTemplate,
  getSyncSpecsSkillTemplate,
  getVerifySkillTemplate,
  getTddSkillTemplate,
  getDebugSkillTemplate,
  getReviewSkillTemplate,
  getParallelDispatchSkillTemplate,
  getSubagentSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { loadWorkflowTemplate } from '../../../src/core/templates/loader.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  'getExploreSkillTemplate': 'fbd38280b60891b343876cdd1ac38c0ec7aedad2ace61af37fcda17bdf401bab',
  'getNewChangeSkillTemplate': '890146d6b42dc346ad6e0c5b71b1ee96e9923c84dee052cf97ef9f55e967894f',
  'getContinueChangeSkillTemplate': '6a8d5b938d3155edb373c5b12a4c0ec7b65b11ba49e7fdae3fb8118d3d48c23a',
  'getApplyChangeSkillTemplate': '4fc74d3cbd29dc4b758ccebd7dd180a9bd24c1460329f430c15caacf633ef8ad',
  'getFfChangeSkillTemplate': '7fd118f53f2c5967132548137dd6cad2ff210fcb058e259579f145b9b84de51f',
  'getSyncSpecsSkillTemplate': 'd7998671f17e991ec1f5c4a7dfc105d930c077dc08d21e7dcd1b1c5e6ace98ff',
  'getOnboardSkillTemplate': 'dd0656c503e69019847bd48d1e558f2274af8ed25d256eb080cf7e0032ac837a',
  'getGrsxExploreCommandTemplate': '5c80f2b40404a980dedb89c638a20f79952f7824e505855b3e5306a53b9904fa',
  'getGrsxNewCommandTemplate': '46f3edacbf9836f559b1306414a98c4372a5b2d873b6c061f13f2657c572cae4',
  'getGrsxContinueCommandTemplate': 'a7f23f0ce678c1ec8b94badc2b53133726943c4c2e25c99f8b6e1192d915d6e4',
  'getGrsxApplyCommandTemplate': '24ec17df26d29351182e36a62f621ca06215d9782213fc5a5df4ab61af8a481c',
  'getGrsxFfCommandTemplate': '47d8d1c76c2070e742aeeb2aa317651bf045d780c0b71e2a67e06d178872b454',
  'getArchiveChangeSkillTemplate': 'c116af1120e07654d4a86c1a2d1e4587e7a45156ed8da8d90ed84f0e75b434a3',
  'getBulkArchiveChangeSkillTemplate': '96b281da2adcee39b5bdf23b5757138d7eeac4bba1d28af87f367c6887d7e70f',
  'getGrsxSyncCommandTemplate': '4c67feec9eae91c82c7d05a9c7f17a713595436235ad00ec68f361ab0a4fbd79',
  'getVerifySkillTemplate': '05d23567adf6f7acda6d70fd337f53b973960122c9b80de505dc648e156bacd0',
  'getGrsxArchiveCommandTemplate': '571158c2ea990412a83a84024213128e15084894e04656e39c31f0cc228459ba',
  'getGrsxOnboardCommandTemplate': '546a6e873ff91184788f9c217f45dcf2eab6ba8e1516d1cb6ba0de4568198a02',
  'getGrsxBulkArchiveCommandTemplate': '58b4eeada547f52cd819070742bd50fe7bde62d7264478849f723904a86ba769',
  'getGrsxVerifyCommandTemplate': '05c7faa2f7c7f5bf486f69c6d7037ac8fffc28b70c11087bae4cbcc70a5be038',
  'getValidateSkillTemplate': '7a6a72846585fe1f80cee496f4d672605ddb3c0eb4633930ae9956014d006275',
  'getGrsxValidateCommandTemplate': '1a96cb5e06b2db412dd6719bfa6402d18ef9bf0d8af0f07a94718a2736a38935',
  'getGrsxProposeSkillTemplate': 'c8001b77a788a74e1a229a291226b6f7786b6fcadf6a3af940851a39367982e7',
  'getGrsxProposeCommandTemplate': 'd156af231bae21921d60984dae8de479bdd358757f44b59a8ddd137ca276a6e4',
  'getFeedbackSkillTemplate': '35c9ba8630b9322c041b0b80e394471aba51129dbae76fa7dd41cb53a3ce3a99',
  'getTddSkillTemplate': 'c3bc73ad51650cecd82fa1cecc35636267e4dfcd87f053c76c0e1130000d2323',
  'getDebugSkillTemplate': '22dacc792e836c091e1f5518e04d406f46ac5d24e5dc8808f9fac1ce6a5f307a',
  'getReviewSkillTemplate': 'bff9326d5ff79d648541b0645a4af48fbf2c956f556b7e5e1199b6fb54e03bd9',
  'getParallelDispatchSkillTemplate': '8d22ec795d71df0c0217adb285dd56eb864e6eae1b2fbae7abcae564cd60bf32',
  'getSubagentSkillTemplate': '278596ea8f097152e451293c18d4716d551c00c6652907fee2879e1cb1908c20',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'grspec-explore': 'e3c54e2b555ef99e5a360792594f80b64a33fb56b724106d568798b8e4b709fe',
  'grspec-new-change': '32f592512c985a78858fba791b42127df1c1215c376aca417f5288693eeabebc',
  'grspec-continue-change': 'f3cdcf5c427b0a32b1464de529e70509afdbdf0729654b2d8fbdb08a8c9f2326',
  'grspec-apply-change': '36eef99452368a1776894ada2b1a474a606e08d589f94a28478d5c6c0d734e4e',
  'grspec-ff-change': '3b03467094aa01995bf5691fde90cab4ee1ebb1f4ddb08d667fd8f3c17dd2ef7',
  'grspec-sync-specs': '46618a568fdb321f0b86df9c4771a0983f8a3e224eb6b731c53d6c78d81ecacf',
  'grspec-archive-change': '97dcf61b928ad25bc3d8d7c6428ed835493e1b2b7bf0e39579faf566953372a3',
  'grspec-bulk-archive-change': '357145053fb1f652e2f61b5d1f662f6f99745198adf99bd243ae26b193540033',
  'grspec-verify': 'a2639338e87fb38c47ca1394761436778d1b22f03e3ceb982f376e3a27386a2b',
  'grspec-validate': 'fe6d00a155dc82024b2d3a9e59158f043d92fd5979bd6bac56722d72646a315f',
  'grspec-onboard': 'f01a980b67403c04257b9ddb9a45dd0cf01b0780f5ee82d306bee3d1c4455245',
  'grspec-propose': 'd5c0d4292b258c26ee588a34b16585d03bfbb16540e6be586e65a0d7018115fd',
  'grspec-tdd': '5022f218338caf2fecd98699fd9c525e37543c70bbcee789e09af6cd0401d83c',
  'grspec-debug': '07d20d000503860295757e256265d4b18a3564f5e691d198c15d65409640922c',
  'grspec-review': 'f9251bc7e7d2235b2f2e96adea23b104a3f0191e1b4c0020a36fbcf477e12017',
  'grspec-parallel': '72f1b7ef0a58e44d39df48c9914a1cc198903a529df615bb4aca5d5715402199',
  'grspec-subagent': '01718e901f4de83ba4f6137eba272208ad044dca8ab0911e3d1706d3b78bee1a',
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getApplyChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getGrsxExploreCommandTemplate,
      getGrsxNewCommandTemplate,
      getGrsxContinueCommandTemplate,
      getGrsxApplyCommandTemplate,
      getGrsxFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getGrsxSyncCommandTemplate,
      getVerifySkillTemplate,
      getGrsxArchiveCommandTemplate,
      getGrsxOnboardCommandTemplate,
      getGrsxBulkArchiveCommandTemplate,
      getGrsxVerifyCommandTemplate,
      getGrsxValidateCommandTemplate,
      getValidateSkillTemplate,
      getGrsxProposeSkillTemplate,
      getGrsxProposeCommandTemplate,
      getFeedbackSkillTemplate,
      getTddSkillTemplate,
      getDebugSkillTemplate,
      getReviewSkillTemplate,
      getParallelDispatchSkillTemplate,
      getSubagentSkillTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['grspec-explore', getExploreSkillTemplate],
      ['grspec-new-change', getNewChangeSkillTemplate],
      ['grspec-continue-change', getContinueChangeSkillTemplate],
      ['grspec-apply-change', getApplyChangeSkillTemplate],
      ['grspec-ff-change', getFfChangeSkillTemplate],
      ['grspec-sync-specs', getSyncSpecsSkillTemplate],
      ['grspec-archive-change', getArchiveChangeSkillTemplate],
      ['grspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['grspec-verify', getVerifySkillTemplate],
      ['grspec-validate', getValidateSkillTemplate],
      ['grspec-onboard', getOnboardSkillTemplate],
      ['grspec-propose', getGrsxProposeSkillTemplate],
      ['grspec-tdd', getTddSkillTemplate],
      ['grspec-debug', getDebugSkillTemplate],
      ['grspec-review', getReviewSkillTemplate],
      ['grspec-parallel', getParallelDispatchSkillTemplate],
      ['grspec-subagent', getSubagentSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  it('keeps required UI integration phrases in shared content templates', () => {
    // Skill↔command byte identity is enforced in workflow-templates-parity.test.ts.
    const uiWorkflowPhraseChecks: Array<{
      workflowName: string;
      contentTemplateName: string;
      phrases: string[];
    }> = [
      {
        workflowName: 'apply',
        contentTemplateName: 'apply-change',
        phrases: ['grspec ui review', 'effectiveUiActive', 'uiArtifactStatus'],
      },
      {
        workflowName: 'verify',
        contentTemplateName: 'verify',
        phrases: [
          'Verify UI Quality',
          'Foundation coherence',
          'uiArtifactStatus',
          'uiFoundationReady',
          'provisional: true',
          'grspec ui review',
          'grspec/ui/MASTER.md',
        ],
      },
      {
        workflowName: 'continue',
        contentTemplateName: 'continue-change',
        phrases: [
          'UI catch-up detection',
          'grspec ui detect',
          'Unblock ui artifact',
          'spec-driven schema v2',
          'grspec/ui/MASTER.md',
        ],
      },
      {
        workflowName: 'onboard',
        contentTemplateName: 'onboard',
        phrases: ['schemaVersion: 2', 'ui.md', 'grspec/ui/MASTER.md', '## UI'],
      },
      {
        workflowName: 'archive',
        contentTemplateName: 'archive-change',
        phrases: ['UI soft gate', 'effectiveUiActive'],
      },
      {
        workflowName: 'propose',
        contentTemplateName: 'propose',
        phrases: ['after artifact loop', 'UI detection result', 'ui.md', 'specs/'],
      },
      {
        workflowName: 'fast-forward',
        contentTemplateName: 'ff-change',
        phrases: ['after artifact loop', 'UI detection result', 'ui → plan'],
      },
    ];

    for (const check of uiWorkflowPhraseChecks) {
      const contentTemplate = loadWorkflowTemplate(check.contentTemplateName);
      for (const phrase of check.phrases) {
        expect(contentTemplate, `${check.workflowName} content missing "${phrase}"`).toContain(phrase);
      }
    }
  });
});
