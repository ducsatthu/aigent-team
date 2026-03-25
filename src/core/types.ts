import { z } from 'zod';

// ---- Enums ----

export const PLATFORMS = ['claude-code', 'cursor', 'codex', 'antigravity'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const TEAM_ROLES = ['lead', 'ba', 'fe', 'be', 'qa', 'devops'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

// ---- Reference File ----

export interface ReferenceFile {
  id: string;
  title: string;
  description: string;
  whenToRead: string;
  content: string;
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
