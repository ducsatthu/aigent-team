import { describe, it, expect } from 'vitest';
import { AntigravityCompiler } from '../../src/compilers/antigravity.compiler.js';
import type { AgentDefinition, AigentTeamConfig } from '../../src/core/types.js';

const mockAgent: AgentDefinition = {
  id: 'devops',
  name: 'DevOps Agent',
  description: 'Test DevOps agent',
  role: 'devops',
  systemPrompt: 'You are a DevOps engineer.',
  techStack: {
    languages: ['YAML', 'Bash'],
    frameworks: ['Terraform'],
    libraries: ['Helm'],
    buildTools: ['Docker', 'Kubernetes'],
  },
  conventions: 'Infrastructure as code',
  reviewChecklist: '- [ ] No hardcoded secrets',
  tools: { allowed: ['Read', 'Write', 'Bash', 'Grep'] },
  workflows: [],
  sharedKnowledge: [],
  references: [],
  rulesContent: '',
  skills: [],
  globs: ['Dockerfile*', '*.tf'],
};

const mockConfig: AigentTeamConfig = {
  projectName: 'test',
  platforms: ['antigravity'],
  teams: ['devops'],
};

describe('AntigravityCompiler', () => {
  const compiler = new AntigravityCompiler();

  it('should generate GEMINI.md', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const gemini = outputs.find((o) => o.filePath === 'GEMINI.md');

    expect(gemini).toBeDefined();
    expect(gemini!.content).toContain('# Antigravity Configuration');
    expect(gemini!.content).toContain('DevOps Agent');
  });

  it('should generate SKILL.md in correct directory', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const skill = outputs.find((o) => o.filePath.includes('SKILL.md'));

    expect(skill).toBeDefined();
    expect(skill!.filePath).toBe('.agents/skills/devops-agent/SKILL.md');
  });

  it('should map tool names to Antigravity format', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const skill = outputs.find((o) => o.filePath.includes('SKILL.md'))!;

    expect(skill.content).toContain('allowed-tools:');
    expect(skill.content).toContain('read_file');
    expect(skill.content).toContain('bash');
    expect(skill.content).toContain('search');
  });

  it('should include agent content in SKILL.md', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const skill = outputs.find((o) => o.filePath.includes('SKILL.md'))!;

    expect(skill.content).toContain('# DevOps Agent');
    expect(skill.content).toContain('Infrastructure as code');
  });

  it('should validate skill name matches directory', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const result = compiler.validate(outputs);

    expect(result.valid).toBe(true);
  });

  describe('compilePluginBundle', () => {
    const agentWithExtras: AgentDefinition = {
      ...mockAgent,
      references: [
        { id: 'k8s-patterns', title: 'K8s Patterns', description: '', whenToRead: '', content: '# K8s Patterns' },
      ],
      skills: [
        { id: 'health-check', name: 'health check', description: '', trigger: '', content: '# Health Check' },
      ],
    };

    it('should generate rules/GEMINI.md', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const rules = outputs.find((o) => o.filePath === 'out/rules/GEMINI.md');
      expect(rules).toBeDefined();
      expect(rules!.content).toContain('# Antigravity Configuration');
      expect(rules!.content).toContain('DevOps Agent');
    });

    it('should generate agents as SKILL.md with tool mapping', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const agent = outputs.find((o) => o.filePath === 'out/agents/devops-agent/SKILL.md');
      expect(agent).toBeDefined();
      expect(agent!.content).toContain('allowed-tools:');
      expect(agent!.content).toContain('read_file');
    });

    it('should generate skills organized by agent', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const skill = outputs.find((o) => o.filePath === 'out/skills/devops/health-check.md');
      expect(skill).toBeDefined();
      expect(skill!.content).toContain('# Health Check');
    });

    it('should generate KB organized by agent', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const kb = outputs.find((o) => o.filePath === 'out/kb/devops/k8s-patterns.md');
      expect(kb).toBeDefined();
      expect(kb!.content).toContain('# K8s Patterns');
    });
  });

  describe('compileWithScope', () => {
    const agentWithExtras: AgentDefinition = {
      ...mockAgent,
      references: [
        { id: 'k8s-patterns', title: 'K8s Patterns', description: '', whenToRead: '', content: '# K8s Patterns' },
      ],
      skills: [
        { id: 'health-check', name: 'health check', description: '', trigger: '', content: '# Health Check' },
      ],
    };

    it('should produce identical output with scope all vs compile', () => {
      const fromCompile = compiler.compile([agentWithExtras], mockConfig);
      const fromScope = compiler.compileWithScope([agentWithExtras], mockConfig, ['all']);
      expect(fromScope).toEqual(fromCompile);
    });

    it('should produce only agent index + hub with scope agents', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['agents']);
      expect(outputs.some((o) => o.filePath === 'GEMINI.md')).toBe(true);
      expect(outputs.some((o) => o.filePath.endsWith('SKILL.md'))).toBe(true);
      expect(outputs.some((o) => o.filePath.includes('/references/'))).toBe(false);
      // Check no skill sub-files (health-check.md), but SKILL.md path itself contains /skills/
      expect(outputs.some((o) => o.filePath.includes('health-check'))).toBe(false);
    });

    it('should produce only skill files with scope skills', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['skills']);
      expect(outputs).toHaveLength(1);
      expect(outputs[0].filePath).toBe('.agents/skills/devops-agent/skills/health-check.md');
    });

    it('should produce only reference files with scope references', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['references']);
      expect(outputs).toHaveLength(1);
      expect(outputs[0].filePath).toBe('.agents/skills/devops-agent/references/k8s-patterns.md');
    });
  });
});
