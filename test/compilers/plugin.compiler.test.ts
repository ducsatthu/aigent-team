import { describe, it, expect } from 'vitest';
import { PluginCompiler } from '../../src/compilers/plugin.compiler.js';
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
  workflows: [],
  sharedKnowledge: ['Shared conventions content'],
  references: [
    { id: 'perf-guide', title: 'Performance Guide', description: '', whenToRead: '', content: '# Perf Guide' },
  ],
  rulesContent: '',
  skills: [
    { id: 'analyze-bundle', name: 'analyze bundle', description: '', trigger: '', content: '# Analyze Bundle' },
  ],
  globs: ['**/*.tsx'],
};

const mockConfig: AigentTeamConfig = {
  projectName: 'my-app',
  platforms: ['claude-code', 'cursor'],
  teams: ['fe'],
};

describe('PluginCompiler', () => {
  const compiler = new PluginCompiler();

  it('should generate manifest.json with agent metadata', () => {
    const outputs = compiler.compilePlugin([mockAgent], mockConfig);
    const manifest = outputs.find((o) => o.filePath.endsWith('manifest.json'));

    expect(manifest).toBeDefined();
    const parsed = JSON.parse(manifest!.content);
    expect(parsed.name).toBe('my-app');
    expect(parsed.projectName).toBe('my-app');
    expect(parsed.roles).toEqual(['fe']);
    expect(parsed.platforms).toEqual(['claude-code', 'cursor']);
    expect(parsed.files.agents).toBe(1);
    expect(parsed.files.skills).toBe(1);
    expect(parsed.files.references).toBe(1);

    expect(parsed.agents).toHaveLength(1);
    expect(parsed.agents[0].id).toBe('fe');
    expect(parsed.agents[0].name).toBe('Frontend Agent');
    expect(parsed.agents[0].role).toBe('fe');
    expect(parsed.agents[0].tools.allowed).toEqual(['Read', 'Write', 'Edit']);
    expect(parsed.agents[0].globs).toEqual(['**/*.tsx']);
  });

  it('should generate agent index files', () => {
    const outputs = compiler.compilePlugin([mockAgent], mockConfig);
    const agentFile = outputs.find((o) => o.filePath.includes('/agents/fe-agent.md'));

    expect(agentFile).toBeDefined();
    expect(agentFile!.content).toContain('Frontend Agent');
  });

  it('should generate skill files organized by role', () => {
    const outputs = compiler.compilePlugin([mockAgent], mockConfig);
    const skillFile = outputs.find((o) => o.filePath.includes('/skills/fe/analyze-bundle.md'));

    expect(skillFile).toBeDefined();
    expect(skillFile!.content).toContain('# Analyze Bundle');
  });

  it('should generate reference files organized by role', () => {
    const outputs = compiler.compilePlugin([mockAgent], mockConfig);
    const refFile = outputs.find((o) => o.filePath.includes('/references/fe/perf-guide.md'));

    expect(refFile).toBeDefined();
    expect(refFile!.content).toContain('# Perf Guide');
  });

  it('should generate shared knowledge files', () => {
    const outputs = compiler.compilePlugin([mockAgent], mockConfig);
    const shared = outputs.find((o) => o.filePath.includes('/shared/knowledge-1.md'));

    expect(shared).toBeDefined();
    expect(shared!.content).toContain('Shared conventions content');
  });

  it('should respect custom pluginDir', () => {
    const outputs = compiler.compilePlugin([mockAgent], mockConfig, 'custom-plugin');
    expect(outputs.every((o) => o.filePath.startsWith('custom-plugin/'))).toBe(true);
  });

  it('should use default pluginDir when not specified', () => {
    const outputs = compiler.compilePlugin([mockAgent], mockConfig);
    expect(outputs.every((o) => o.filePath.startsWith('.aigent-team-plugin/'))).toBe(true);
  });

  it('should handle agents with no skills or references', () => {
    const bareAgent: AgentDefinition = {
      ...mockAgent,
      skills: [],
      references: [],
      sharedKnowledge: [],
    };
    const outputs = compiler.compilePlugin([bareAgent], mockConfig);

    expect(outputs.some((o) => o.filePath.includes('/agents/'))).toBe(true);
    expect(outputs.some((o) => o.filePath.endsWith('manifest.json'))).toBe(true);
  });

  it('should set all overwriteStrategy to replace', () => {
    const outputs = compiler.compilePlugin([mockAgent], mockConfig);
    expect(outputs.every((o) => o.overwriteStrategy === 'replace')).toBe(true);
  });

  describe('multi-platform bundles', () => {
    it('should generate a bundle for each configured platform', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);

      expect(outputs.some((o) => o.filePath.includes('cursor-ide-plugin/'))).toBe(true);
      expect(outputs.some((o) => o.filePath.includes('claude-code-plugin/'))).toBe(true);
    });

    it('should include bundles metadata in manifest', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      const manifest = outputs.find((o) => o.filePath.endsWith('manifest.json'));
      const parsed = JSON.parse(manifest!.content);

      expect(parsed.bundles).toBeDefined();
      expect(parsed.bundles).toHaveLength(2);

      const cursorBundle = parsed.bundles.find((b: { platform: string }) => b.platform === 'cursor');
      expect(cursorBundle).toBeDefined();
      expect(cursorBundle.directory).toBe('cursor-ide-plugin');

      const claudeBundle = parsed.bundles.find((b: { platform: string }) => b.platform === 'claude-code');
      expect(claudeBundle).toBeDefined();
      expect(claudeBundle.directory).toBe('claude-code-plugin');
    });

    it('should generate Cursor IDE plugin bundle with .cursor-plugin manifest', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      const cursorManifest = outputs.find((o) =>
        o.filePath.endsWith('cursor-ide-plugin/.cursor-plugin/plugin.json'),
      );
      expect(cursorManifest).toBeDefined();
      const parsed = JSON.parse(cursorManifest!.content);
      expect(parsed.name).toBeDefined();
    });

    it('should generate Cursor skills in plugin bundle', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      expect(outputs.some((o) =>
        o.filePath.includes('cursor-ide-plugin/skills/fe-analyze-bundle/SKILL.md'),
      )).toBe(true);
    });

    it('should generate Cursor agents as .mdc in plugin bundle', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      expect(outputs.some((o) =>
        o.filePath.includes('cursor-ide-plugin/agents/fe-agent.mdc'),
      )).toBe(true);
    });

    it('should generate Cursor KB as .mdc in plugin bundle', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      expect(outputs.some((o) =>
        o.filePath.includes('cursor-ide-plugin/kb/') && o.filePath.endsWith('.mdc'),
      )).toBe(true);
    });

    it('should generate Claude Code agents in plugin bundle', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      expect(outputs.some((o) =>
        o.filePath.includes('claude-code-plugin/agents/fe-agent.md'),
      )).toBe(true);
    });

    it('should generate Claude Code rules in plugin bundle', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      expect(outputs.some((o) =>
        o.filePath.includes('claude-code-plugin/rules/CLAUDE.md'),
      )).toBe(true);
    });

    it('should generate Claude Code skills in plugin bundle', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      expect(outputs.some((o) =>
        o.filePath.includes('claude-code-plugin/skills/fe/analyze-bundle.md'),
      )).toBe(true);
    });

    it('should generate Claude Code KB in plugin bundle', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      expect(outputs.some((o) =>
        o.filePath.includes('claude-code-plugin/kb/fe/perf-guide.md'),
      )).toBe(true);
    });

    it('should generate bundles for all four platforms when configured', () => {
      const fullConfig: AigentTeamConfig = {
        projectName: 'my-app',
        platforms: ['claude-code', 'cursor', 'codex', 'antigravity'],
        teams: ['fe'],
      };
      const outputs = compiler.compilePlugin([mockAgent], fullConfig);

      expect(outputs.some((o) => o.filePath.includes('claude-code-plugin/'))).toBe(true);
      expect(outputs.some((o) => o.filePath.includes('cursor-ide-plugin/'))).toBe(true);
      expect(outputs.some((o) => o.filePath.includes('codex-plugin/'))).toBe(true);
      expect(outputs.some((o) => o.filePath.includes('antigravity-plugin/'))).toBe(true);

      const manifest = outputs.find((o) => o.filePath.endsWith('manifest.json'));
      const parsed = JSON.parse(manifest!.content);
      expect(parsed.bundles).toHaveLength(4);
    });

    it('should track artifact counts per bundle', () => {
      const outputs = compiler.compilePlugin([mockAgent], mockConfig);
      const manifest = outputs.find((o) => o.filePath.endsWith('manifest.json'));
      const parsed = JSON.parse(manifest!.content);

      for (const bundle of parsed.bundles) {
        expect(bundle.artifacts).toBeDefined();
        expect(typeof bundle.artifacts).toBe('object');
      }
    });
  });
});
