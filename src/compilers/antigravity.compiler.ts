import { BaseCompiler } from './base.compiler.js';
import { assembleSkillIndex } from '../core/template-engine.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput, Platform, ValidationResult } from '../core/types.js';

// Tool name mapping: canonical → Antigravity
const TOOL_MAP: Record<string, string> = {
  Read: 'read_file',
  Write: 'str_replace_editor',
  Edit: 'str_replace_editor',
  Bash: 'bash',
  Grep: 'search',
  Glob: 'list_dir',
};

export class AntigravityCompiler extends BaseCompiler {
  readonly platform: Platform = 'antigravity';

  compile(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

    // GEMINI.md - Antigravity-specific overrides
    const agentList = agents
      .map((a) => `- **${a.name}** (\`${a.id}\`): ${a.description.trim().split('\n')[0]}`)
      .join('\n');

    const geminiMd = [
      `# Antigravity Configuration`,
      ``,
      `## Available Agents`,
      ``,
      agentList,
      ``,
      `Agents are defined as skills in the \`.agents/skills/\` directory.`,
      `Use the appropriate agent skill for team-specific tasks.`,
      ``,
    ].join('\n');

    outputs.push({
      filePath: 'GEMINI.md',
      content: geminiMd,
      overwriteStrategy: 'replace',
    });

    // .agents/skills/<team>-agent/SKILL.md for each agent
    for (const agent of agents) {
      const allowedTools = agent.tools.allowed
        .map((t) => TOOL_MAP[t] || t.toLowerCase())
        .filter((v, i, arr) => arr.indexOf(v) === i);

      const frontmatter = this.formatFrontmatter({
        name: `${agent.id}-agent`,
        description: agent.description.trim().split('\n')[0],
        'allowed-tools': allowedTools,
      });

      const body = assembleSkillIndex(agent);
      const content = `${frontmatter}\n\n${body}\n`;

      outputs.push({
        filePath: `.agents/skills/${agent.id}-agent/SKILL.md`,
        content,
        overwriteStrategy: 'replace',
      });

      // Generate reference files
      const refs = this.compileReferences(
        agent,
        `.agents/skills/${agent.id}-agent/references`,
      );
      outputs.push(...refs);
    }

    return outputs;
  }

  validate(outputs: CompiledOutput[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const output of outputs) {
      if (output.filePath.includes('SKILL.md')) {
        // Verify directory name matches skill name in frontmatter
        const dirName = output.filePath.split('/').slice(-2, -1)[0];
        const nameMatch = output.content.match(/^name:\s*"?(.+?)"?\s*$/m);
        if (nameMatch && nameMatch[1] !== dirName) {
          errors.push(
            `${output.filePath}: SKILL.md name "${nameMatch[1]}" does not match directory "${dirName}"`
          );
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
