# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is aigent-team

A cross-platform CLI tool that generates AI agent configurations for 6 team roles (Lead, BA, FE, BE, QA, DevOps) across 4 AI coding platforms (Claude Code, Cursor, Codex, Antigravity). Single source of truth in YAML+Markdown templates, compiled to each platform's native config format.

## Commands

```bash
npm run build        # Build with tsup → dist/ (ESM, two entry points: index + cli)
npm run dev          # Watch mode build
npm test             # Run all tests (vitest)
npm run test:watch   # Run tests in watch mode
npm run lint         # Type-check only (tsc --noEmit)
npx vitest run test/compilers/claude-code.compiler.test.ts  # Run single test file
```

## Important Conventions

- **ESM-only** — `"type": "module"` in package.json. All internal imports use `.js` extensions (e.g., `import { ... } from './types.js'`).
- **Config resolution order** — config-loader tries `aigent-team.config.ts` → `.js` → `.json` (first found wins).
- **Node >= 18 required** — target set in tsup config and `engines` field.

## Architecture

```
templates/teams/<role>/
├── agent.yaml          (metadata: id, role, techStack, tools, globs)
├── rules.md            (hard constraints, ~30-50 lines, always loaded first)
├── skill.md            (slim skill index, ~80-150 lines, always loaded)
├── references/*.md     (deep reference docs, loaded on-demand)
└── skills/*.md         (executable procedures, loaded on-demand)
        ↓
src/core/agent-loader.ts                   (load + merge overrides)
src/core/template-engine.ts                (assembleSkillIndex / assembleReference / assembleSkill)
        ↓
src/compilers/<platform>.compiler.ts       (compile to platform format)
        ↓
Skill index files + reference files + skill files per platform
```

### Key Modules

- **`src/core/types.ts`** — All TypeScript interfaces + Zod schemas. `AgentDefinition` is the central type. `ReferenceFile` for on-demand docs. `SkillFile` for executable procedures.
- **`src/core/agent-loader.ts`** — Loads YAML templates, rules.md, skill.md, references/, skills/ directories, applies config overrides. Merge priority: `.aigent-team/` local > config overrides > built-in templates.
- **`src/core/template-engine.ts`** — `assembleSkillIndex(agent)` returns rules + skill content + skills catalog. `assembleReference(ref)` / `assembleSkill(skill)` for on-demand files. Legacy `assembleAgentMarkdown(agent)` as fallback.
- **`src/compilers/base.compiler.ts`** — Abstract class with `compile()`, `validate()`, `compileReferences()`, `compileSkills()` methods. All 4 platform compilers extend this.
- **`src/compilers/index.ts`** — Compiler registry/factory: `getCompiler(platform)` and `getAllCompilers(platforms)`.
- **`src/core/config-loader.ts`** — Loads user config (`.ts`/`.js`/`.json`), validates with Zod. Also exports `configExists()` check.
- **`src/detectors/platform-detector.ts`** — Detects which AI tools are installed on the user's machine (used by `init` wizard).
- **`src/cli/`** — CLI commands (`init.ts`, `generate.ts`, `validate.ts`). Entry point is `bin/cli.ts` (commander).

### Test Structure

Tests live in `test/` mirroring `src/` structure. One test file per compiler (`test/compilers/<platform>.compiler.test.ts`) plus `test/core/template-engine.test.ts`. No test for agent-loader or config-loader yet.

### Platform Compiler Outputs

| Compiler | Skill Index (includes rules) | References | Skills |
|---|---|---|---|
| `claude-code` | `.claude/agents/<team>-agent.md` | `…/references/*.md` | `…/skills/*.md` |
| `cursor` | `.cursor/rules/<team>-agent.mdc` | `…/<team>-refs/*.mdc` | `…/<team>-skills/*.mdc` |
| `codex` | `AGENTS.md` + `.codex/agents/<team>-agent.md` | `…/references/*.md` | `…/skills/*.md` |
| `antigravity` | `.agents/skills/<team>-agent/SKILL.md` | `…/references/*.md` | `…/skills/*.md` |

### Agent Template Structure

Each team in `templates/teams/<role>/` has:
- `agent.yaml` — id, name, role, techStack, tools, globs, sharedKnowledge refs
- `rules.md` — Hard constraints (~30-50 lines): scope limits, prohibited actions, escalation triggers, output rules
- `skill.md` — Slim skill index (~80-150 lines): core principles, anti-patterns, decision frameworks, reference + skill catalog
- `references/*.md` — Deep reference docs (150-400 lines each): detailed patterns, code examples, checklists
- `skills/*.md` — Executable procedures (~50-100 lines each): step-by-step instructions with commands and expected outputs

Shared knowledge in `templates/shared/` is referenced by key from agent YAML `sharedKnowledge` array.

### Agent Roles

- **Lead** — Orchestrator: task analysis, agent spawning, cross-team coordination, quality gates
- **BA** — Requirements analysis, acceptance criteria (Given/When/Then), API contracts, story mapping
- **FE** — Components, state management, performance, accessibility, security, CSS, forms, testing
- **BE** — API design, database, auth/security, error handling, observability, caching, async processing
- **QA** — Test strategy, E2E automation, test data, mocking, performance testing, security testing, CI
- **DevOps** — IaC, Docker, Kubernetes, CI/CD, monitoring, security, disaster recovery, cost optimization

## User Config

Projects configure via `aigent-team.config.json` (or `.ts`/`.js`):
```json
{
  "projectName": "my-app",
  "platforms": ["claude-code", "cursor"],
  "teams": ["lead", "fe", "be", "qa"],
  "overrides": { "fe": { "techStack": { "frameworks": ["Next.js 15"] } } }
}
```

Validated by Zod schema `ConfigSchema` in `src/core/types.ts`.
