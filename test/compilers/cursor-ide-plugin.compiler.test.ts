import { describe, it, expect } from 'vitest';
import { compileCursorIdePlugin, toKebabCursorPluginId } from '../../src/compilers/cursor-ide-plugin.compiler.js';
import type { AgentDefinition, AigentTeamConfig } from '../../src/core/types.js';

const mockAgent: AgentDefinition = {
  id: 'fe',
  name: 'Frontend Agent',
  description: 'Test FE agent',
  role: 'fe',
  systemPrompt: '',
  techStack: { languages: [], frameworks: [], libraries: [], buildTools: [] },
  conventions: '',
  reviewChecklist: '',
  tools: { allowed: ['Read'] },
  workflows: [],
  sharedKnowledge: [],
  references: [],
  rulesContent: '',
  skillContent: '# Index',
  skills: [
    { id: 'analyze-bundle', name: 'analyze bundle', description: 'Bundle analysis', trigger: '', content: '# Body' },
  ],
  globs: ['**/*.tsx'],
};

const mockConfig: AigentTeamConfig = {
  projectName: 'My App 2.0',
  platforms: ['cursor'],
  teams: ['fe'],
};

describe('toKebabCursorPluginId', () => {
  it('normalizes project names to kebab-case ids', () => {
    expect(toKebabCursorPluginId('My App')).toBe('my-app');
    expect(toKebabCursorPluginId('foo.bar')).toBe('foo.bar');
  });
});

describe('compileCursorIdePlugin', () => {
  it('emits .cursor-plugin/plugin.json and rules with frontmatter', () => {
    const outputs = compileCursorIdePlugin([mockAgent], mockConfig, 'out/cursor-ide-plugin');
    const manifest = outputs.find((o) => o.filePath.endsWith('.cursor-plugin/plugin.json'));
    const rule = outputs.find((o) => o.filePath.endsWith('rules/fe-agent.mdc'));

    expect(manifest).toBeDefined();
    expect(JSON.parse(manifest!.content).name).toBe('my-app-2.0');

    expect(rule).toBeDefined();
    expect(rule!.content.startsWith('---')).toBe(true);
    expect(rule!.content).toContain('**/*.tsx');
  });

  it('emits skills as skills/<id>/SKILL.md per Cursor plugin reference', () => {
    const outputs = compileCursorIdePlugin([mockAgent], mockConfig, 'p');
    const skill = outputs.find((o) => o.filePath === 'p/skills/fe-analyze-bundle/SKILL.md');
    expect(skill).toBeDefined();
    expect(skill!.content).toContain('name: "fe-analyze-bundle"');
    expect(skill!.content).toContain('# Body');
  });
});
