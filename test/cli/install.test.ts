import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PluginCompiler } from '../../src/compilers/plugin.compiler.js';
import { loadPlugin } from '../../src/core/plugin-loader.js';
import { ClaudeCodeCompiler } from '../../src/compilers/claude-code.compiler.js';
import { CursorCompiler } from '../../src/compilers/cursor.compiler.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput } from '../../src/core/types.js';

const TEST_DIR = resolve(__dirname, '../fixtures/install-test');
const PLUGIN_DIR = resolve(TEST_DIR, 'plugin');
const PROJECT_DIR = resolve(TEST_DIR, 'project');

const mockAgent: AgentDefinition = {
  id: 'fe',
  name: 'Frontend Agent',
  description: 'Test FE agent',
  role: 'fe',
  systemPrompt: '',
  techStack: { languages: ['TypeScript'], frameworks: ['React'], libraries: [], buildTools: [] },
  conventions: '',
  reviewChecklist: '',
  tools: { allowed: ['Read', 'Write', 'Edit'] },
  workflows: [],
  sharedKnowledge: [],
  references: [
    { id: 'perf-guide', title: 'Performance Guide', description: '', whenToRead: '', content: '# Perf Guide' },
  ],
  rulesContent: '# Rules\n\nDo not modify backend.',
  skills: [
    { id: 'analyze-bundle', name: 'analyze bundle', description: '', trigger: '', content: '# Analyze Bundle\n\nSteps.' },
  ],
  globs: ['**/*.tsx'],
};

const mockConfig: AigentTeamConfig = {
  projectName: 'test-project',
  platforms: ['claude-code', 'cursor'],
  teams: ['fe'],
};

beforeAll(() => {
  // Generate a real plugin bundle
  mkdirSync(PLUGIN_DIR, { recursive: true });
  const compiler = new PluginCompiler();
  const outputs = compiler.compilePlugin([mockAgent], mockConfig, PLUGIN_DIR);

  for (const output of outputs) {
    const dir = resolve(output.filePath, '..');
    mkdirSync(dir, { recursive: true });
    writeFileSync(output.filePath, output.content);
  }
});

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

beforeEach(() => {
  // Clean project dir between tests
  if (existsSync(PROJECT_DIR)) {
    rmSync(PROJECT_DIR, { recursive: true, force: true });
  }
  mkdirSync(PROJECT_DIR, { recursive: true });
});

describe('Plugin install flow (end-to-end)', () => {
  it('should load plugin and reconstruct agents', () => {
    const { manifest, agents } = loadPlugin(PLUGIN_DIR);

    expect(manifest.name).toBe('test-project');
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe('fe');
    expect(agents[0].name).toBe('Frontend Agent');
    expect(agents[0].tools.allowed).toEqual(['Read', 'Write', 'Edit']);
  });

  it('should compile plugin agents for Claude Code', () => {
    const { agents } = loadPlugin(PLUGIN_DIR);
    const compiler = new ClaudeCodeCompiler();
    const outputs = compiler.compileWithScope(agents, mockConfig, ['all']);

    // Should have: CLAUDE.md + agent index + 1 skill + 1 reference
    expect(outputs.some((o) => o.filePath === 'CLAUDE.md')).toBe(true);
    expect(outputs.some((o) => o.filePath === '.claude/agents/fe-agent.md')).toBe(true);
    expect(outputs.some((o) => o.filePath.includes('/skills/analyze-bundle.md'))).toBe(true);
    expect(outputs.some((o) => o.filePath.includes('/references/perf-guide.md'))).toBe(true);
  });

  it('should compile plugin agents for Cursor with .mdc format', () => {
    const { agents } = loadPlugin(PLUGIN_DIR);
    const compiler = new CursorCompiler();
    const outputs = compiler.compileWithScope(agents, mockConfig, ['all']);

    // Agent index as .mdc
    const agentFile = outputs.find((o) => o.filePath === '.cursor/rules/fe-agent.mdc');
    expect(agentFile).toBeDefined();
    expect(agentFile!.content).toContain('---');
    expect(agentFile!.content).toContain('alwaysApply:');

    // Skill as .mdc with frontmatter
    const skillFile = outputs.find((o) => o.filePath.includes('fe-skills/analyze-bundle.mdc'));
    expect(skillFile).toBeDefined();
    expect(skillFile!.content).toContain('alwaysApply: false');

    // Reference as .mdc with frontmatter
    const refFile = outputs.find((o) => o.filePath.includes('fe-refs/perf-guide.mdc'));
    expect(refFile).toBeDefined();
    expect(refFile!.content).toContain('alwaysApply: false');
  });

  it('should include agent content from plugin in compiled output', () => {
    const { agents } = loadPlugin(PLUGIN_DIR);
    const compiler = new ClaudeCodeCompiler();
    const outputs = compiler.compileWithScope(agents, mockConfig, ['all']);

    const agentFile = outputs.find((o) => o.filePath === '.claude/agents/fe-agent.md')!;
    // The plugin's agent file content should be passed through
    expect(agentFile.content).toContain('Frontend Agent');
  });

  it('should preserve skill file content through install', () => {
    const { agents } = loadPlugin(PLUGIN_DIR);
    const compiler = new ClaudeCodeCompiler();
    const outputs = compiler.compileWithScope(agents, mockConfig, ['all']);

    const skillFile = outputs.find((o) => o.filePath.includes('analyze-bundle.md'))!;
    expect(skillFile.content).toContain('# Analyze Bundle');
  });
});
