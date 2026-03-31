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

    // Per-platform plugin bundles (self-contained — all kb, skills, refs, shared inside)
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
        examples: agents.reduce((sum, a) => sum + (a.examples?.length ?? 0), 0),
        outputContracts: agents.reduce((sum, a) => sum + (a.outputContracts?.length ?? 0), 0),
        scripts: agents.reduce((sum, a) => sum + (a.scripts?.length ?? 0), 0),
        assets: agents.reduce((sum, a) => sum + (a.assets?.length ?? 0), 0),
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
