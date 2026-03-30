import { writeFileSync, mkdirSync, existsSync, readFileSync, cpSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import chalk from 'chalk';
import { loadPlugin } from '../core/plugin-loader.js';
import { loadConfig, configExists } from '../core/config-loader.js';
import { getAllCompilers } from '../compilers/index.js';
import type { CompiledOutput, InstallRecord, Platform } from '../core/types.js';

interface InstallOptions {
  platform?: Platform;
  force?: boolean;
  /** Install Cursor bundle to ~/.cursor/plugins/local/<name> (see https://cursor.com/docs/plugins) */
  cursorUserPlugin?: boolean;
}

function readCursorPluginId(cursorIdePluginRoot: string): string {
  const manifestPath = resolve(cursorIdePluginRoot, '.cursor-plugin', 'plugin.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}`);
  }
  const raw = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { name?: string };
  if (!raw.name || typeof raw.name !== 'string') {
    throw new Error(`Invalid Cursor plugin manifest: missing "name" in ${manifestPath}`);
  }
  return raw.name;
}

function installCursorUserPlugin(
  cursorIdePluginSource: string,
  force: boolean,
): string {
  const pluginId = readCursorPluginId(cursorIdePluginSource);
  const localRoot = join(homedir(), '.cursor', 'plugins', 'local');
  const dest = join(localRoot, pluginId);

  if (existsSync(dest) && !force) {
    throw new Error(
      `Cursor user plugin already exists: ${dest}\nUse --force to replace, or remove that folder first.`,
    );
  }

  mkdirSync(localRoot, { recursive: true });
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  cpSync(cursorIdePluginSource, dest, { recursive: true });
  return dest;
}

function writeInstallOutput(output: CompiledOutput, cwd: string, force: boolean): boolean {
  const fullPath = resolve(cwd, output.filePath);
  const dir = dirname(fullPath);

  if (!force && existsSync(fullPath)) {
    return false;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, output.content);
  return true;
}

export async function runInstall(pluginPath: string, cwd: string = process.cwd(), options: InstallOptions = {}) {
  const absPluginPath = resolve(cwd, pluginPath);

  // Load plugin bundle
  console.log(chalk.dim(`Loading plugin from ${absPluginPath}...`));
  const { manifest, agents } = loadPlugin(absPluginPath);

  console.log(chalk.bold(`Plugin: ${manifest.name} v${manifest.version}`));
  console.log(chalk.dim(`  ${manifest.agents.length} agent(s), ${manifest.files.skills} skill(s), ${manifest.files.references} reference(s)`));

  // Determine platforms
  let platforms: Platform[];
  if (options.platform) {
    platforms = [options.platform];
  } else if (configExists(cwd)) {
    const config = await loadConfig(cwd);
    platforms = config.platforms;
  } else {
    platforms = manifest.platforms;
  }

  // Build a minimal config for compilers
  const config = configExists(cwd)
    ? await loadConfig(cwd)
    : {
        projectName: manifest.projectName,
        platforms,
        teams: manifest.roles,
      };

  const compilers = getAllCompilers(platforms);
  const allWrittenFiles: string[] = [];
  let totalFiles = 0;
  let skipped = 0;

  for (const compiler of compilers) {
    if (options.cursorUserPlugin && compiler.platform === 'cursor') {
      continue;
    }

    const outputs = compiler.compileWithScope(agents, config, ['all']);
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
    }

    let written = 0;
    for (const output of outputs) {
      if (writeInstallOutput(output, cwd, !!options.force)) {
        written++;
        allWrittenFiles.push(output.filePath);
        console.log(chalk.dim(`  ${output.filePath}`));
      } else {
        skipped++;
      }
    }

    console.log(chalk.green(`✓ ${compiler.platform}: ${written} file(s) installed`));
    totalFiles += written;
  }

  let cursorUserPluginPath: string | undefined;
  const cursorIdeBundle = resolve(absPluginPath, 'cursor-ide-plugin');
  const shouldInstallCursorUser =
    !!options.cursorUserPlugin &&
    (!options.platform || options.platform === 'cursor') &&
    platforms.includes('cursor');

  if (shouldInstallCursorUser) {
    if (!existsSync(cursorIdeBundle)) {
      console.log(
        chalk.red(
          `\n✗ cursor-ide-plugin/ not found under ${absPluginPath}.\n  Run: npx aigent-team generate --scope plugin`,
        ),
      );
    } else {
      try {
        cursorUserPluginPath = installCursorUserPlugin(cursorIdeBundle, !!options.force);
        console.log(chalk.green(`✓ cursor (user plugin): ${cursorUserPluginPath}`));
      } catch (e) {
        console.log(chalk.red(`\n✗ Cursor user plugin install failed: ${(e as Error).message}`));
      }
    }
  }

  // Save install record for uninstall
  const recordDir = resolve(cwd, '.aigent-team', 'installed');
  mkdirSync(recordDir, { recursive: true });

  const record: InstallRecord = {
    name: manifest.name,
    version: manifest.version,
    installedAt: new Date().toISOString(),
    pluginPath: absPluginPath,
    files: allWrittenFiles,
    ...(cursorUserPluginPath ? { cursorUserPluginPath } : {}),
  };

  writeFileSync(
    resolve(recordDir, `${manifest.name}.json`),
    JSON.stringify(record, null, 2) + '\n',
  );

  console.log(chalk.bold(`\nTotal: ${totalFiles} file(s) installed`));
  if (skipped > 0) {
    console.log(chalk.yellow(`${skipped} file(s) skipped (already exist, use --force to overwrite)`));
  }
}
