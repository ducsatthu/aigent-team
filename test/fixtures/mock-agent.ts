import type { AgentDefinition, AigentTeamConfig } from '../../src/core/types.js';

/**
 * Creates a mock AgentDefinition with sensible defaults.
 * Override any field by passing a partial object.
 */
export function createMockAgent(overrides: Partial<AgentDefinition> = {}): AgentDefinition {
  return {
    id: 'fe',
    name: 'Frontend Agent',
    description: 'Test FE agent',
    role: 'fe',
    systemPrompt: '',
    skillContent: '',
    techStack: {
      languages: ['TypeScript'],
      frameworks: ['React'],
      libraries: ['Tailwind'],
      buildTools: ['Vite'],
    },
    conventions: '',
    reviewChecklist: '',
    tools: { allowed: ['Read', 'Write', 'Edit'] },
    workflows: [],
    sharedKnowledge: [],
    references: [],
    rulesContent: '',
    skills: [],
    examples: [],
    outputContracts: [],
    globs: ['**/*.tsx'],
    ...overrides,
  };
}

/**
 * Creates a mock AigentTeamConfig with sensible defaults.
 */
export function createMockConfig(overrides: Partial<AigentTeamConfig> = {}): AigentTeamConfig {
  return {
    projectName: 'test-project',
    platforms: ['claude-code', 'cursor'],
    teams: ['fe'],
    ...overrides,
  };
}
