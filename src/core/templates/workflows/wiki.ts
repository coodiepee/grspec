import type { SkillTemplate, CommandTemplate } from '../types.js';
import { loadWorkflowTemplate } from '../loader.js';

export function getWikiSkillTemplate(): SkillTemplate {
  return {
    name: 'grspec-wiki',
    description: "LLM Wiki management - init, ingest, lint, query, sync, status. Use when the user wants to build, navigate, or maintain the project's wiki knowledge base.",
    instructions: loadWorkflowTemplate('wiki'),
  };
}


export function getGrsxWikiCommandTemplate(): CommandTemplate {
  return {
    name: '/grsx-wiki',
    description: 'LLM Wiki management — init, ingest, lint, query, sync, status',
    category: 'Workflow',
    tags: ['wiki', 'knowledge'],
    content: loadWorkflowTemplate('wiki'),
  };
}

export function getGrsxWikiInitCommandTemplate(): CommandTemplate {
  return {
    name: '/grsx-wiki-init',
    description: 'Build the LLM Wiki from scratch (full build)',
    category: 'Workflow',
    tags: ['wiki', 'knowledge'],
    content: loadWorkflowTemplate('wiki-init'),
  };
}

export function getGrsxWikiIngestCommandTemplate(): CommandTemplate {
  return {
    name: '/grsx-wiki-ingest',
    description: 'Generate wiki deltas for the current change',
    category: 'Workflow',
    tags: ['wiki', 'knowledge'],
    content: loadWorkflowTemplate('wiki-ingest'),
  };
}

export function getGrsxWikiLintCommandTemplate(): CommandTemplate {
  return {
    name: '/grsx-wiki-lint',
    description: 'Run wiki structural and semantic health checks',
    category: 'Workflow',
    tags: ['wiki', 'knowledge'],
    content: loadWorkflowTemplate('wiki-lint'),
  };
}

export function getGrsxWikiQueryCommandTemplate(): CommandTemplate {
  return {
    name: '/grsx-wiki-query',
    description: 'Navigate the wiki to answer a question',
    category: 'Workflow',
    tags: ['wiki', 'knowledge'],
    content: loadWorkflowTemplate('wiki-query'),
  };
}

export function getGrsxWikiSyncCommandTemplate(): CommandTemplate {
  return {
    name: '/grsx-wiki-sync',
    description: 'Merge wiki deltas from a change to main wiki',
    category: 'Workflow',
    tags: ['wiki', 'knowledge'],
    content: loadWorkflowTemplate('wiki-sync'),
  };
}

export function getGrsxWikiStatusCommandTemplate(): CommandTemplate {
  return {
    name: '/grsx-wiki-status',
    description: 'Show wiki overview and health status',
    category: 'Workflow',
    tags: ['wiki', 'knowledge'],
    content: loadWorkflowTemplate('wiki-status'),
  };
}
