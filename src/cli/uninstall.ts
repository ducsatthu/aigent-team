import { unlinkSync, existsSync, readFileSync, readdirSync, rmdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import chalk from 'chalk';
import type { InstallRecord } from '../core/types.js';

export async function runUninstall(pluginName: string, cwd: string = process.cwd()) {
  const recordPath = resolve(cwd, '.aigent-team', 'installed', `${pluginName}.json`);

  if (!existsSync(recordPath)) {
    // List available plugins if name doesn't match
    const installedDir = resolve(cwd, '.aigent-team', 'installed');
    if (existsSync(installedDir)) {
      const installed = readdirSync(installedDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''));

      if (installed.length > 0) {
        console.log(chalk.red(`Plugin "${pluginName}" is not installed.`));
        console.log(chalk.dim(`Installed plugins: ${installed.join(', ')}`));
        return;
      }
    }

    console.log(chalk.red(`No installed plugins found.`));
    return;
  }

  const record: InstallRecord = JSON.parse(readFileSync(recordPath, 'utf-8'));

  console.log(chalk.bold(`Uninstalling: ${record.name} v${record.version}`));

  if (record.cursorUserPluginPath && existsSync(record.cursorUserPluginPath)) {
    rmSync(record.cursorUserPluginPath, { recursive: true, force: true });
    console.log(chalk.dim(`  ✗ ${record.cursorUserPluginPath} (Cursor user plugin)`));
  }

  let removed = 0;
  let missing = 0;

  for (const filePath of record.files) {
    const fullPath = resolve(cwd, filePath);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
      removed++;
      console.log(chalk.dim(`  ✗ ${filePath}`));

      // Try to remove empty parent directories
      tryRemoveEmptyDir(dirname(fullPath));
    } else {
      missing++;
    }
  }

  // Remove install record
  unlinkSync(recordPath);

  console.log(chalk.bold(`\nRemoved: ${removed} file(s)`));
  if (missing > 0) {
    console.log(chalk.yellow(`${missing} file(s) already missing`));
  }
}

function tryRemoveEmptyDir(dir: string): void {
  try {
    const entries = readdirSync(dir);
    if (entries.length === 0) {
      rmdirSync(dir);
      // Recurse up
      tryRemoveEmptyDir(dirname(dir));
    }
  } catch {
    // Directory doesn't exist or not empty — fine
  }
}
