import { describe, it, expect } from 'vitest';
import { ClaudeCodeCompiler } from '../../src/compilers/claude-code.compiler.js';
import type { AgentDefinition, AigentTeamConfig } from '../../src/core/types.js';

const mockAgent: AgentDefinition = {
  id: 'fe',
  name: 'Frontend Agent',
  description: 'Test FE agent',
  role: 'fe',
  systemPrompt: 'You are a frontend engineer.',
  techStack: {
    languages: ['TypeScript'],
    frameworks: ['React'],
    libraries: ['Tailwind'],
    buildTools: ['Vite'],
  },
  conventions: 'Use functional components',
  reviewChecklist: '- [ ] Check accessibility',
  tools: { allowed: ['Read', 'Write', 'Edit'] },
  workflows: [
    {
      name: 'component-creation',
      description: 'Create a component',
      steps: ['Check patterns', 'Create file'],
    },
  ],
  sharedKnowledge: ['Shared knowledge content'],
  globs: ['**/*.tsx'],
};

const mockConfig: AigentTeamConfig = {
  projectName: 'test',
  platforms: ['claude-code'],
  teams: ['fe'],
};

describe('ClaudeCodeCompiler', () => {
  const compiler = new ClaudeCodeCompiler();

  it('should have correct platform', () => {
    expect(compiler.platform).toBe('claude-code');
  });

  it('should generate agent file with YAML frontmatter', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const agentFile = outputs.find((o) => o.filePath.includes('.claude/agents/'));

    expect(agentFile).toBeDefined();
    expect(agentFile!.filePath).toBe('.claude/agents/fe-agent.md');
    expect(agentFile!.content).toContain('---');
    expect(agentFile!.content).toContain('name: "Frontend Agent"');
    expect(agentFile!.content).toContain('# Frontend Agent');
    expect(agentFile!.content).toContain('You are a frontend engineer.');
  });

  it('should generate CLAUDE.md', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const claudeMd = outputs.find((o) => o.filePath === 'CLAUDE.md');

    expect(claudeMd).toBeDefined();
    expect(claudeMd!.content).toContain('## Agent Team');
    expect(claudeMd!.content).toContain('Frontend Agent');
    expect(claudeMd!.overwriteStrategy).toBe('skip-if-exists');
  });

  it('should include tools in frontmatter', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const agentFile = outputs.find((o) => o.filePath.includes('.claude/agents/'))!;

    expect(agentFile.content).toContain('tools:');
    expect(agentFile.content).toContain('- Read');
    expect(agentFile.content).toContain('- Write');
    expect(agentFile.content).toContain('- Edit');
  });

  it('should include tech stack section', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const agentFile = outputs.find((o) => o.filePath.includes('.claude/agents/'))!;

    expect(agentFile.content).toContain('## Tech Stack');
    expect(agentFile.content).toContain('TypeScript');
    expect(agentFile.content).toContain('React');
  });

  it('should include workflows', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const agentFile = outputs.find((o) => o.filePath.includes('.claude/agents/'))!;

    expect(agentFile.content).toContain('## Workflows');
    expect(agentFile.content).toContain('component-creation');
  });

  it('should validate line count', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const result = compiler.validate(outputs);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should warn on files exceeding 300 lines', () => {
    const longAgent = {
      ...mockAgent,
      conventions: Array(200).fill('- Convention line').join('\n'),
      reviewChecklist: Array(200).fill('- Checklist item').join('\n'),
    };
    const outputs = compiler.compile([longAgent], mockConfig);
    const result = compiler.validate(outputs);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('recommended max 300');
  });
});
