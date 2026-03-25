import { BaseCompiler } from './base.compiler.js';
import { assembleSkillIndex } from '../core/template-engine.js';
import type { AgentDefinition, AigentTeamConfig, CompiledOutput, Platform, ValidationResult } from '../core/types.js';

export class CursorCompiler extends BaseCompiler {
  readonly platform: Platform = 'cursor';

  compile(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

    for (const agent of agents) {
      const globs = agent.globs?.length ? agent.globs.join(', ') : undefined;

      const frontmatterData: Record<string, unknown> = {
        description: agent.description.trim().split('\n')[0],
        alwaysApply: !globs,
      };
      if (globs) {
        frontmatterData.globs = globs;
      }

      const frontmatter = this.formatFrontmatter(frontmatterData);
      const body = assembleSkillIndex(agent);
      const content = `${frontmatter}\n\n${body}\n`;

      outputs.push({
        filePath: `.cursor/rules/${agent.id}-agent.mdc`,
        content,
        overwriteStrategy: 'replace',
      });

      // Generate reference files as glob-scoped .mdc rules
      if (agent.references?.length) {
        for (const ref of agent.references) {
          const refFrontmatter = this.formatFrontmatter({
            description: `${agent.name} reference: ${ref.title}`,
            alwaysApply: false,
            globs: globs || undefined,
          });

          outputs.push({
            filePath: `.cursor/rules/${agent.id}-refs/${ref.id}.mdc`,
            content: `${refFrontmatter}\n\n${ref.content}\n`,
            overwriteStrategy: 'replace',
          });
        }
      }
    }

    // Shared conventions rule (always applied)
    const sharedKnowledge = agents
      .flatMap((a) => a.sharedKnowledge)
      .filter((v, i, arr) => arr.indexOf(v) === i && v)
      .join('\n\n---\n\n');

    if (sharedKnowledge) {
      const frontmatter = this.formatFrontmatter({
        description: 'Shared project conventions and knowledge for all team agents',
        alwaysApply: true,
      });

      outputs.push({
        filePath: '.cursor/rules/shared-conventions.mdc',
        content: `${frontmatter}\n\n${sharedKnowledge}\n`,
        overwriteStrategy: 'replace',
      });
    }

    return outputs;
  }

  validate(outputs: CompiledOutput[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const output of outputs) {
      if (!output.filePath.endsWith('.mdc')) {
        errors.push(`${output.filePath}: Cursor rules must have .mdc extension`);
      }
      if (!output.content.startsWith('---')) {
        errors.push(`${output.filePath}: Missing YAML frontmatter`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
