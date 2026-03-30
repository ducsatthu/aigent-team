import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadPlugin } from '../../src/core/plugin-loader.js';
import type { PluginManifest } from '../../src/core/types.js';

const FIXTURE_DIR = resolve(__dirname, '../fixtures/test-plugin');

const testManifest: PluginManifest = {
  name: 'test-plugin',
  version: '0.1.0',
  generatedAt: '2026-03-30T00:00:00Z',
  generator: 'aigent-team',
  projectName: 'test-project',
  roles: ['fe'],
  platforms: ['claude-code'],
  agents: [
    {
      id: 'fe',
      name: 'Frontend Agent',
      description: 'Test FE agent',
      role: 'fe',
      tools: { allowed: ['Read', 'Write', 'Edit'] },
      globs: ['**/*.tsx'],
    },
  ],
  files: { agents: 1, skills: 1, references: 1 },
};

beforeAll(() => {
  // Create fixture directory structure
  mkdirSync(resolve(FIXTURE_DIR, 'agents'), { recursive: true });
  mkdirSync(resolve(FIXTURE_DIR, 'skills/fe'), { recursive: true });
  mkdirSync(resolve(FIXTURE_DIR, 'references/fe'), { recursive: true });
  mkdirSync(resolve(FIXTURE_DIR, 'shared'), { recursive: true });

  writeFileSync(resolve(FIXTURE_DIR, 'manifest.json'), JSON.stringify(testManifest, null, 2));
  writeFileSync(resolve(FIXTURE_DIR, 'agents/fe-agent.md'), '# Frontend Agent\n\nSkill index content here.');
  writeFileSync(resolve(FIXTURE_DIR, 'skills/fe/analyze-bundle.md'), '# Analyze Bundle\n\nStep 1...');
  writeFileSync(resolve(FIXTURE_DIR, 'references/fe/perf-guide.md'), '# Performance Guide\n\nContent...');
  writeFileSync(resolve(FIXTURE_DIR, 'shared/knowledge-1.md'), 'Shared conventions content');
});

afterAll(() => {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

describe('plugin-loader', () => {
  it('should load plugin manifest', () => {
    const { manifest } = loadPlugin(FIXTURE_DIR);
    expect(manifest.name).toBe('test-plugin');
    expect(manifest.version).toBe('0.1.0');
    expect(manifest.agents).toHaveLength(1);
  });

  it('should reconstruct agents from plugin files', () => {
    const { agents } = loadPlugin(FIXTURE_DIR);
    expect(agents).toHaveLength(1);

    const agent = agents[0];
    expect(agent.id).toBe('fe');
    expect(agent.name).toBe('Frontend Agent');
    expect(agent.role).toBe('fe');
    expect(agent.tools.allowed).toEqual(['Read', 'Write', 'Edit']);
    expect(agent.globs).toEqual(['**/*.tsx']);
  });

  it('should load skill content as skillContent', () => {
    const { agents } = loadPlugin(FIXTURE_DIR);
    expect(agents[0].skillContent).toContain('# Frontend Agent');
    expect(agents[0].skillContent).toContain('Skill index content here');
  });

  it('should load skill files', () => {
    const { agents } = loadPlugin(FIXTURE_DIR);
    expect(agents[0].skills).toHaveLength(1);
    expect(agents[0].skills[0].id).toBe('analyze-bundle');
    expect(agents[0].skills[0].content).toContain('# Analyze Bundle');
  });

  it('should load reference files', () => {
    const { agents } = loadPlugin(FIXTURE_DIR);
    expect(agents[0].references).toHaveLength(1);
    expect(agents[0].references[0].id).toBe('perf-guide');
    expect(agents[0].references[0].content).toContain('# Performance Guide');
  });

  it('should load shared knowledge', () => {
    const { agents } = loadPlugin(FIXTURE_DIR);
    expect(agents[0].sharedKnowledge).toHaveLength(1);
    expect(agents[0].sharedKnowledge[0]).toContain('Shared conventions');
  });

  it('should set rulesContent to empty (already included in skillContent)', () => {
    const { agents } = loadPlugin(FIXTURE_DIR);
    expect(agents[0].rulesContent).toBe('');
  });

  it('should throw if manifest is missing', () => {
    expect(() => loadPlugin('/nonexistent/path')).toThrow('Plugin manifest not found');
  });

  it('should throw if manifest has no agents metadata', () => {
    const badDir = resolve(FIXTURE_DIR, '../bad-plugin');
    mkdirSync(badDir, { recursive: true });
    writeFileSync(resolve(badDir, 'manifest.json'), JSON.stringify({
      ...testManifest,
      agents: [],
    }));

    try {
      expect(() => loadPlugin(badDir)).toThrow('no agents metadata');
    } finally {
      rmSync(badDir, { recursive: true, force: true });
    }
  });
});
