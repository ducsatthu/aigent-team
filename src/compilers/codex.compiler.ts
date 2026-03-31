import { BaseCompiler } from './base.compiler.js';
import { assembleAsset, assembleExample, assembleOutputContract, assembleReference, assembleScript, assembleSkill, assembleSkillIndex } from '../core/template-engine.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput, Platform, ValidationResult } from '../core/types.js';

export class CodexCompiler extends BaseCompiler {
  readonly platform: Platform = 'codex';

  compile(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[] {
    return this.compileWithScope(agents, config, ['all']);
  }

  protected compileHubFile(agents: AgentDefinition[], _config: AigentTeamConfig): CompiledOutput[] {
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

    return [{
      filePath: 'AGENTS.md',
      content: agentsMd + '\n',
      overwriteStrategy: 'replace',
    }];
  }

  protected compileAgentIndexes(agents: AgentDefinition[], _config: AigentTeamConfig): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

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
    }

    return outputs;
  }

  protected compileAllSkills(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileSkills(
        agent,
        `.codex/agents/${agent.id}-agent/skills`,
      ));
    }
    return outputs;
  }

  protected compileAllReferences(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileReferences(
        agent,
        `.codex/agents/${agent.id}-agent/references`,
      ));
    }
    return outputs;
  }

  protected compileAllExamples(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileExamples(
        agent,
        `.codex/agents/${agent.id}-agent/examples`,
      ));
    }
    return outputs;
  }

  protected compileAllOutputContracts(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileOutputContracts(
        agent,
        `.codex/agents/${agent.id}-agent/contracts`,
      ));
    }
    return outputs;
  }

  protected compileAllScripts(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileScriptFiles(
        agent,
        `.codex/agents/${agent.id}-agent/scripts`,
      ));
    }
    return outputs;
  }

  protected compileAllAssets(agents: AgentDefinition[]): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];
    for (const agent of agents) {
      outputs.push(...this.compileAssetFiles(
        agent,
        `.codex/agents/${agent.id}-agent/assets`,
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

    // rules/ → AGENTS.md hub file
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
      filePath: `${rootDir}/rules/AGENTS.md`,
      content: agentsMd + '\n',
      overwriteStrategy: 'replace',
    });

    // agents/ → agent index files
    for (const agent of agents) {
      const frontmatter = this.formatFrontmatter({
        nickname_candidates: [agent.id, agent.role],
        model: 'inherit',
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
