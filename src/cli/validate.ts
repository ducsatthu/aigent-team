import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { loadConfig } from '../core/config-loader.js';
import { loadAgents } from '../core/agent-loader.js';
import { getAllCompilers } from '../compilers/index.js';

export async function runValidate(cwd: string = process.cwd()) {
  console.log(chalk.bold('\n🔍 Validating aigent-team configs...\n'));

  const config = await loadConfig(cwd);
  const agents = loadAgents(config, cwd);
  const compilers = getAllCompilers(config.platforms);

  let hasErrors = false;

  for (const compiler of compilers) {
    const outputs = compiler.compile(agents, config);
    const validation = compiler.validate(outputs);

    if (validation.valid && validation.warnings.length === 0) {
      console.log(chalk.green(`✓ ${compiler.platform}: OK`));
    } else {
      for (const error of validation.errors) {
        console.log(chalk.red(`✗ ${compiler.platform}: ${error}`));
        hasErrors = true;
      }
      for (const warning of validation.warnings) {
        console.log(chalk.yellow(`⚠ ${compiler.platform}: ${warning}`));
      }
    }

    // Check if generated files exist on disk
    for (const output of outputs) {
      const fullPath = resolve(cwd, output.filePath);
      if (!existsSync(fullPath)) {
        console.log(chalk.yellow(`  ⚠ ${output.filePath} not found on disk (run \`aigent-team generate\`)`));
      }
    }
  }

  if (hasErrors) {
    console.log(chalk.red('\n✗ Validation failed\n'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ All validations passed\n'));
  }
}
