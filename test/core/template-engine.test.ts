import { describe, it, expect } from 'vitest';
import { assembleAgentMarkdown, assembleSkillIndex, assembleSkill } from '../../src/core/template-engine.js';
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
  references: [],
  rulesContent: '',
  skills: [],
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

describe('assembleSkillIndex', () => {
  it('should include rules before skill content', () => {
    const agent: AgentDefinition = {
      ...mockAgent,
      skillContent: '# Frontend Agent\n\nCore principles here.',
      rulesContent: '# Rules (Hard Constraints)\n\nDO NOT modify backend files.',
    };
    const result = assembleSkillIndex(agent);

    expect(result).toContain('# Rules (Hard Constraints)');
    expect(result).toContain('# Frontend Agent');
    // Rules should appear before skill content
    const rulesPos = result.indexOf('Rules (Hard Constraints)');
    const skillPos = result.indexOf('Frontend Agent');
    expect(rulesPos).toBeLessThan(skillPos);
  });

  it('should include skills catalog table when skills exist', () => {
    const agent: AgentDefinition = {
      ...mockAgent,
      skillContent: '# Frontend Agent',
      skills: [
        { id: 'analyze-bundle', name: 'analyze bundle', description: '', trigger: '', content: 'Steps here' },
        { id: 'component-audit', name: 'component audit', description: '', trigger: '', content: 'Steps here' },
      ],
    };
    const result = assembleSkillIndex(agent);

    expect(result).toContain('## Executable Skills');
    expect(result).toContain('`analyze-bundle`');
    expect(result).toContain('`component-audit`');
  });

  it('should omit rules section when rulesContent is empty', () => {
    const agent: AgentDefinition = {
      ...mockAgent,
      skillContent: '# Frontend Agent',
      rulesContent: '',
    };
    const result = assembleSkillIndex(agent);

    expect(result).not.toContain('Rules');
    expect(result).toContain('# Frontend Agent');
  });

  it('should omit skills table when no skills exist', () => {
    const agent: AgentDefinition = {
      ...mockAgent,
      skillContent: '# Frontend Agent',
      skills: [],
    };
    const result = assembleSkillIndex(agent);

    expect(result).not.toContain('## Executable Skills');
  });

  it('should fall back to assembleAgentMarkdown when no skillContent', () => {
    const agent: AgentDefinition = {
      ...mockAgent,
      skillContent: '',
    };
    const result = assembleSkillIndex(agent);

    expect(result).toContain('# Frontend Agent');
    expect(result).toContain('## Tech Stack');
  });
});

describe('assembleSkill', () => {
  it('should return skill content as-is', () => {
    const skill = { id: 'test', name: 'test', description: '', trigger: '', content: '# Skill Content' };
    const result = assembleSkill(skill);
    expect(result).toBe('# Skill Content');
  });
});
