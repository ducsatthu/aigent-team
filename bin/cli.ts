#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runInit } from '../src/cli/init.js';
import { runGenerate } from '../src/cli/generate.js';
import { runValidate } from '../src/cli/validate.js';
import { runInstall } from '../src/cli/install.js';
import { runUninstall } from '../src/cli/uninstall.js';
import { PLATFORMS, GENERATE_SCOPES, TEAM_ROLES } from '../src/core/types.js';
import type { Platform, GenerateScope, TeamRole } from '../src/core/types.js';

const program = new Command();

program
  .name('aigent-team')
  .description('Cross-platform AI agent team plugin for Claude Code, Cursor, Codex, and Antigravity')
  .version('0.2.0');

program
  .command('init')
  .description('Initialize aigent-team in your project (interactive)')
  .action(async () => {
    await runInit(process.cwd());
  });

program
  .command('generate')
  .description('Generate platform-specific config files from aigent-team config')
  .option('-p, --platform <platform>', 'Generate for a specific platform only')
  .option('-s, --scope <scopes>', 'Output scope(s), comma-separated: all | agents | skills | references | plugin', 'all')
  .option('-t, --team <teams>', 'Team roles to generate, comma-separated (overrides config)')
  .action(async (options) => {
    // Validate platform
    if (options.platform && !(PLATFORMS as readonly string[]).includes(options.platform)) {
      console.log(chalk.red(`Unknown platform: ${options.platform}. Valid: ${PLATFORMS.join(', ')}`));
      process.exit(1);
    }

    // Parse and validate scopes
    const scopes = (options.scope as string).split(',') as GenerateScope[];
    for (const s of scopes) {
      if (!(GENERATE_SCOPES as readonly string[]).includes(s)) {
        console.log(chalk.red(`Unknown scope: ${s}. Valid: ${GENERATE_SCOPES.join(', ')}`));
        process.exit(1);
      }
    }
    if (scopes.includes('plugin') && scopes.length > 1) {
      console.log(chalk.red(`Scope 'plugin' is exclusive and cannot be combined with other scopes.`));
      process.exit(1);
    }
    if (scopes.includes('all') && scopes.length > 1) {
      console.log(chalk.red(`Scope 'all' is exclusive and cannot be combined with other scopes.`));
      process.exit(1);
    }

    // Parse and validate teams
    let teams: TeamRole[] | undefined;
    if (options.team) {
      teams = (options.team as string).split(',') as TeamRole[];
      for (const t of teams) {
        if (!(TEAM_ROLES as readonly string[]).includes(t)) {
          console.log(chalk.red(`Unknown team role: ${t}. Valid: ${TEAM_ROLES.join(', ')}`));
          process.exit(1);
        }
      }
    }

    await runGenerate(process.cwd(), {
      platform: options.platform as Platform | undefined,
      scopes,
      teams,
    });
  });

program
  .command('validate')
  .description('Validate generated config files against platform constraints')
  .action(async () => {
    await runValidate(process.cwd());
  });

program
  .command('install')
  .description('Install a plugin bundle into the current project')
  .argument('<plugin-path>', 'Path to plugin directory (containing manifest.json)')
  .option('-p, --platform <platform>', 'Install for a specific platform only')
  .option('-f, --force', 'Overwrite existing files')
  .option(
    '--cursor-user-plugin',
    'Install Cursor IDE bundle from plugin cursor-ide-plugin/ to ~/.cursor/plugins/local/ (see cursor.com/docs/plugins)',
  )
  .action(async (pluginPath: string, options) => {
    if (options.platform && !(PLATFORMS as readonly string[]).includes(options.platform)) {
      console.log(chalk.red(`Unknown platform: ${options.platform}. Valid: ${PLATFORMS.join(', ')}`));
      process.exit(1);
    }

    await runInstall(pluginPath, process.cwd(), {
      platform: options.platform as Platform | undefined,
      force: options.force,
      cursorUserPlugin: options.cursorUserPlugin,
    });
  });

program
  .command('uninstall')
  .description('Uninstall a previously installed plugin')
  .argument('<plugin-name>', 'Name of the plugin to uninstall')
  .action(async (pluginName: string) => {
    await runUninstall(pluginName, process.cwd());
  });

program.parse();
