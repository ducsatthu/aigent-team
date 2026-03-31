import { z } from 'zod';

// ---- Enums ----

export const PLATFORMS = ['claude-code', 'cursor', 'codex', 'antigravity'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const TEAM_ROLES = ['lead', 'ba', 'fe', 'be', 'qa', 'devops'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const GENERATE_SCOPES = ['all', 'agents', 'skills', 'references', 'examples', 'output-contracts', 'scripts', 'assets', 'plugin'] as const;
export type GenerateScope = (typeof GENERATE_SCOPES)[number];

export const PLUGIN_ARTIFACT_CATEGORIES = ['rules', 'skills', 'agents', 'kb', 'examples', 'contracts', 'scripts', 'assets', 'ai'] as const;
export type PluginArtifactCategory = (typeof PLUGIN_ARTIFACT_CATEGORIES)[number];

export const PLUGIN_BUNDLE_DIRS: Record<Platform, string> = {
  'claude-code': 'claude-code-plugin',
  cursor: 'cursor-ide-plugin',
  codex: 'codex-plugin',
  antigravity: 'antigravity-plugin',
};

// ---- Content Layers ----

export const CONTENT_LAYERS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'] as const;
export type ContentLayer = (typeof CONTENT_LAYERS)[number];

export type LoadingStrategy = 'always' | 'on-invocation' | 'on-demand' | 'never';

// ---- Reference File ----

export interface ReferenceFile {
  id: string;
  title: string;
  description: string;
  whenToRead: string;
  content: string;
  tags?: string[];
}

// ---- Governance Metadata (L8 — not loaded into AI, manifest/audit only) ----

export type GovernanceStatus = 'draft' | 'active' | 'review-needed' | 'deprecated';

export interface GovernanceMetadata {
  version?: string;
  owner?: string;
  status?: GovernanceStatus;
  lastReviewedAt?: string;
  deprecatedReason?: string;
}

// ---- Skill File (on-demand executable procedure) ----

export interface SkillFile {
  id: string;
  name: string;
  description: string;
  trigger: string;
  content: string;
  useCases?: string[];
  tags?: string[];
  governance?: GovernanceMetadata;
}

// ---- Example File (L4 — few-shot examples for AI output quality) ----

export interface ExampleFile {
  id: string;
  name: string;
  description: string;
  skillRef?: string;
  content: string;
  tags?: string[];
}

// ---- Output Contract (L7 — output standards, rubric, self-check) ----

export interface OutputContract {
  id: string;
  name: string;
  description: string;
  skillRef?: string;
  format?: string;
  content: string;
  tags?: string[];
}

// ---- Script File (L5 — automation, validation scripts) ----

export interface ScriptFile {
  id: string;
  name: string;
  description: string;
  language: string;
  content: string;
  tags?: string[];
}

// ---- Asset File (L6 — templates, report formats, checklists) ----

export interface AssetFile {
  id: string;
  name: string;
  description: string;
  format: string;
  content: string;
  tags?: string[];
}

// ---- Agent Definition (Single Source of Truth) ----

export interface TechStackConfig {
  languages: string[];
  frameworks: string[];
  libraries: string[];
  buildTools: string[];
}

export interface ToolPermissions {
  allowed: string[];
  denied?: string[];
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  role: TeamRole;
  systemPrompt: string;
  skillContent: string;
  techStack: TechStackConfig;
  conventions: string;
  reviewChecklist: string;
  tools: ToolPermissions;
  workflows: WorkflowDefinition[];
  sharedKnowledge: string[];
  references: ReferenceFile[];
  rulesContent: string;
  skills: SkillFile[];
  examples: ExampleFile[];
  outputContracts: OutputContract[];
  scripts: ScriptFile[];
  assets: AssetFile[];
  globs?: string[];
}

// ---- Project Configuration (Zod schema) ----

export const TechStackSchema = z.object({
  languages: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
  libraries: z.array(z.string()).optional(),
  buildTools: z.array(z.string()).optional(),
});

export const AgentOverrideSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  techStack: TechStackSchema.optional(),
  conventions: z.string().optional(),
  reviewChecklist: z.string().optional(),
  tools: z.object({
    allowed: z.array(z.string()).optional(),
    denied: z.array(z.string()).optional(),
  }).optional(),
  rules: z.string().optional(),
  globs: z.array(z.string()).optional(),
});

export const ConfigSchema = z.object({
  projectName: z.string(),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  teams: z.array(z.enum(TEAM_ROLES)).min(1),
  overrides: z.record(z.enum(TEAM_ROLES), AgentOverrideSchema).optional(),
  shared: z.object({
    conventions: z.string().optional(),
    apiSpecs: z.string().optional(),
    architecture: z.string().optional(),
  }).optional(),
  output: z.object({
    directory: z.string().optional(),
    pluginDir: z.string().optional(),
  }).optional(),
});

export type AigentTeamConfig = z.infer<typeof ConfigSchema>;

// ---- Compiler Output ----

export interface CompiledOutput {
  filePath: string;
  content: string;
  overwriteStrategy: 'replace' | 'merge' | 'skip-if-exists';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ---- Plugin Manifest ----

export interface PluginAgentMeta {
  id: string;
  name: string;
  description: string;
  role: TeamRole;
  tools: ToolPermissions;
  globs?: string[];
}

export interface PluginPlatformBundle {
  platform: Platform;
  directory: string;
  artifacts: Partial<Record<PluginArtifactCategory, number>>;
}

export interface SkillGovernanceEntry {
  skillId: string;
  agentId: string;
  name: string;
  governance: GovernanceMetadata;
}

export interface PluginManifest {
  name: string;
  version: string;
  generatedAt: string;
  generator: string;
  projectName: string;
  roles: TeamRole[];
  platforms: Platform[];
  agents: PluginAgentMeta[];
  files: {
    agents: number;
    skills: number;
    references: number;
    examples: number;
    outputContracts: number;
    scripts: number;
    assets: number;
  };
  formatVersion?: number;
  bundles?: PluginPlatformBundle[];
  governance?: SkillGovernanceEntry[];
}

// ---- Install Record ----

export interface InstallRecord {
  name: string;
  version: string;
  installedAt: string;
  pluginPath: string;
  files: string[];
  /** Absolute path when `install --cursor-user-plugin` copied the Cursor IDE bundle */
  cursorUserPluginPath?: string;
}
