import type { AigentTeamConfig } from './core/types.js';

export function defineConfig(config: AigentTeamConfig): AigentTeamConfig {
  return config;
}

export type {
  AigentTeamConfig,
  AgentDefinition,
  ReferenceFile,
  TeamRole,
  Platform,
  TechStackConfig,
  ToolPermissions,
  WorkflowDefinition,
  CompiledOutput,
  ValidationResult,
} from './core/types.js';

export { PLATFORMS, TEAM_ROLES } from './core/types.js';
export { loadConfig, configExists } from './core/config-loader.js';
export { loadAgents } from './core/agent-loader.js';
export { assembleSkillIndex, assembleAgentMarkdown, assembleReference } from './core/template-engine.js';
