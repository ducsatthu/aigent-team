import { assembleExample, assembleOutputContract, assembleReference, assembleSkill } from '../core/template-engine.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput, GenerateScope, Platform, PluginArtifactCategory, ValidationResult } from '../core/types.js';

export abstract class BaseCompiler {
  abstract readonly platform: Platform;

  abstract compile(
    agents: AgentDefinition[],
    config: AigentTeamConfig
  ): CompiledOutput[];

  abstract validate(outputs: CompiledOutput[]): ValidationResult;

  /**
   * Compile with scope filtering. Delegates to decomposed methods.
   * 'all' = hub + agents + skills + references.
   * 'plugin' is handled externally in generate.ts.
   */
  compileWithScope(
    agents: AgentDefinition[],
    config: AigentTeamConfig,
    scopes: GenerateScope[],
  ): CompiledOutput[] {
    const normalized = new Set<string>();
    for (const s of scopes) {
      if (s === 'all') {
        normalized.add('hub');
        normalized.add('agents');
        normalized.add('skills');
        normalized.add('references');
        normalized.add('examples');
        normalized.add('output-contracts');
      } else {
        normalized.add(s);
      }
    }

    const outputs: CompiledOutput[] = [];

    if (normalized.has('agents')) {
      outputs.push(...this.compileHubFile(agents, config));
      outputs.push(...this.compileAgentIndexes(agents, config));
    }
    if (normalized.has('skills')) {
      outputs.push(...this.compileAllSkills(agents));
    }
    if (normalized.has('references')) {
      outputs.push(...this.compileAllReferences(agents));
    }
    if (normalized.has('examples')) {
      outputs.push(...this.compileAllExamples(agents));
    }
    if (normalized.has('output-contracts')) {
      outputs.push(...this.compileAllOutputContracts(agents));
    }

    return outputs;
  }

  /**
   * Compile a self-contained plugin bundle for this platform.
   * Each platform produces all artifact categories (rules, skills, agents, kb, ai)
   * in its native format under the given rootDir.
   */
  abstract compilePluginBundle(
    agents: AgentDefinition[],
    config: AigentTeamConfig,
    rootDir: string,
  ): CompiledOutput[];

  /**
   * Count files per artifact category from compiled outputs.
   * Subclasses can override to customize category detection.
   */
  countArtifacts(
    outputs: CompiledOutput[],
    rootDir: string,
  ): Partial<Record<PluginArtifactCategory, number>> {
    const counts: Partial<Record<PluginArtifactCategory, number>> = {};
    const categories: PluginArtifactCategory[] = ['rules', 'skills', 'agents', 'kb', 'examples', 'contracts', 'ai'];
    for (const cat of categories) {
      const prefix = `${rootDir}/${cat}/`;
      const count = outputs.filter((o) => o.filePath.startsWith(prefix)).length;
      if (count > 0) counts[cat] = count;
    }
    return counts;
  }

  // ---- Decomposed methods (each compiler must implement) ----

  protected abstract compileHubFile(
    agents: AgentDefinition[],
    config: AigentTeamConfig,
  ): CompiledOutput[];

  protected abstract compileAgentIndexes(
    agents: AgentDefinition[],
    config: AigentTeamConfig,
  ): CompiledOutput[];

  protected abstract compileAllSkills(
    agents: AgentDefinition[],
  ): CompiledOutput[];

  protected abstract compileAllReferences(
    agents: AgentDefinition[],
  ): CompiledOutput[];

  /**
   * Compile all example files. Default no-op — override in subclasses.
   */
  protected compileAllExamples(
    _agents: AgentDefinition[],
  ): CompiledOutput[] {
    return [];
  }

  /**
   * Compile all output contract files. Default no-op — override in subclasses.
   */
  protected compileAllOutputContracts(
    _agents: AgentDefinition[],
  ): CompiledOutput[] {
    return [];
  }

  // ---- Shared helpers ----

  /**
   * Compile reference files for an agent into a given directory.
   * Returns CompiledOutput[] for each reference file.
   */
  protected compileReferences(
    agent: AgentDefinition,
    baseDir: string,
    extension: string = '.md',
  ): CompiledOutput[] {
    if (!agent.references?.length) return [];

    return agent.references.map((ref) => ({
      filePath: `${baseDir}/${ref.id}${extension}`,
      content: assembleReference(ref) + '\n',
      overwriteStrategy: 'replace' as const,
    }));
  }

  /**
   * Compile skill files for an agent into a given directory.
   * Returns CompiledOutput[] for each skill file.
   */
  protected compileSkills(
    agent: AgentDefinition,
    baseDir: string,
    extension: string = '.md',
  ): CompiledOutput[] {
    if (!agent.skills?.length) return [];

    return agent.skills.map((skill) => ({
      filePath: `${baseDir}/${skill.id}${extension}`,
      content: assembleSkill(skill) + '\n',
      overwriteStrategy: 'replace' as const,
    }));
  }

  /**
   * Compile example files for an agent into a given directory.
   */
  protected compileExamples(
    agent: AgentDefinition,
    baseDir: string,
    extension: string = '.md',
  ): CompiledOutput[] {
    if (!agent.examples?.length) return [];

    return agent.examples.map((example) => ({
      filePath: `${baseDir}/${example.id}${extension}`,
      content: assembleExample(example) + '\n',
      overwriteStrategy: 'replace' as const,
    }));
  }

  /**
   * Compile output contract files for an agent into a given directory.
   */
  protected compileOutputContracts(
    agent: AgentDefinition,
    baseDir: string,
    extension: string = '.md',
  ): CompiledOutput[] {
    if (!agent.outputContracts?.length) return [];

    return agent.outputContracts.map((contract) => ({
      filePath: `${baseDir}/${contract.id}${extension}`,
      content: assembleOutputContract(contract) + '\n',
      overwriteStrategy: 'replace' as const,
    }));
  }

  protected formatFrontmatter(data: Record<string, unknown>): string {
    const lines: string[] = ['---'];
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${item}`);
        }
      } else {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    }
    lines.push('---');
    return lines.join('\n');
  }
}
