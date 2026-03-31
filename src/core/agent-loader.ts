import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import matter from 'gray-matter';
import { deepmerge } from 'deepmerge-ts';
import type { AgentDefinition, AigentTeamConfig, AssetFile, ExampleFile, OutputContract, ReferenceFile, ScriptFile, SkillFile, TeamRole } from './types.js';

// Resolve package root: works both in src/ (dev) and dist/ (built)
const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = existsSync(resolve(PACKAGE_ROOT, 'templates'))
  ? resolve(PACKAGE_ROOT, 'templates')
  : resolve(__dirname, '../../templates');

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf-8').trim() : '';
}

export function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  if (!raw.trimStart().startsWith('---')) {
    return { data: {}, content: raw };
  }
  const { data, content } = matter(raw);
  return { data: data as Record<string, unknown>, content: content.trim() };
}

function loadReferences(refsDir: string): ReferenceFile[] {
  if (!existsSync(refsDir)) return [];
  const refs: ReferenceFile[] = [];

  const files = readdirSync(refsDir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      const subDir = resolve(refsDir, file.name);
      const subFiles = readdirSync(subDir).filter((f) => f.endsWith('.md'));
      for (const subFile of subFiles) {
        const raw = readFileSync(resolve(subDir, subFile), 'utf-8').trim();
        const { data, content } = parseFrontmatter(raw);
        const id = `${file.name}/${subFile.replace('.md', '')}`;
        refs.push({
          id,
          title: (data.title as string) || subFile.replace('.md', '').replace(/-/g, ' '),
          description: (data.description as string) || '',
          whenToRead: (data.whenToRead as string) || '',
          content,
          tags: (data.tags as string[]) || undefined,
        });
      }
    } else if (file.name.endsWith('.md')) {
      const raw = readFileSync(resolve(refsDir, file.name), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      const id = file.name.replace('.md', '');
      refs.push({
        id,
        title: (data.title as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        whenToRead: (data.whenToRead as string) || '',
        content,
        tags: (data.tags as string[]) || undefined,
      });
    }
  }

  return refs;
}

function loadSkills(skillsDir: string): SkillFile[] {
  if (!existsSync(skillsDir)) return [];
  const skills: SkillFile[] = [];

  const files = readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const raw = readFileSync(resolve(skillsDir, file), 'utf-8').trim();
    const { data, content } = parseFrontmatter(raw);
    const id = file.replace('.md', '');
    skills.push({
      id,
      name: (data.name as string) || id.replace(/-/g, ' '),
      description: (data.description as string) || '',
      trigger: (data.trigger as string) || '',
      content,
      useCases: (data.useCases as string[]) || undefined,
      tags: (data.tags as string[]) || undefined,
    });
  }

  return skills;
}

function loadExamples(examplesDir: string): ExampleFile[] {
  if (!existsSync(examplesDir)) return [];

  return readdirSync(examplesDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(resolve(examplesDir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      const id = f.replace('.md', '');
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

function loadOutputContracts(contractsDir: string): OutputContract[] {
  if (!existsSync(contractsDir)) return [];

  return readdirSync(contractsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(resolve(contractsDir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      const id = f.replace('.md', '');
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

const SCRIPT_EXTENSIONS = ['.md', '.sh', '.py', '.js', '.ts'];

function inferLanguage(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.'));
  const map: Record<string, string> = {
    '.sh': 'bash', '.py': 'python', '.js': 'javascript',
    '.ts': 'typescript', '.md': 'markdown',
  };
  return map[ext] || 'unknown';
}

function loadScripts(scriptsDir: string): ScriptFile[] {
  if (!existsSync(scriptsDir)) return [];

  return readdirSync(scriptsDir)
    .filter((f) => SCRIPT_EXTENSIONS.some((ext) => f.endsWith(ext)))
    .map((f) => {
      const raw = readFileSync(resolve(scriptsDir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      const id = f.replace(/\.[^.]+$/, '');
      return {
        id,
        name: (data.name as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        language: (data.language as string) || inferLanguage(f),
        content,
        tags: (data.tags as string[]) || undefined,
      };
    });
}

const ASSET_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.html'];

function inferFormat(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.'));
  const map: Record<string, string> = {
    '.md': 'markdown', '.json': 'json', '.yaml': 'yaml',
    '.yml': 'yaml', '.html': 'html',
  };
  return map[ext] || 'unknown';
}

function loadAssets(assetsDir: string): AssetFile[] {
  if (!existsSync(assetsDir)) return [];

  return readdirSync(assetsDir)
    .filter((f) => ASSET_EXTENSIONS.some((ext) => f.endsWith(ext)))
    .map((f) => {
      const raw = readFileSync(resolve(assetsDir, f), 'utf-8').trim();
      const { data, content } = parseFrontmatter(raw);
      const id = f.replace(/\.[^.]+$/, '');
      return {
        id,
        name: (data.name as string) || id.replace(/-/g, ' '),
        description: (data.description as string) || '',
        format: (data.format as string) || inferFormat(f),
        content,
        tags: (data.tags as string[]) || undefined,
      };
    });
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

  // Load rules, skills, examples, output contracts, scripts, assets
  const rulesContent = readIfExists(resolve(teamDir, 'rules.md'));
  const skills = loadSkills(resolve(teamDir, 'skills'));
  const examples = loadExamples(resolve(teamDir, 'examples'));
  const outputContracts = loadOutputContracts(resolve(teamDir, 'output-contracts'));
  const scripts = loadScripts(resolve(teamDir, 'scripts'));
  const assets = loadAssets(resolve(teamDir, 'assets'));

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
    rulesContent,
    skills,
    examples,
    outputContracts,
    scripts,
    assets,
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

      let rulesContent = agent.rulesContent;
      if (override.rules && existsSync(resolve(cwd, override.rules))) {
        rulesContent = readFileSync(resolve(cwd, override.rules), 'utf-8').trim();
      }

      agent = deepmerge(agent, {
        ...override,
        conventions,
        rulesContent,
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

      const localRules = readIfExists(resolve(localDir, 'rules.md'));
      if (localRules) agent.rulesContent = localRules;

      // Merge local references
      const localRefs = loadReferences(resolve(localDir, 'references'));
      if (localRefs.length) {
        agent.references = [...agent.references, ...localRefs];
      }

      // Merge local skills
      const localSkills = loadSkills(resolve(localDir, 'skills'));
      if (localSkills.length) {
        agent.skills = [...agent.skills, ...localSkills];
      }

      // Merge local examples
      const localExamples = loadExamples(resolve(localDir, 'examples'));
      if (localExamples.length) {
        agent.examples = [...agent.examples, ...localExamples];
      }

      // Merge local output contracts
      const localContracts = loadOutputContracts(resolve(localDir, 'output-contracts'));
      if (localContracts.length) {
        agent.outputContracts = [...agent.outputContracts, ...localContracts];
      }

      // Merge local scripts
      const localScripts = loadScripts(resolve(localDir, 'scripts'));
      if (localScripts.length) {
        agent.scripts = [...agent.scripts, ...localScripts];
      }

      // Merge local assets
      const localAssets = loadAssets(resolve(localDir, 'assets'));
      if (localAssets.length) {
        agent.assets = [...agent.assets, ...localAssets];
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
