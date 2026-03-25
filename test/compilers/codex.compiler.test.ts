import { describe, it, expect } from 'vitest';
import { CodexCompiler } from '../../src/compilers/codex.compiler.js';
import type { AgentDefinition, AigentTeamConfig } from '../../src/core/types.js';

const mockAgent: AgentDefinition = {
  id: 'qa',
  name: 'QA Agent',
  description: 'Test QA agent',
  role: 'qa',
  systemPrompt: 'You are a QA engineer.',
  techStack: {
    languages: ['TypeScript'],
    frameworks: ['Playwright'],
    libraries: ['MSW'],
    buildTools: [],
  },
  conventions: 'Test behavior not implementation',
  reviewChecklist: '- [ ] Cover edge cases',
  tools: { allowed: ['Read', 'Write', 'Bash'] },
  workflows: [],
  sharedKnowledge: [],
  globs: ['**/*.test.*'],
};

const mockConfig: AigentTeamConfig = {
  projectName: 'test',
  platforms: ['codex'],
  teams: ['qa'],
};

describe('CodexCompiler', () => {
  const compiler = new CodexCompiler();

  it('should generate AGENTS.md', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const agentsMd = outputs.find((o) => o.filePath === 'AGENTS.md');

    expect(agentsMd).toBeDefined();
    expect(agentsMd!.content).toContain('# Project Agents');
    expect(agentsMd!.content).toContain('## QA Agent (qa)');
  });

  it('should generate subagent files', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const subagent = outputs.find((o) => o.filePath === '.codex/agents/qa-agent.md');

    expect(subagent).toBeDefined();
    expect(subagent!.content).toContain('nickname_candidates:');
    expect(subagent!.content).toContain('# QA Agent');
  });

  it('should validate AGENTS.md presence', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const result = compiler.validate(outputs);

    expect(result.valid).toBe(true);
  });

  it('should fail validation without AGENTS.md', () => {
    const result = compiler.validate([]);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('AGENTS.md is missing');
  });
});
