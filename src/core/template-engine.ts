import type { AgentDefinition, ReferenceFile } from './types.js';

/**
 * Assemble the slim skill index for an agent (~150-200 lines).
 * Used as the primary agent content that's always loaded.
 * If agent has skillContent (from skill.md), use that directly.
 * Otherwise, fall back to legacy assembly from parts.
 */
export function assembleSkillIndex(agent: AgentDefinition): string {
  // If skill.md exists, use it as-is (it's already the curated slim index)
  if (agent.skillContent) {
    return agent.skillContent;
  }

  // Legacy fallback: assemble from parts (for backward compat)
  return assembleAgentMarkdown(agent);
}

/**
 * Legacy: assemble full agent markdown from all parts.
 * Used when no skill.md exists.
 */
export function assembleAgentMarkdown(agent: AgentDefinition): string {
  const sections: string[] = [];

  sections.push(`# ${agent.name}\n\n${agent.description}`);

  if (agent.systemPrompt) {
    sections.push(agent.systemPrompt);
  }

  const { techStack } = agent;
  const stackLines: string[] = [];
  if (techStack.languages.length) stackLines.push(`- **Languages**: ${techStack.languages.join(', ')}`);
  if (techStack.frameworks.length) stackLines.push(`- **Frameworks**: ${techStack.frameworks.join(', ')}`);
  if (techStack.libraries.length) stackLines.push(`- **Libraries**: ${techStack.libraries.join(', ')}`);
  if (techStack.buildTools.length) stackLines.push(`- **Build Tools**: ${techStack.buildTools.join(', ')}`);
  if (stackLines.length) {
    sections.push(`## Tech Stack\n\n${stackLines.join('\n')}`);
  }

  if (agent.conventions) {
    sections.push(`## Coding Conventions\n\n${agent.conventions}`);
  }

  if (agent.reviewChecklist) {
    sections.push(`## Review Checklist\n\n${agent.reviewChecklist}`);
  }

  if (agent.workflows.length) {
    const wfLines = agent.workflows.map((wf) => {
      const steps = wf.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      return `### ${wf.name}\n\n${wf.description}\n\n${steps}`;
    }).join('\n\n');
    sections.push(`## Workflows\n\n${wfLines}`);
  }

  if (agent.sharedKnowledge.length) {
    const knowledge = agent.sharedKnowledge.filter(Boolean).join('\n\n---\n\n');
    if (knowledge) {
      sections.push(`## Project Knowledge\n\n${knowledge}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Format a single reference file for output.
 */
export function assembleReference(ref: ReferenceFile): string {
  return ref.content;
}
