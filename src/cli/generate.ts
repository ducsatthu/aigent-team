import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import { loadConfig } from '../core/config-loader.js';
import { loadAgents } from '../core/agent-loader.js';
import { getAllCompilers } from '../compilers/index.js';
import { PluginCompiler } from '../compilers/plugin.compiler.js';
import type { CompiledOutput, GenerateScope, Platform, TeamRole } from '../core/types.js';

export interface GenerateOptions {
  platform?: Platform;
  scopes?: GenerateScope[];
  teams?: TeamRole[];
}

function writeOutput(output: CompiledOutput, cwd: string): boolean {
  const fullPath = resolve(cwd, output.filePath);
  const dir = dirname(fullPath);

  if (output.overwriteStrategy === 'skip-if-exists' && existsSync(fullPath)) {
    return false;
  }

  if (output.overwriteStrategy === 'merge' && existsSync(fullPath)) {
    const existing = readFileSync(fullPath, 'utf-8');
    // Simple merge: append if not already present
    if (!existing.includes('## Agent Team')) {
      writeFileSync(fullPath, existing + '\n' + output.content);
      return true;
    }
    return false;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, output.content);
  return true;
}

function writeOutputs(outputs: CompiledOutput[], cwd: string, label: string): number {
  let written = 0;
  for (const output of outputs) {
    if (writeOutput(output, cwd)) {
      written++;
      console.log(chalk.dim(`  ${output.filePath}`));
    }
  }
  console.log(chalk.green(`✓ ${label}: ${written} file(s) generated`));
  return written;
}

export async function runGenerate(cwd: string = process.cwd(), options: GenerateOptions = {}) {
  const config = await loadConfig(cwd);

  // --team override
  const effectiveConfig = options.teams
    ? { ...config, teams: options.teams }
    : config;

  const agents = loadAgents(effectiveConfig, cwd);
  const scopes = options.scopes ?? ['all'];

  // Plugin mode — platform-agnostic
  if (scopes.includes('plugin')) {
    const pluginDir = effectiveConfig.output?.pluginDir ?? '.aigent-team-plugin';
    const pluginCompiler = new PluginCompiler();
    const outputs = pluginCompiler.compilePlugin(agents, effectiveConfig, pluginDir);
    const written = writeOutputs(outputs, cwd, 'plugin');
    console.log(chalk.bold(`\nTotal: ${written} file(s) generated`));
    return;
  }

  // Normal mode — per platform with scope filtering
  const platforms = options.platform ? [options.platform] : effectiveConfig.platforms;
  const compilers = getAllCompilers(platforms);

  let totalFiles = 0;
  let totalWarnings = 0;

  for (const compiler of compilers) {
    const outputs = compiler.compileWithScope(agents, effectiveConfig, scopes);
    const validation = compiler.validate(outputs);

    if (!validation.valid) {
      console.log(chalk.red(`\n✗ ${compiler.platform} validation errors:`));
      for (const error of validation.errors) {
        console.log(chalk.red(`  - ${error}`));
      }
      continue;
    }

    for (const warning of validation.warnings) {
      console.log(chalk.yellow(`  ⚠ ${warning}`));
      totalWarnings++;
    }

    totalFiles += writeOutputs(outputs, cwd, compiler.platform);
  }

  console.log(chalk.bold(`\nTotal: ${totalFiles} file(s) generated`));
  if (totalWarnings > 0) {
    console.log(chalk.yellow(`${totalWarnings} warning(s)`));
  }
}
