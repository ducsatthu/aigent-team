import { BaseCompiler } from './base.compiler.js';
import { assembleAsset, assembleExample, assembleOutputContract, assembleReference, assembleScript, assembleSkill, assembleSkillIndex } from '../core/template-engine.js';
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
    return this.compileWithScope(agents, config, ['all']);
  }

  protected compileHubFile(agents: AgentDefinition[], _config: AigentTeamConfig): CompiledOutput[] {
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

    return [{
      filePath: 'GEMINI.md',
      content: geminiMd,
      overwriteStrategy: 'replace',
    }];
  }

  protected compileAgentIndexes(agents: AgentDefinition[], _config: AigentTeamConfig): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

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
    }

    return outputs;
  }

  protected compileAllSkills(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileSkills(
        agent,
        `.agents/skills/${agent.id}-agent/skills`,
      ));
    }
    return outputs;
  }

  protected compileAllReferences(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileReferences(
        agent,
        `.agents/skills/${agent.id}-agent/references`,
      ));
    }
    return outputs;
  }

  protected compileAllExamples(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileExamples(
        agent,
        `.agents/skills/${agent.id}-agent/examples`,
      ));
    }
    return outputs;
  }

  protected compileAllOutputContracts(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileOutputContracts(
        agent,
        `.agents/skills/${agent.id}-agent/contracts`,
      ));
    }
    return outputs;
  }

  protected compileAllScripts(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileScriptFiles(
        agent,
        `.agents/skills/${agent.id}-agent/scripts`,
      ));
    }
    return outputs;
  }

  protected compileAllAssets(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileAssetFiles(
        agent,
        `.agents/skills/${agent.id}-agent/assets`,
      ));
    }
    return outputs;
  }

  compilePluginBundle(
    agents: AgentDefinition[],
    _config: AigentTeamConfig,
    rootDir: string,
  ): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

    // rules/ → GEMINI.md hub file
    const agentList = agents
      .map((a) => `- **${a.name}** (\`${a.id}\`): ${a.description.trim().split('\n')[0]}`)
      .join('\n');
    outputs.push({
      filePath: `${rootDir}/rules/GEMINI.md`,
      content: [
        `# Antigravity Configuration`,
        ``,
        `## Available Agents`,
        ``,
        agentList,
        ``,
        `Agents are defined in the agents/ directory.`,
        `Use the appropriate agent for team-specific tasks.`,
        ``,
      ].join('\n'),
      overwriteStrategy: 'replace',
    });

    // agents/ → agent SKILL.md files (Antigravity format)
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
      outputs.push({
        filePath: `${rootDir}/agents/${agent.id}-agent/SKILL.md`,
        content: `${frontmatter}\n\n${body}\n`,
        overwriteStrategy: 'replace',
      });
    }

    // skills/ → skill files organized by agent
    for (const agent of agents) {
      if (!agent.skills?.length) continue;
      for (const skill of agent.skills) {
        outputs.push({
          filePath: `${rootDir}/skills/${agent.id}/${skill.id}.md`,
          content: assembleSkill(skill) + '\n',
          overwriteStrategy: 'replace',
        });
      }
    }

    // kb/ → reference files organized by agent
    for (const agent of agents) {
      if (!agent.references?.length) continue;
      for (const ref of agent.references) {
        outputs.push({
          filePath: `${rootDir}/kb/${agent.id}/${ref.id}.md`,
          content: assembleReference(ref) + '\n',
          overwriteStrategy: 'replace',
        });
      }
    }

    // examples/ → example files organized by agent
    for (const agent of agents) {
      if (!agent.examples?.length) continue;
      for (const example of agent.examples) {
        outputs.push({
          filePath: `${rootDir}/examples/${agent.id}/${example.id}.md`,
          content: assembleExample(example) + '\n',
          overwriteStrategy: 'replace',
        });
      }
    }

    // contracts/ → output contract files organized by agent
    for (const agent of agents) {
      if (!agent.outputContracts?.length) continue;
      for (const contract of agent.outputContracts) {
        outputs.push({
          filePath: `${rootDir}/contracts/${agent.id}/${contract.id}.md`,
          content: assembleOutputContract(contract) + '\n',
          overwriteStrategy: 'replace',
        });
      }
    }

    // scripts/ → script files organized by agent
    for (const agent of agents) {
      if (!agent.scripts?.length) continue;
      for (const script of agent.scripts) {
        outputs.push({
          filePath: `${rootDir}/scripts/${agent.id}/${script.id}.md`,
          content: assembleScript(script) + '\n',
          overwriteStrategy: 'replace',
        });
      }
    }

    // assets/ → asset files organized by agent
    for (const agent of agents) {
      if (!agent.assets?.length) continue;
      for (const asset of agent.assets) {
        outputs.push({
          filePath: `${rootDir}/assets/${agent.id}/${asset.id}.md`,
          content: assembleAsset(asset) + '\n',
          overwriteStrategy: 'replace',
        });
      }
    }

    // kb/shared/ → shared knowledge files
    const sharedKnowledge = agents
      .flatMap((a) => a.sharedKnowledge)
      .filter((v, i, arr) => arr.indexOf(v) === i && v);

    for (let i = 0; i < sharedKnowledge.length; i++) {
      outputs.push({
        filePath: `${rootDir}/kb/shared/knowledge-${i + 1}.md`,
        content: sharedKnowledge[i] + '\n',
        overwriteStrategy: 'replace',
      });
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
