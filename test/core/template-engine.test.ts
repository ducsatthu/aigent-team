import { describe, it, expect } from 'vitest';
import { assembleAgentMarkdown } from '../../src/core/template-engine.js';
import type { AgentDefinition } from '../../src/core/types.js';

const mockAgent: AgentDefinition = {
  id: 'fe',
  name: 'Frontend Agent',
  description: 'A frontend development agent',
  role: 'fe',
  systemPrompt: 'You are a senior frontend engineer.',
  techStack: {
    languages: ['TypeScript', 'CSS'],
    frameworks: ['React'],
    libraries: ['Tailwind'],
    buildTools: ['Vite'],
  },
  conventions: 'Use functional components with hooks',
  reviewChecklist: '- [ ] Check accessibility\n- [ ] Check performance',
  tools: { allowed: ['Read', 'Write'] },
  workflows: [
    {
      name: 'create-component',
      description: 'Create a new component',
      steps: ['Check patterns', 'Create file', 'Add tests'],
    },
  ],
  sharedKnowledge: ['Project uses monorepo with Turborepo'],
  globs: ['**/*.tsx'],
};

describe('assembleAgentMarkdown', () => {
  it('should include agent name as heading', () => {
    const result = assembleAgentMarkdown(mockAgent);
    expect(result).toContain('# Frontend Agent');
  });

  it('should include description', () => {
    const result = assembleAgentMarkdown(mockAgent);
    expect(result).toContain('A frontend development agent');
  });

  it('should include system prompt', () => {
    const result = assembleAgentMarkdown(mockAgent);
    expect(result).toContain('You are a senior frontend engineer.');
  });

  it('should include tech stack', () => {
    const result = assembleAgentMarkdown(mockAgent);
    expect(result).toContain('## Tech Stack');
    expect(result).toContain('TypeScript, CSS');
    expect(result).toContain('React');
    expect(result).toContain('Vite');
  });

  it('should include conventions', () => {
    const result = assembleAgentMarkdown(mockAgent);
    expect(result).toContain('## Coding Conventions');
    expect(result).toContain('Use functional components with hooks');
  });

  it('should include review checklist', () => {
    const result = assembleAgentMarkdown(mockAgent);
    expect(result).toContain('## Review Checklist');
    expect(result).toContain('Check accessibility');
  });

  it('should include workflows with numbered steps', () => {
    const result = assembleAgentMarkdown(mockAgent);
    expect(result).toContain('## Workflows');
    expect(result).toContain('### create-component');
    expect(result).toContain('1. Check patterns');
    expect(result).toContain('2. Create file');
    expect(result).toContain('3. Add tests');
  });

  it('should include shared knowledge', () => {
    const result = assembleAgentMarkdown(mockAgent);
    expect(result).toContain('## Project Knowledge');
    expect(result).toContain('Project uses monorepo with Turborepo');
  });

  it('should omit empty sections', () => {
    const minimal: AgentDefinition = {
      ...mockAgent,
      systemPrompt: '',
      conventions: '',
      reviewChecklist: '',
      workflows: [],
      sharedKnowledge: [],
    };
    const result = assembleAgentMarkdown(minimal);

    expect(result).not.toContain('## Coding Conventions');
    expect(result).not.toContain('## Review Checklist');
    expect(result).not.toContain('## Workflows');
    expect(result).not.toContain('## Project Knowledge');
  });
});
