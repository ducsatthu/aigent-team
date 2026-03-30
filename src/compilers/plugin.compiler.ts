import { assembleSkillIndex, assembleReference, assembleSkill } from '../core/template-engine.js';
import { getCompiler } from './index.js';
import type {
  AgentDefinition,
  AigentTeamConfig,
  CompiledOutput,
  PluginAgentMeta,
  PluginManifest,
  PluginPlatformBundle,
} from '../core/types.js';
import { PLUGIN_BUNDLE_DIRS } from '../core/types.js';

export class PluginCompiler {
  compilePlugin(
    agents: AgentDefinition[],
    config: AigentTeamConfig,
    pluginDir: string = '.aigent-team-plugin',
  ): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

    // Platform-agnostic agent index files
    for (const agent of agents) {
      const body = assembleSkillIndex(agent);
      outputs.push({
        filePath: `${pluginDir}/agents/${agent.id}-agent.md`,
        content: body + '\n',
        overwriteStrategy: 'replace',
      });

      for (const skill of agent.skills) {
        outputs.push({
          filePath: `${pluginDir}/skills/${agent.role}/${skill.id}.md`,
          content: assembleSkill(skill) + '\n',
          overwriteStrategy: 'replace',
        });
      }

      for (const ref of agent.references) {
        outputs.push({
          filePath: `${pluginDir}/references/${agent.role}/${ref.id}.md`,
          content: assembleReference(ref) + '\n',
          overwriteStrategy: 'replace',
        });
      }
    }

    // Shared knowledge files
    const sharedKnowledge = agents
      .flatMap((a) => a.sharedKnowledge)
      .filter((v, i, arr) => arr.indexOf(v) === i && v);

    for (let i = 0; i < sharedKnowledge.length; i++) {
      outputs.push({
        filePath: `${pluginDir}/shared/knowledge-${i + 1}.md`,
        content: sharedKnowledge[i] + '\n',
        overwriteStrategy: 'replace',
      });
    }

    // Per-platform plugin bundles
    const bundles: PluginPlatformBundle[] = [];

    for (const platform of config.platforms) {
      const bundleDir = PLUGIN_BUNDLE_DIRS[platform];
      const rootDir = `${pluginDir}/${bundleDir}`;
      const compiler = getCompiler(platform);
      const bundleOutputs = compiler.compilePluginBundle(agents, config, rootDir);
      outputs.push(...bundleOutputs);

      bundles.push({
        platform,
        directory: bundleDir,
        artifacts: compiler.countArtifacts(bundleOutputs, rootDir),
      });
    }

    // Manifest (last — so file counts are accurate)
    const agentsMeta: PluginAgentMeta[] = agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      role: a.role,
      tools: { allowed: [...a.tools.allowed], ...(a.tools.denied ? { denied: [...a.tools.denied] } : {}) },
      ...(a.globs?.length ? { globs: [...a.globs] } : {}),
    }));

    const manifest: PluginManifest = {
      name: config.projectName,
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      generator: 'aigent-team',
      projectName: config.projectName,
      roles: [...config.teams],
      platforms: [...config.platforms],
      agents: agentsMeta,
      files: {
        agents: agents.length,
        skills: agents.reduce((sum, a) => sum + a.skills.length, 0),
        references: agents.reduce((sum, a) => sum + a.references.length, 0),
      },
      bundles,
    };

    outputs.push({
      filePath: `${pluginDir}/manifest.json`,
      content: JSON.stringify(manifest, null, 2) + '\n',
      overwriteStrategy: 'replace',
    });

    return outputs;
  }
}
