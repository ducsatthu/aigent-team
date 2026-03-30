import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import type { AgentDefinition, PluginManifest, ReferenceFile, SkillFile } from './types.js';

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

  // Reconstruct AgentDefinition[] from plugin files + manifest metadata
  const agents: AgentDefinition[] = [];

  for (const meta of manifest.agents) {
    // Read agent index (already-assembled skill content)
    const agentFilePath = resolve(absPath, 'agents', `${meta.id}-agent.md`);
    if (!existsSync(agentFilePath)) {
      throw new Error(`Agent file not found: ${agentFilePath}`);
    }
    const skillContent = readFileSync(agentFilePath, 'utf-8').trim();

    // Read skill files for this agent's role
    const skills = loadSkillFiles(resolve(absPath, 'skills', meta.role));

    // Read reference files for this agent's role
    const references = loadReferenceFiles(resolve(absPath, 'references', meta.role));

    // Read shared knowledge
    const sharedKnowledge = loadSharedKnowledge(resolve(absPath, 'shared'));

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

function loadSkillFiles(dir: string): SkillFile[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const id = basename(f, '.md');
      const content = readFileSync(resolve(dir, f), 'utf-8').trim();
      return {
        id,
        name: id.replace(/-/g, ' '),
        description: '',
        trigger: '',
        content,
      };
    });
}

function loadReferenceFiles(dir: string): ReferenceFile[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const id = basename(f, '.md');
      const content = readFileSync(resolve(dir, f), 'utf-8').trim();
      return {
        id,
        title: id.replace(/-/g, ' '),
        description: '',
        whenToRead: '',
        content,
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
