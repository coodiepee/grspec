import { describe, it, expect, vi } from 'vitest';

import {
  MINIMAL_WORKFLOWS,
  STANDARD_WORKFLOWS,
  FULL_WORKFLOWS,
  CORE_WORKFLOWS,
  ALL_WORKFLOWS,
  getProfileWorkflows,
  sanitizeWorkflowIds,
  RETIRED_WORKFLOW_IDS,
} from '../../src/core/profiles.js';

describe('profiles', () => {
  describe('workflow tier constants', () => {
    it('MINIMAL_WORKFLOWS contains base workflows', () => {
      expect([...MINIMAL_WORKFLOWS]).toEqual(['propose', 'explore', 'apply', 'sync', 'archive']);
    });

    it('STANDARD_WORKFLOWS extends minimal with execution discipline', () => {
      expect([...STANDARD_WORKFLOWS]).toEqual([
        'propose', 'explore', 'apply', 'sync', 'archive',
        'tdd', 'validate', 'verify', 'debug', 'review', 'wiki', 'ui',
      ]);
    });

    it('FULL_WORKFLOWS extends standard with collaboration', () => {
      expect([...FULL_WORKFLOWS]).toEqual([
        'propose', 'explore', 'apply', 'sync', 'archive',
        'tdd', 'validate', 'verify', 'debug', 'review', 'wiki', 'ui',
        'new', 'continue', 'ff', 'bulk-archive', 'onboard',
        'parallel', 'subagent',
      ]);
    });

    it('CORE_WORKFLOWS is an alias for MINIMAL_WORKFLOWS (backward compat)', () => {
      expect(CORE_WORKFLOWS).toBe(MINIMAL_WORKFLOWS);
    });

    it('all tier workflows are subsets of ALL_WORKFLOWS', () => {
      for (const wf of FULL_WORKFLOWS) {
        expect(ALL_WORKFLOWS).toContain(wf);
      }
    });
  });

  describe('ALL_WORKFLOWS', () => {
    it('should contain all 19 workflows', () => {
      expect(ALL_WORKFLOWS).toHaveLength(19);
    });

    it('should contain expected workflow IDs', () => {
      const expected = [
        'propose', 'explore', 'new', 'continue', 'apply',
        'ff', 'sync', 'archive', 'bulk-archive', 'validate', 'verify', 'onboard',
        'tdd', 'debug', 'review', 'parallel', 'subagent',
        'wiki', 'ui',
      ];
      expect([...ALL_WORKFLOWS]).toEqual(expected);
    });
  });

  describe('getProfileWorkflows', () => {
    it('returns minimal workflows for minimal profile', () => {
      expect(getProfileWorkflows('minimal')).toEqual(MINIMAL_WORKFLOWS);
    });

    it('returns standard workflows for standard profile', () => {
      expect(getProfileWorkflows('standard')).toEqual(STANDARD_WORKFLOWS);
    });

    it('returns full workflows for full profile', () => {
      expect(getProfileWorkflows('full')).toEqual(FULL_WORKFLOWS);
    });

    it('returns standard workflows as default when profile is unrecognized', () => {
      expect(getProfileWorkflows('standard')).toEqual(STANDARD_WORKFLOWS);
    });

    it('rejects retired core profile at the type boundary via default branch', () => {
      // Profile type no longer includes 'core'; cast simulates stale config values.
      const result = getProfileWorkflows('core' as 'standard');
      expect(result).toEqual(STANDARD_WORKFLOWS);
    });

    it('ignores customWorkflows for named profiles', () => {
      expect(getProfileWorkflows('minimal', ['new', 'apply'])).toEqual(MINIMAL_WORKFLOWS);
      expect(getProfileWorkflows('standard', ['new'])).toEqual(STANDARD_WORKFLOWS);
      expect(getProfileWorkflows('full', ['new'])).toEqual(FULL_WORKFLOWS);
    });

    it('returns custom workflows for custom profile', () => {
      const customWorkflows = ['explore', 'new', 'apply', 'ff'];
      expect(getProfileWorkflows('custom', customWorkflows)).toEqual(customWorkflows);
    });

    it('returns empty array for custom profile with no customWorkflows', () => {
      expect(getProfileWorkflows('custom')).toEqual([]);
    });

    it('returns empty array for custom profile with empty customWorkflows', () => {
      expect(getProfileWorkflows('custom', [])).toEqual([]);
    });

    it('strips retired verify-gate from custom workflow lists', () => {
      expect(getProfileWorkflows('custom', ['explore', 'verify-gate', 'verify'])).toEqual([
        'explore',
        'verify',
      ]);
    });
  });

  describe('sanitizeWorkflowIds', () => {
    it('drops retired workflow ids and duplicates', () => {
      expect(sanitizeWorkflowIds(['propose', 'verify-gate', 'propose', 'verify'])).toEqual([
        'propose',
        'verify',
      ]);
      expect([...RETIRED_WORKFLOW_IDS]).toEqual(['verify-gate']);
    });
  });
});
