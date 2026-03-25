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
});
