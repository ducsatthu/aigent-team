import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Platform } from '../core/types.js';

interface DetectionResult {
  platform: Platform;
  detected: boolean;
  reason: string;
}

function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function detectPlatforms(cwd: string = process.cwd()): DetectionResult[] {
  const results: DetectionResult[] = [];

  // Claude Code
  const claudeDir = existsSync(resolve(cwd, '.claude'));
  const claudeCli = commandExists('claude');
  results.push({
    platform: 'claude-code',
    detected: claudeDir || claudeCli,
    reason: claudeDir ? '.claude/ directory found' : claudeCli ? 'claude CLI found' : 'not detected',
  });

  // Cursor
  const cursorDir = existsSync(resolve(cwd, '.cursor'));
  const cursorCli = commandExists('cursor');
  results.push({
    platform: 'cursor',
    detected: cursorDir || cursorCli,
    reason: cursorDir ? '.cursor/ directory found' : cursorCli ? 'cursor CLI found' : 'not detected',
  });

  // Codex
  const codexDir = existsSync(resolve(cwd, '.codex'));
  const codexCli = commandExists('codex');
  results.push({
    platform: 'codex',
    detected: codexDir || codexCli,
    reason: codexDir ? '.codex/ directory found' : codexCli ? 'codex CLI found' : 'not detected',
  });

  // Antigravity
  const antigravityDir = existsSync(resolve(cwd, '.agents'));
  const geminiMd = existsSync(resolve(cwd, 'GEMINI.md'));
  const antigravityCli = commandExists('antigravity');
  results.push({
    platform: 'antigravity',
    detected: antigravityDir || geminiMd || antigravityCli,
    reason: antigravityDir
      ? '.agents/ directory found'
      : geminiMd
        ? 'GEMINI.md found'
        : antigravityCli
          ? 'antigravity CLI found'
          : 'not detected',
  });

  return results;
}

export function getDetectedPlatforms(cwd?: string): Platform[] {
  return detectPlatforms(cwd)
    .filter((r) => r.detected)
    .map((r) => r.platform);
}
