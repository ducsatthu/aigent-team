import { assembleReference } from '../core/template-engine.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput, Platform, ValidationResult } from '../core/types.js';

export abstract class BaseCompiler {
  abstract readonly platform: Platform;

  abstract compile(
    agents: AgentDefinition[],
    config: AigentTeamConfig
  ): CompiledOutput[];

  abstract validate(outputs: CompiledOutput[]): ValidationResult;

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
