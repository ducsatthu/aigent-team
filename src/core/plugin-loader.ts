import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import type { AgentDefinition, AssetFile, ExampleFile, OutputContract, PluginManifest, ReferenceFile, ScriptFile, SkillFile } from './types.js';
import { parseFrontmatter } from './agent-loader.js';

export interface LoadedPlugin {
  manifest: PluginManifest;
  agents: AgentDefinition[];
}

export function loadPlugin(pluginPath: string): LoadedPlugin {
  const absPath = resolve(pluginPath);

  // Validate manifest
  const manifestPath = resolve(absPath, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Plugin manifest not found: ${manifestPath}`);
  }

  const manifest: PluginManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  if (!manifest.agents?.length) {
    throw new Error('Plugin manifest has no agents metadata. Was it generated with aigent-team >= 0.3.0?');
  }

  // Find the first available platform bundle to read from
  const bundleDir = findBundleDir(absPath, manifest);

  // Reconstruct AgentDefinition[] from platform bundle files + manifest metadata
  const agents: AgentDefinition[] = [];

  for (const meta of manifest.agents) {
    // Read agent index (already-assembled skill content)
    const agentFilePath = resolve(bundleDir, 'agents', `${meta.id}-agent.md`);
    if (!existsSync(agentFilePath)) {
      throw new Error(`Agent file not found: ${agentFilePath}`);
    }
    const skillContent = readFileSync(agentFilePath, 'utf-8').trim();

    // Read skill files for this agent
    const skills = loadSkillFiles(resolve(bundleDir, 'skills', meta.id));

    // Read reference files for this agent
    const references = loadReferenceFiles(resolve(bundleDir, 'kb', meta.id));

    // Read example files for this agent
    const examples = loadExampleFiles(resolve(bundleDir, 'examples', meta.id));

    // Read output contract files for this agent
    const outputContracts = loadOutputContractFiles(resolve(bundleDir, 'contracts', meta.id));

    // Read script files for this agent
    const scripts = loadScriptFilesFromPlugin(resolve(bundleDir, 'scripts', meta.id));

    // Read asset files for this agent
    const assets = loadAssetFilesFromPlugin(resolve(bundleDir, 'assets', meta.id));

    // Read shared knowledge
    const sharedKnowledge = loadSharedKnowledge(resolve(bundleDir, 'kb', 'shared'));

    agents.push({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      role: meta.role,
      tools: meta.tools,
      globs: meta.globs,
      // The skillContent already contains the assembled index (rules + skill content + catalog).
      // Set it as skillContent and leave rulesContent/skills empty so assembleSkillIndex()
      // returns it as-is without double-including rules or catalog.
      skillContent,
      rulesContent: '',
      skills,
      references,
      examples,
      outputContracts,
      scripts,
      assets,
      sharedKnowledge,
      // Unused during install — compilers only need the fields above
      systemPrompt: '',
      techStack: { languages: [], frameworks: [], libraries: [], buildTools: [] },
      conventions: '',
      reviewChecklist: '',
      workflows: [],
    });
  }

  return { manifest, agents };
}

function findBundleDir(absPath: string, manifest: PluginManifest): string {
  // Prefer claude-code bundle, then fall back to first available
  const preferred = ['claude-code-plugin', 'cursor-ide-plugin', 'codex-plugin', 'antigravity-plugin'];

  for (const dir of preferred) {
    const candidate = resolve(absPath, dir);
    if (existsSync(candidate)) return candidate;
  }

  // Try from manifest bundles
  for (const bundle of manifest.bundles ?? []) {
    const candidate = resolve(absPath, bundle.directory);
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(`No platform bundle found in plugin: ${absPath}`);
}

function loadSkillFiles(dir: string): SkillFile[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const id = basename(f, '.md');
      const raw = readFileSync(resolve(dir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      return {
        id,
        name: (data.name as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        trigger: (data.trigger as string) || '',
        content,
        useCases: (data.useCases as string[]) || undefined,
        tags: (data.tags as string[]) || undefined,
      };
    });
}

function loadReferenceFiles(dir: string): ReferenceFile[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const id = basename(f, '.md');
      const raw = readFileSync(resolve(dir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      return {
        id,
        title: (data.title as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        whenToRead: (data.whenToRead as string) || '',
        content,
        tags: (data.tags as string[]) || undefined,
      };
    });
}

function loadExampleFiles(dir: string): ExampleFile[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const id = basename(f, '.md');
      const raw = readFileSync(resolve(dir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      return {
        id,
        name: (data.name as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        skillRef: (data.skillRef as string) || undefined,
        content,
        tags: (data.tags as string[]) || undefined,
      };
    });
}

function loadOutputContractFiles(dir: string): OutputContract[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const id = basename(f, '.md');
      const raw = readFileSync(resolve(dir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      return {
        id,
        name: (data.name as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        skillRef: (data.skillRef as string) || undefined,
        format: (data.format as string) || undefined,
        content,
        tags: (data.tags as string[]) || undefined,
      };
    });
}

function loadScriptFilesFromPlugin(dir: string): ScriptFile[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const id = basename(f, '.md');
      const raw = readFileSync(resolve(dir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      return {
        id,
        name: (data.name as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        language: (data.language as string) || 'unknown',
        content,
        tags: (data.tags as string[]) || undefined,
      };
    });
}

function loadAssetFilesFromPlugin(dir: string): AssetFile[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const id = basename(f, '.md');
      const raw = readFileSync(resolve(dir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      return {
        id,
        name: (data.name as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        format: (data.format as string) || 'unknown',
        content,
        tags: (data.tags as string[]) || undefined,
      };
    });
}

function loadSharedKnowledge(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => readFileSync(resolve(dir, f), 'utf-8').trim())
    .filter(Boolean);
}
