import { describe, it, expect } from 'vitest';
import { CursorCompiler } from '../../src/compilers/cursor.compiler.js';
import type { AgentDefinition, AigentTeamConfig } from '../../src/core/types.js';

const mockAgent: AgentDefinition = {
  id: 'be',
  name: 'Backend Agent',
  description: 'Test BE agent',
  role: 'be',
  systemPrompt: 'You are a backend engineer.',
  techStack: {
    languages: ['TypeScript'],
    frameworks: ['NestJS'],
    libraries: ['Prisma'],
    buildTools: ['esbuild'],
  },
  conventions: 'Use service layer pattern',
  reviewChecklist: '- [ ] Check SQL injection',
  tools: { allowed: ['Read', 'Write', 'Bash'] },
  workflows: [],
  sharedKnowledge: ['Shared conventions'],
  globs: ['**/*.ts', 'src/api/**/*'],
};

const mockConfig: AigentTeamConfig = {
  projectName: 'test',
  platforms: ['cursor'],
  teams: ['be'],
};

describe('CursorCompiler', () => {
  const compiler = new CursorCompiler();

  it('should have correct platform', () => {
    expect(compiler.platform).toBe('cursor');
  });

  it('should generate .mdc files', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const agentFile = outputs.find((o) => o.filePath.includes('.cursor/rules/be-agent.mdc'));

    expect(agentFile).toBeDefined();
    expect(agentFile!.content).toContain('---');
    expect(agentFile!.content).toContain('# Backend Agent');
  });

  it('should set globs in frontmatter when agent has globs', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const agentFile = outputs.find((o) => o.filePath.includes('be-agent.mdc'))!;

    expect(agentFile.content).toContain('globs:');
    expect(agentFile.content).toContain('alwaysApply: false');
  });

  it('should set alwaysApply when no globs', () => {
    const noGlobAgent = { ...mockAgent, globs: [] };
    const outputs = compiler.compile([noGlobAgent], mockConfig);
    const agentFile = outputs.find((o) => o.filePath.includes('be-agent.mdc'))!;

    expect(agentFile.content).toContain('alwaysApply: true');
  });

  it('should generate shared conventions file', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const shared = outputs.find((o) => o.filePath.includes('shared-conventions.mdc'));

    expect(shared).toBeDefined();
    expect(shared!.content).toContain('alwaysApply: true');
  });

  it('should validate .mdc extension', () => {
    const outputs = compiler.compile([mockAgent], mockConfig);
    const result = compiler.validate(outputs);

    expect(result.valid).toBe(true);
  });
});
