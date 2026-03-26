import { BaseCompiler } from './base.compiler.js';
import { assembleSkillIndex } from '../core/template-engine.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput, Platform, ValidationResult } from '../core/types.js';

export class ClaudeCodeCompiler extends BaseCompiler {
  readonly platform: Platform = 'claude-code';

  compile(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

    for (const agent of agents) {
      const frontmatter = this.formatFrontmatter({
        name: agent.name,
        description: agent.description,
        tools: agent.tools.allowed,
      });

      const body = assembleSkillIndex(agent);
      const content = `${frontmatter}\n\n${body}\n`;

      outputs.push({
        filePath: `.claude/agents/${agent.id}-agent.md`,
        content,
        overwriteStrategy: 'replace',
      });

      // Generate reference files
      const refs = this.compileReferences(
        agent,
        `.claude/agents/${agent.id}-agent/references`,
      );
      outputs.push(...refs);

      // Generate skill files
      const skills = this.compileSkills(
        agent,
        `.claude/agents/${agent.id}-agent/skills`,
      );
      outputs.push(...skills);
    }

    // Generate CLAUDE.md section about available agents
    const agentList = agents
      .map((a) => `- **${a.name}** (\`${a.id}\`): ${a.description.trim().split('\n')[0]}`)
      .join('\n');

    const claudeMd = [
      `# CLAUDE.md`,
      ``,
      `This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.`,
      ``,
      `## Agent Team`,
      ``,
      `This project uses aigent-team. The following specialized agents are available:`,
      ``,
      agentList,
      ``,
      `Use the appropriate agent for your task by invoking it from the .claude/agents/ directory.`,
      ``,
    ].join('\n');

    outputs.push({
      filePath: 'CLAUDE.md',
      content: claudeMd,
      overwriteStrategy: 'skip-if-exists',
    });

    return outputs;
  }

  validate(outputs: CompiledOutput[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const output of outputs) {
      // Only warn about size on skill index files, not reference/skill files
      if (output.filePath.includes('/references/') || output.filePath.includes('/skills/')) continue;

      const lineCount = output.content.split('\n').length;
      if (lineCount > 300) {
        warnings.push(
          `${output.filePath}: ${lineCount} lines (recommended max 300 for Claude Code)`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
