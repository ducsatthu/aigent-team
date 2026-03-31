import chalk from 'chalk';
import { loadConfig } from '../core/config-loader.js';
import { loadAgents } from '../core/agent-loader.js';
import type { AgentDefinition, GovernanceStatus, SkillFile } from '../core/types.js';

interface AuditEntry {
  agentId: string;
  agentName: string;
  skillId: string;
  skillName: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
}

function auditSkill(agent: AgentDefinition, skill: SkillFile): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const base = { agentId: agent.id, agentName: agent.name, skillId: skill.id, skillName: skill.name };

  // Missing governance metadata entirely
  if (!skill.governance) {
    entries.push({ ...base, issue: 'No governance metadata', severity: 'warning' });
    return entries;
  }

  const gov = skill.governance;

  // Deprecated skills
  if (gov.status === 'deprecated') {
    entries.push({
      ...base,
      issue: `Deprecated${gov.deprecatedReason ? `: ${gov.deprecatedReason}` : ''}`,
      severity: 'error',
    });
  }

  // Review needed
  if (gov.status === 'review-needed') {
    entries.push({ ...base, issue: 'Marked for review', severity: 'warning' });
  }

  // Draft status
  if (gov.status === 'draft') {
    entries.push({ ...base, issue: 'Still in draft', severity: 'info' });
  }

  // Missing key fields
  if (!gov.version) {
    entries.push({ ...base, issue: 'Missing version', severity: 'info' });
  }
  if (!gov.owner) {
    entries.push({ ...base, issue: 'Missing owner', severity: 'info' });
  }

  // Missing basic skill metadata
  if (!skill.description) {
    entries.push({ ...base, issue: 'Missing skill description', severity: 'warning' });
  }
  if (!skill.trigger) {
    entries.push({ ...base, issue: 'Missing skill trigger', severity: 'info' });
  }

  return entries;
}

export async function runAudit(cwd: string = process.cwd()) {
  const config = await loadConfig(cwd);
  const agents = loadAgents(config, cwd);

  const allEntries: AuditEntry[] = [];
  let totalSkills = 0;
  let withGovernance = 0;

  for (const agent of agents) {
    for (const skill of agent.skills) {
      totalSkills++;
      if (skill.governance) withGovernance++;
      allEntries.push(...auditSkill(agent, skill));
    }
  }

  // Summary
  console.log(chalk.bold('\nSkill Governance Audit'));
  console.log(chalk.dim('─'.repeat(50)));
  console.log(`Total skills: ${totalSkills}`);
  console.log(`With governance metadata: ${withGovernance}/${totalSkills}`);

  // Status breakdown
  const statusCounts: Record<GovernanceStatus | 'none', number> = {
    'active': 0, 'draft': 0, 'review-needed': 0, 'deprecated': 0, 'none': 0,
  };
  for (const agent of agents) {
    for (const skill of agent.skills) {
      const status = skill.governance?.status ?? 'none';
      statusCounts[status]++;
    }
  }
  console.log(`\nStatus breakdown:`);
  if (statusCounts.active) console.log(chalk.green(`  active: ${statusCounts.active}`));
  if (statusCounts.draft) console.log(chalk.blue(`  draft: ${statusCounts.draft}`));
  if (statusCounts['review-needed']) console.log(chalk.yellow(`  review-needed: ${statusCounts['review-needed']}`));
  if (statusCounts.deprecated) console.log(chalk.red(`  deprecated: ${statusCounts.deprecated}`));
  if (statusCounts.none) console.log(chalk.dim(`  no status: ${statusCounts.none}`));

  // Issues
  const errors = allEntries.filter((e) => e.severity === 'error');
  const warnings = allEntries.filter((e) => e.severity === 'warning');
  const infos = allEntries.filter((e) => e.severity === 'info');

  if (errors.length) {
    console.log(chalk.red(`\n✗ Errors (${errors.length}):`));
    for (const e of errors) {
      console.log(chalk.red(`  ${e.agentId}/${e.skillId}: ${e.issue}`));
    }
  }

  if (warnings.length) {
    console.log(chalk.yellow(`\n⚠ Warnings (${warnings.length}):`));
    for (const e of warnings) {
      console.log(chalk.yellow(`  ${e.agentId}/${e.skillId}: ${e.issue}`));
    }
  }

  if (infos.length) {
    console.log(chalk.blue(`\nℹ Info (${infos.length}):`));
    for (const e of infos) {
      console.log(chalk.blue(`  ${e.agentId}/${e.skillId}: ${e.issue}`));
    }
  }

  if (!allEntries.length) {
    console.log(chalk.green('\n✓ All skills pass governance checks'));
  }

  console.log();

  // Exit with error code if there are errors
  if (errors.length) {
    process.exit(1);
  }
}
