import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import { loadConfig } from '../core/config-loader.js';
import { loadAgents } from '../core/agent-loader.js';
import { getAllCompilers } from '../compilers/index.js';
import type { CompiledOutput, Platform } from '../core/types.js';

interface GenerateOptions {
  platform?: Platform;
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

export async function runGenerate(cwd: string = process.cwd(), options: GenerateOptions = {}) {
  const config = await loadConfig(cwd);
  const agents = loadAgents(config, cwd);

  const platforms = options.platform ? [options.platform] : config.platforms;
  const compilers = getAllCompilers(platforms);

  let totalFiles = 0;
  let totalWarnings = 0;

  for (const compiler of compilers) {
    const outputs = compiler.compile(agents, config);
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

    let written = 0;
    for (const output of outputs) {
      if (writeOutput(output, cwd)) {
        written++;
        console.log(chalk.dim(`  ${output.filePath}`));
      }
    }

    console.log(chalk.green(`✓ ${compiler.platform}: ${written} file(s) generated`));
    totalFiles += written;
  }

  console.log(chalk.bold(`\nTotal: ${totalFiles} file(s) generated`));
  if (totalWarnings > 0) {
    console.log(chalk.yellow(`${totalWarnings} warning(s)`));
  }
}
