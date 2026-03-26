import { BaseCompiler } from './base.compiler.js';
import { assembleSkillIndex } from '../core/template-engine.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput, Platform, ValidationResult } from '../core/types.js';

export class CodexCompiler extends BaseCompiler {
  readonly platform: Platform = 'codex';

  compile(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

    // Generate AGENTS.md with slim skill sections
    const sections = agents.map((agent) => {
      const body = assembleSkillIndex(agent);
      return `## ${agent.name} (${agent.id})\n\n${body}`;
    });

    const sharedKnowledge = agents
      .flatMap((a) => a.sharedKnowledge)
      .filter((v, i, arr) => arr.indexOf(v) === i && v)
      .join('\n\n');

    const agentsMd = [
      `# Project Agents`,
      ``,
      `This project uses specialized AI agents for different team roles.`,
      ``,
      ...sections,
      ``,
      sharedKnowledge ? `## Shared Knowledge\n\n${sharedKnowledge}` : '',
    ].filter(Boolean).join('\n\n');

    outputs.push({
      filePath: 'AGENTS.md',
      content: agentsMd + '\n',
      overwriteStrategy: 'replace',
    });

    // Generate .codex/agents/<team>.md subagent files + references
    for (const agent of agents) {
      const frontmatter = this.formatFrontmatter({
        nickname_candidates: [agent.id, agent.role],
        model: 'inherit',
      });

      const body = assembleSkillIndex(agent);
      const content = `${frontmatter}\n\n${body}\n`;

      outputs.push({
        filePath: `.codex/agents/${agent.id}-agent.md`,
        content,
        overwriteStrategy: 'replace',
      });

      // Generate reference files
      const refs = this.compileReferences(
        agent,
        `.codex/agents/${agent.id}-agent/references`,
      );
      outputs.push(...refs);

      // Generate skill files
      const skills = this.compileSkills(
        agent,
        `.codex/agents/${agent.id}-agent/skills`,
      );
      outputs.push(...skills);
    }

    return outputs;
  }

  validate(outputs: CompiledOutput[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const agentsMd = outputs.find((o) => o.filePath === 'AGENTS.md');
    if (!agentsMd) {
      errors.push('AGENTS.md is missing from compiled output');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
