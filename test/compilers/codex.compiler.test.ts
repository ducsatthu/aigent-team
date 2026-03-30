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
  references: [],
  rulesContent: '',
  skills: [],
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

  describe('compilePluginBundle', () => {
    const agentWithExtras: AgentDefinition = {
      ...mockAgent,
      references: [
        { id: 'test-strategy', title: 'Test Strategy', description: '', whenToRead: '', content: '# Test Strategy' },
      ],
      skills: [
        { id: 'generate-test-data', name: 'generate test data', description: '', trigger: '', content: '# Generate Test Data' },
      ],
    };

    it('should generate rules/AGENTS.md', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const rules = outputs.find((o) => o.filePath === 'out/rules/AGENTS.md');
      expect(rules).toBeDefined();
      expect(rules!.content).toContain('# Project Agents');
      expect(rules!.content).toContain('QA Agent');
    });

    it('should generate agents with frontmatter', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const agent = outputs.find((o) => o.filePath === 'out/agents/qa-agent.md');
      expect(agent).toBeDefined();
      expect(agent!.content).toContain('nickname_candidates:');
    });

    it('should generate skills organized by agent', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const skill = outputs.find((o) => o.filePath === 'out/skills/qa/generate-test-data.md');
      expect(skill).toBeDefined();
      expect(skill!.content).toContain('# Generate Test Data');
    });

    it('should generate KB organized by agent', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const kb = outputs.find((o) => o.filePath === 'out/kb/qa/test-strategy.md');
      expect(kb).toBeDefined();
      expect(kb!.content).toContain('# Test Strategy');
    });
  });

  describe('compileWithScope', () => {
    const agentWithExtras: AgentDefinition = {
      ...mockAgent,
      references: [
        { id: 'test-strategy', title: 'Test Strategy', description: '', whenToRead: '', content: '# Test Strategy' },
      ],
      skills: [
        { id: 'generate-test-data', name: 'generate test data', description: '', trigger: '', content: '# Generate Test Data' },
      ],
    };

    it('should produce identical output with scope all vs compile', () => {
      const fromCompile = compiler.compile([agentWithExtras], mockConfig);
      const fromScope = compiler.compileWithScope([agentWithExtras], mockConfig, ['all']);
      expect(fromScope).toEqual(fromCompile);
    });

    it('should produce only agent index + hub with scope agents', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['agents']);
      expect(outputs.some((o) => o.filePath === 'AGENTS.md')).toBe(true);
      expect(outputs.some((o) => o.filePath === '.codex/agents/qa-agent.md')).toBe(true);
      expect(outputs.some((o) => o.filePath.includes('/references/'))).toBe(false);
      expect(outputs.some((o) => o.filePath.includes('/skills/'))).toBe(false);
    });

    it('should produce only skill files with scope skills', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['skills']);
      expect(outputs).toHaveLength(1);
      expect(outputs[0].filePath).toBe('.codex/agents/qa-agent/skills/generate-test-data.md');
    });

    it('should produce only reference files with scope references', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['references']);
      expect(outputs).toHaveLength(1);
      expect(outputs[0].filePath).toBe('.codex/agents/qa-agent/references/test-strategy.md');
    });
  });
});
