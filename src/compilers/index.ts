import type { Platform } from '../core/types.js';
import { BaseCompiler } from './base.compiler.js';
import { ClaudeCodeCompiler } from './claude-code.compiler.js';
import { CursorCompiler } from './cursor.compiler.js';
import { CodexCompiler } from './codex.compiler.js';
import { AntigravityCompiler } from './antigravity.compiler.js';

const compilers: Record<Platform, () => BaseCompiler> = {
  'claude-code': () => new ClaudeCodeCompiler(),
  cursor: () => new CursorCompiler(),
  codex: () => new CodexCompiler(),
  antigravity: () => new AntigravityCompiler(),
};

export function getCompiler(platform: Platform): BaseCompiler {
  return compilers[platform]();
}

export function getAllCompilers(platforms: Platform[]): BaseCompiler[] {
  return platforms.map((p) => compilers[p]());
}
