import { BaseCompiler } from './base.compiler.js';
import { assembleAsset, assembleExample, assembleOutputContract, assembleReference, assembleScript, assembleSkill, assembleSkillIndex } from '../core/template-engine.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput, Platform, ValidationResult } from '../core/types.js';

export class ClaudeCodeCompiler extends BaseCompiler {
  readonly platform: Platform = 'claude-code';

  compile(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[] {
    return this.compileWithScope(agents, config, ['all']);
  }

  protected compileHubFile(agents: AgentDefinition[], _config: AigentTeamConfig): CompiledOutput[] {
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

    return [{
      filePath: 'CLAUDE.md',
      content: claudeMd,
      overwriteStrategy: 'skip-if-exists',
    }];
  }

  protected compileAgentIndexes(agents: AgentDefinition[], _config: AigentTeamConfig): CompiledOutput[] {
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
    }

    return outputs;
  }

  protected compileAllSkills(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileSkills(
        agent,
        `.claude/agents/${agent.id}-agent/skills`,
      ));
    }
    return outputs;
  }

  protected compileAllReferences(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileReferences(
        agent,
        `.claude/agents/${agent.id}-agent/references`,
      ));
    }
    return outputs;
  }

  protected compileAllExamples(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileExamples(
        agent,
        `.claude/agents/${agent.id}-agent/examples`,
      ));
    }
    return outputs;
  }

  protected compileAllOutputContracts(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileOutputContracts(
        agent,
        `.claude/agents/${agent.id}-agent/contracts`,
      ));
    }
    return outputs;
  }

  protected compileAllScripts(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileScriptFiles(
        agent,
        `.claude/agents/${agent.id}-agent/scripts`,
      ));
    }
    return outputs;
  }

  protected compileAllAssets(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileAssetFiles(
        agent,
        `.claude/agents/${agent.id}-agent/assets`,
      ));
    }
    return outputs;
  }

  compilePluginBundle(
    agents: AgentDefinition[],
    config: AigentTeamConfig,
    rootDir: string,
  ): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

    // rules/ → hub file (CLAUDE.md content)
    const agentList = agents
      .map((a) => `- **${a.name}** (\`${a.id}\`): ${a.description.trim().split('\n')[0]}`)
      .join('\n');
    outputs.push({
      filePath: `${rootDir}/rules/CLAUDE.md`,
      content: [
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
        `Use the appropriate agent for your task by invoking it from the agents/ directory.`,
        ``,
      ].join('\n'),
      overwriteStrategy: 'replace',
    });

    // agents/ → agent index files with frontmatter
    for (const agent of agents) {
      const frontmatter = this.formatFrontmatter({
        name: agent.name,
        description: agent.description,
        tools: agent.tools.allowed,
      });
      const body = assembleSkillIndex(agent);
      outputs.push({
        filePath: `${rootDir}/agents/${agent.id}-agent.md`,
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
