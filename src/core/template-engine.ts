import type { AgentDefinition, AssetFile, ExampleFile, OutputContract, ReferenceFile, ScriptFile, SkillFile } from './types.js';

/**
 * Assemble the slim skill index for an agent (~150-200 lines).
 * Used as the primary agent content that's always loaded.
 * If agent has skillContent (from skill.md), use that directly.
 * Otherwise, fall back to legacy assembly from parts.
 */
export function assembleSkillIndex(agent: AgentDefinition): string {
  const parts: string[] = [];

  // Rules go first — they are hard constraints, must be prominent
  if (agent.rulesContent) {
    parts.push(agent.rulesContent);
  }

  // Then skill content (or legacy fallback)
  if (agent.skillContent) {
    parts.push(agent.skillContent);
  } else {
    parts.push(assembleAgentMarkdown(agent));
  }

  // Reference catalog table (if any references have whenToRead metadata)
  if (agent.references?.length) {
    const refsWithMeta = agent.references.filter((r) => r.whenToRead);
    if (refsWithMeta.length) {
      const refLines = refsWithMeta.map(
        (r) => `| \`${r.id}\` | ${r.title} | ${r.whenToRead} |`
      );
      parts.push([
        '## Reference Files',
        '',
        'Load the relevant reference file when you need deep knowledge:',
        '',
        '| Reference | Title | When to read |',
        '|-----------|-------|-------------|',
        ...refLines,
      ].join('\n'));
    }
  }

  // Examples catalog table (if any examples exist)
  if (agent.examples?.length) {
    const exampleLines = agent.examples.map(
      (e) => `| \`${e.id}\` | ${e.name} | ${e.skillRef || '—'} |`
    );
    parts.push([
      '## Examples',
      '',
      'Load the relevant example file for few-shot guidance:',
      '',
      '| Example | Name | Skill Ref |',
      '|---------|------|-----------|',
      ...exampleLines,
    ].join('\n'));
  }

  // Output contracts catalog table (if any contracts exist)
  if (agent.outputContracts?.length) {
    const contractLines = agent.outputContracts.map(
      (c) => `| \`${c.id}\` | ${c.name} | ${c.format || '—'} |`
    );
    parts.push([
      '## Output Contracts',
      '',
      'Validate your output against the relevant contract:',
      '',
      '| Contract | Name | Format |',
      '|----------|------|--------|',
      ...contractLines,
    ].join('\n'));
  }

  // Skills catalog table (if any skills exist)
  if (agent.skills?.length) {
    const hasTriggers = agent.skills.some((s) => s.trigger);
    const skillLines = hasTriggers
      ? agent.skills.map((s) => `| \`${s.id}\` | ${s.name} | ${s.trigger || '—'} |`)
      : agent.skills.map((s) => `| \`${s.id}\` | ${s.name} |`);
    const header = hasTriggers
      ? ['| Skill | Name | Trigger |', '|-------|------|---------|']
      : ['| Skill | Name |', '|-------|------|'];
    parts.push([
      '## Executable Skills',
      '',
      'Load the relevant skill file when performing these procedures:',
      '',
      ...header,
      ...skillLines,
    ].join('\n'));
  }

  // Scripts catalog table (if any scripts exist)
  if (agent.scripts?.length) {
    const scriptLines = agent.scripts.map(
      (s) => `| \`${s.id}\` | ${s.name} | ${s.language} |`
    );
    parts.push([
      '## Scripts',
      '',
      'Available automation and validation scripts:',
      '',
      '| Script | Name | Language |',
      '|--------|------|----------|',
      ...scriptLines,
    ].join('\n'));
  }

  // Assets catalog table (if any assets exist)
  if (agent.assets?.length) {
    const assetLines = agent.assets.map(
      (a) => `| \`${a.id}\` | ${a.name} | ${a.format} |`
    );
    parts.push([
      '## Assets',
      '',
      'Available templates and resource files:',
      '',
      '| Asset | Name | Format |',
      '|-------|------|--------|',
      ...assetLines,
    ].join('\n'));
  }

  return parts.join('\n\n');
}

/**
 * Legacy: assemble full agent markdown from all parts.
 * Used when no skill.md exists.
 */
export function assembleAgentMarkdown(agent: AgentDefinition): string {
  const sections: string[] = [];

  sections.push(`# ${agent.name}\n\n${agent.description}`);

  if (agent.systemPrompt) {
    sections.push(agent.systemPrompt);
  }

  const { techStack } = agent;
  const stackLines: string[] = [];
  if (techStack.languages.length) stackLines.push(`- **Languages**: ${techStack.languages.join(', ')}`);
  if (techStack.frameworks.length) stackLines.push(`- **Frameworks**: ${techStack.frameworks.join(', ')}`);
  if (techStack.libraries.length) stackLines.push(`- **Libraries**: ${techStack.libraries.join(', ')}`);
  if (techStack.buildTools.length) stackLines.push(`- **Build Tools**: ${techStack.buildTools.join(', ')}`);
  if (stackLines.length) {
    sections.push(`## Tech Stack\n\n${stackLines.join('\n')}`);
  }

  if (agent.conventions) {
    sections.push(`## Coding Conventions\n\n${agent.conventions}`);
  }

  if (agent.reviewChecklist) {
    sections.push(`## Review Checklist\n\n${agent.reviewChecklist}`);
  }

  if (agent.workflows.length) {
    const wfLines = agent.workflows.map((wf) => {
      const steps = wf.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      return `### ${wf.name}\n\n${wf.description}\n\n${steps}`;
    }).join('\n\n');
    sections.push(`## Workflows\n\n${wfLines}`);
  }

  if (agent.sharedKnowledge.length) {
    const knowledge = agent.sharedKnowledge.filter(Boolean).join('\n\n---\n\n');
    if (knowledge) {
      sections.push(`## Project Knowledge\n\n${knowledge}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Format a single reference file for output.
 */
export function assembleReference(ref: ReferenceFile): string {
  return ref.content;
}

/**
 * Format a single skill file for output.
 */
export function assembleSkill(skill: SkillFile): string {
  return skill.content;
}

/**
 * Format a single example file for output.
 */
export function assembleExample(example: ExampleFile): string {
  return example.content;
}

/**
 * Format a single output contract file for output.
 */
export function assembleOutputContract(contract: OutputContract): string {
  return contract.content;
}

/**
 * Format a single script file for output.
 */
export function assembleScript(script: ScriptFile): string {
  return script.content;
}

/**
 * Format a single asset file for output.
 */
export function assembleAsset(asset: AssetFile): string {
  return asset.content;
}
