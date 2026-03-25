import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ConfigSchema, type AigentTeamConfig } from './types.js';

const CONFIG_FILES = [
  'aigent-team.config.ts',
  'aigent-team.config.js',
  'aigent-team.config.json',
];

export async function loadConfig(cwd: string = process.cwd()): Promise<AigentTeamConfig> {
  for (const file of CONFIG_FILES) {
    const filePath = resolve(cwd, file);
    if (!existsSync(filePath)) continue;

    if (file.endsWith('.json')) {
      const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
      return ConfigSchema.parse(raw);
    }

    // For .ts/.js files, try dynamic import
    const mod = await import(pathToFileURL(filePath).href);
    const config = mod.default ?? mod;
    return ConfigSchema.parse(config);
  }

  throw new Error(
    `No aigent-team config found. Run \`aigent-team init\` to create one.`
  );
}

export function configExists(cwd: string = process.cwd()): boolean {
  return CONFIG_FILES.some((f) => existsSync(resolve(cwd, f)));
}
