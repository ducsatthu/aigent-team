# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is aigent-team

A cross-platform CLI tool that generates AI agent configurations for 6 team roles (Lead, BA, FE, BE, QA, DevOps) across 4 AI coding platforms (Claude Code, Cursor, Codex, Antigravity). Single source of truth in YAML+Markdown templates, compiled to each platform's native config format.

## Commands

```bash
npm run build        # Build with tsup → dist/
npm run dev          # Watch mode build
npm test             # Run all tests (vitest)
npm run lint         # Type-check only (tsc --noEmit)
npx vitest run test/compilers/claude-code.compiler.test.ts  # Run single test file
```

## Architecture

```
templates/teams/<role>/
├── agent.yaml          (metadata: id, role, techStack, tools, globs)
├── skill.md            (slim skill index, ~80-150 lines, always loaded)
└── references/*.md     (deep reference docs, loaded on-demand)
        ↓
src/core/agent-loader.ts                   (load + merge overrides)
src/core/template-engine.ts                (assembleSkillIndex / assembleReference)
        ↓
src/compilers/<platform>.compiler.ts       (compile to platform format)
        ↓
Skill index files + reference files per platform
```

### Key Modules

- **`src/core/types.ts`** — All TypeScript interfaces + Zod schemas. `AgentDefinition` is the central type. `ReferenceFile` for on-demand docs.
- **`src/core/agent-loader.ts`** — Loads YAML templates, skill.md, references/ directory, applies config overrides. Merge priority: `.aigent-team/` local > config overrides > built-in templates.
- **`src/core/template-engine.ts`** — `assembleSkillIndex(agent)` returns slim skill content. `assembleReference(ref)` returns reference file content. Legacy `assembleAgentMarkdown(agent)` as fallback.
- **`src/compilers/base.compiler.ts`** — Abstract class with `compile()`, `validate()`, `compileReferences()` methods. All 4 platform compilers extend this.
- **`src/compilers/index.ts`** — Compiler registry/factory: `getCompiler(platform)` and `getAllCompilers(platforms)`.
- **`bin/cli.ts`** — CLI entry point (commander). Commands: `init`, `generate`, `validate`.

### Platform Compiler Outputs

| Compiler | Skill Index | References |
|---|---|---|
| `claude-code` | `.claude/agents/<team>-agent.md` | `.claude/agents/<team>-agent/references/*.md` |
| `cursor` | `.cursor/rules/<team>-agent.mdc` | `.cursor/rules/<team>-refs/*.mdc` |
| `codex` | `AGENTS.md` + `.codex/agents/<team>-agent.md` | `.codex/agents/<team>-agent/references/*.md` |
| `antigravity` | `.agents/skills/<team>-agent/SKILL.md` | `.agents/skills/<team>-agent/references/*.md` |

### Agent Template Structure

Each team in `templates/teams/<role>/` has:
- `agent.yaml` — id, name, role, techStack, tools, globs, sharedKnowledge refs
- `skill.md` — Slim skill index (~80-150 lines): core principles, anti-patterns, decision frameworks, reference file catalog
- `references/*.md` — Deep reference docs (150-400 lines each): detailed patterns, code examples, checklists

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
