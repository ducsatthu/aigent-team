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
  references: [],
  rulesContent: '',
  skills: [],
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

  describe('compilePluginBundle', () => {
    const agentWithExtras: AgentDefinition = {
      ...mockAgent,
      references: [
        { id: 'api-patterns', title: 'API Patterns', description: '', whenToRead: '', content: '# API Patterns' },
      ],
      skills: [
        { id: 'db-migration', name: 'database migration', description: 'Run DB migration', trigger: '', content: '# DB Migration' },
      ],
    };

    it('should generate .cursor-plugin/plugin.json', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out/cursor-ide-plugin');
      const manifest = outputs.find((o) => o.filePath.endsWith('.cursor-plugin/plugin.json'));
      expect(manifest).toBeDefined();
      expect(JSON.parse(manifest!.content).name).toBe('test');
    });

    it('should generate agents as .mdc under agents/', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const agentFile = outputs.find((o) => o.filePath === 'out/agents/be-agent.mdc');
      expect(agentFile).toBeDefined();
      expect(agentFile!.content).toContain('---');
      expect(agentFile!.content).toContain('Backend Agent');
    });

    it('should generate skills as SKILL.md under skills/', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const skill = outputs.find((o) => o.filePath === 'out/skills/be-db-migration/SKILL.md');
      expect(skill).toBeDefined();
      expect(skill!.content).toContain('# DB Migration');
    });

    it('should generate references as .mdc under kb/', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const ref = outputs.find((o) => o.filePath === 'out/kb/be-refs/api-patterns.mdc');
      expect(ref).toBeDefined();
      expect(ref!.content).toContain('# API Patterns');
    });

    it('should generate shared conventions under rules/', () => {
      const outputs = compiler.compilePluginBundle([agentWithExtras], mockConfig, 'out');
      const rules = outputs.find((o) => o.filePath === 'out/rules/shared-conventions.mdc');
      expect(rules).toBeDefined();
      expect(rules!.content).toContain('Shared conventions');
    });
  });

  describe('compileWithScope', () => {
    const agentWithExtras: AgentDefinition = {
      ...mockAgent,
      references: [
        { id: 'api-patterns', title: 'API Patterns', description: '', whenToRead: '', content: '# API Patterns' },
      ],
      skills: [
        { id: 'db-migration', name: 'database migration', description: '', trigger: '', content: '# DB Migration' },
      ],
    };

    it('should produce identical output with scope all vs compile', () => {
      const fromCompile = compiler.compile([agentWithExtras], mockConfig);
      const fromScope = compiler.compileWithScope([agentWithExtras], mockConfig, ['all']);
      expect(fromScope).toEqual(fromCompile);
    });

    it('should produce only agent index + hub with scope agents', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['agents']);
      expect(outputs.some((o) => o.filePath === '.cursor/rules/shared-conventions.mdc')).toBe(true);
      expect(outputs.some((o) => o.filePath === '.cursor/rules/be-agent.mdc')).toBe(true);
      expect(outputs.some((o) => o.filePath.includes('-refs/'))).toBe(false);
      expect(outputs.some((o) => o.filePath.includes('-skills/'))).toBe(false);
    });

    it('should produce only skill files with scope skills', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['skills']);
      expect(outputs).toHaveLength(1);
      expect(outputs[0].filePath).toBe('.cursor/rules/be-skills/db-migration.mdc');
      expect(outputs[0].content).toContain('alwaysApply: false');
    });

    it('should produce only reference files with scope references', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['references']);
      expect(outputs).toHaveLength(1);
      expect(outputs[0].filePath).toBe('.cursor/rules/be-refs/api-patterns.mdc');
      expect(outputs[0].content).toContain('alwaysApply: false');
    });

    it('should combine skills + references scopes', () => {
      const outputs = compiler.compileWithScope([agentWithExtras], mockConfig, ['skills', 'references']);
      expect(outputs).toHaveLength(2);
      expect(outputs.some((o) => o.filePath.includes('-skills/'))).toBe(true);
      expect(outputs.some((o) => o.filePath.includes('-refs/'))).toBe(true);
    });
  });
});
