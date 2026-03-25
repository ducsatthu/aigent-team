#!/usr/bin/env node

import { Command } from 'commander';
import { runInit } from '../src/cli/init.js';
import { runGenerate } from '../src/cli/generate.js';
import { runValidate } from '../src/cli/validate.js';
import type { Platform } from '../src/core/types.js';

const program = new Command();

program
  .name('aigent-team')
  .description('Cross-platform AI agent team plugin for Claude Code, Cursor, Codex, and Antigravity')
  .version('0.1.0');

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
  .action(async (options) => {
    await runGenerate(process.cwd(), {
      platform: options.platform as Platform | undefined,
    });
  });

program
  .command('validate')
  .description('Validate generated config files against platform constraints')
  .action(async () => {
    await runValidate(process.cwd());
  });

program.parse();
