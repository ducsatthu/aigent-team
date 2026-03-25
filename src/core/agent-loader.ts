import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { deepmerge } from 'deepmerge-ts';
import type { AgentDefinition, AigentTeamConfig, ReferenceFile, TeamRole } from './types.js';

// Resolve package root: works both in src/ (dev) and dist/ (built)
const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = existsSync(resolve(PACKAGE_ROOT, 'templates'))
  ? resolve(PACKAGE_ROOT, 'templates')
  : resolve(__dirname, '../../templates');

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf-8').trim() : '';
}

function loadReferences(refsDir: string): ReferenceFile[] {
  if (!existsSync(refsDir)) return [];
  const refs: ReferenceFile[] = [];

  const files = readdirSync(refsDir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      // Load nested directories (e.g., references/workflows/)
      const subDir = resolve(refsDir, file.name);
      const subFiles = readdirSync(subDir).filter((f) => f.endsWith('.md'));
      for (const subFile of subFiles) {
        const content = readFileSync(resolve(subDir, subFile), 'utf-8').trim();
        const id = `${file.name}/${subFile.replace('.md', '')}`;
        refs.push({
          id,
          title: subFile.replace('.md', '').replace(/-/g, ' '),
          description: '',
          whenToRead: '',
          content,
        });
      }
    } else if (file.name.endsWith('.md')) {
      const content = readFileSync(resolve(refsDir, file.name), 'utf-8').trim();
      const id = file.name.replace('.md', '');
      refs.push({
        id,
        title: id.replace(/-/g, ' '),
        description: '',
        whenToRead: '',
        content,
      });
    }
  }

  return refs;
}

function loadBuiltinAgent(role: TeamRole): AgentDefinition {
  const teamDir = resolve(TEMPLATES_DIR, 'teams', role);
  const agentYaml = readFileSync(resolve(teamDir, 'agent.yaml'), 'utf-8');
  const agentDef = parseYaml(agentYaml);

  // New: load skill.md as primary content
  const skillContent = readIfExists(resolve(teamDir, 'skill.md'));

  // Legacy: load conventions/checklist (fallback if no skill.md)
  const conventions = readIfExists(resolve(teamDir, 'conventions.md'));
  const reviewChecklist = readIfExists(resolve(teamDir, 'review-checklist.md'));

  // New: load reference files
  const references = loadReferences(resolve(teamDir, 'references'));

  return {
    id: agentDef.id,
    name: agentDef.name,
    description: agentDef.description,
    role: agentDef.role,
    systemPrompt: agentDef.systemPrompt || '',
    skillContent,
    techStack: agentDef.techStack || { languages: [], frameworks: [], libraries: [], buildTools: [] },
    conventions,
    reviewChecklist,
    tools: agentDef.tools || { allowed: [] },
    workflows: agentDef.workflows || [],
    sharedKnowledge: agentDef.sharedKnowledge || [],
    references,
    globs: agentDef.globs || [],
  };
}

function loadSharedKnowledge(): Record<string, string> {
  const sharedDir = resolve(TEMPLATES_DIR, 'shared');
  const knowledge: Record<string, string> = {};

  const files = ['project-conventions.md', 'git-workflow.md'];
  for (const file of files) {
    const key = file.replace('.md', '');
    knowledge[key] = readIfExists(resolve(sharedDir, file));
  }

  return knowledge;
}

export function loadAgents(
  config: AigentTeamConfig,
  cwd: string = process.cwd()
): AgentDefinition[] {
  const sharedKnowledge = loadSharedKnowledge();
  const agents: AgentDefinition[] = [];

  for (const role of config.teams) {
    let agent = loadBuiltinAgent(role);

    // Apply config overrides
    const override = config.overrides?.[role];
    if (override) {
      let conventions = agent.conventions;
      if (override.conventions && existsSync(resolve(cwd, override.conventions))) {
        conventions = readFileSync(resolve(cwd, override.conventions), 'utf-8').trim();
      }

      agent = deepmerge(agent, {
        ...override,
        conventions,
      }) as AgentDefinition;
    }

    // Load local overrides from .aigent-team/teams/<role>/
    const localDir = resolve(cwd, '.aigent-team', 'teams', role);
    if (existsSync(localDir)) {
      const localConventions = readIfExists(resolve(localDir, 'conventions.md'));
      const localChecklist = readIfExists(resolve(localDir, 'review-checklist.md'));
      const localSkill = readIfExists(resolve(localDir, 'skill.md'));
      if (localConventions) agent.conventions = localConventions;
      if (localChecklist) agent.reviewChecklist = localChecklist;
      if (localSkill) agent.skillContent = localSkill;

      // Merge local references
      const localRefs = loadReferences(resolve(localDir, 'references'));
      if (localRefs.length) {
        agent.references = [...agent.references, ...localRefs];
      }
    }

    // Resolve shared knowledge refs
    const resolvedShared: string[] = [];
    for (const ref of agent.sharedKnowledge) {
      if (sharedKnowledge[ref]) {
        resolvedShared.push(sharedKnowledge[ref]);
      }
      if (ref === 'project-conventions' && config.shared?.conventions) {
        const p = resolve(cwd, config.shared.conventions);
        if (existsSync(p)) resolvedShared.push(readFileSync(p, 'utf-8').trim());
      }
    }
    agent.sharedKnowledge = resolvedShared;

    agents.push(agent);
  }

  return agents;
}
