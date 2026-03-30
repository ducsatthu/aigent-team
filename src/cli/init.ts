import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { PLATFORMS, TEAM_ROLES, type Platform, type TeamRole } from '../core/types.js';
import { detectPlatforms } from '../detectors/platform-detector.js';
import { configExists } from '../core/config-loader.js';

export async function runInit(cwd: string = process.cwd()) {
  console.log(chalk.bold('\n🤖 aigent-team init\n'));

  if (configExists(cwd)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'aigent-team.config.json already exists. Overwrite?',
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(chalk.yellow('Aborted.'));
      return;
    }
  }

  // Detect platforms
  console.log(chalk.dim('Detecting installed AI tools...'));
  const detections = detectPlatforms(cwd);
  const detectedPlatforms = detections.filter((d) => d.detected);

  if (detectedPlatforms.length > 0) {
    console.log(chalk.green(`Found: ${detectedPlatforms.map((d) => d.platform).join(', ')}`));
  } else {
    console.log(chalk.dim('No AI tools detected. You can still select platforms manually.'));
  }

  // Interactive prompts
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: cwd.split('/').pop(),
    },
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Target platforms:',
      choices: PLATFORMS.map((p) => ({
        name: p,
        checked: detections.find((d) => d.platform === p)?.detected ?? false,
      })),
      validate: (input: string[]) =>
        input.length > 0 || 'Select at least one platform',
    },
    {
      type: 'checkbox',
      name: 'teams',
      message: 'Team agents to enable:',
      choices: [
        { name: 'Lead (Tech Lead / Orchestrator)', value: 'lead', checked: true },
        { name: 'BA (Business Analyst)', value: 'ba', checked: true },
        { name: 'FE (Frontend)', value: 'fe', checked: true },
        { name: 'BE (Backend)', value: 'be', checked: true },
        { name: 'QA (Testing)', value: 'qa', checked: true },
        { name: 'DevOps (Infrastructure)', value: 'devops', checked: true },
      ],
      validate: (input: string[]) =>
        input.length > 0 || 'Select at least one team',
    },
  ]);

  // Generate config file
  const config = {
    projectName: answers.projectName as string,
    platforms: answers.platforms as Platform[],
    teams: answers.teams as TeamRole[],
  };

  const configPath = resolve(cwd, 'aigent-team.config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(chalk.green(`\n✓ Created ${configPath}`));

  console.log(chalk.bold.green('\n✅ aigent-team initialized successfully!\n'));
  console.log(chalk.dim('Next steps:'));
  console.log(chalk.dim('  - Review aigent-team.config.json and adjust if needed'));
  console.log(chalk.dim('  - Run `aigent-team generate` to generate platform configs'));
  console.log(chalk.dim('  - Use `aigent-team generate --scope agents,skills` to control what gets generated\n'));
}
