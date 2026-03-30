import { assembleReference, assembleSkill } from '../core/template-engine.js';
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
    const categories: PluginArtifactCategory[] = ['rules', 'skills', 'agents', 'kb', 'ai'];
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
