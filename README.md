# aigent-team

[![npm version](https://img.shields.io/npm/v/aigent-team)](https://www.npmjs.com/package/aigent-team)
[![license](https://img.shields.io/npm/l/aigent-team)](LICENSE)
[![node](https://img.shields.io/node/v/aigent-team)](package.json)

One config, six AI agents, four platforms. Generate senior-level AI coding agent configurations from a single source of truth.

```
aigent-team generate
```

> Requires **Node.js >= 18**

## What it does

aigent-team compiles YAML+Markdown templates into platform-native agent configs for:

| Platform | Output format |
|---|---|
| **Claude Code** | `.claude/agents/*.md` with YAML frontmatter |
| **Cursor** | `.cursor/rules/*.mdc` with MDC frontmatter + globs |
| **Codex** | `AGENTS.md` + `.codex/agents/*.md` |
| **Antigravity** | `GEMINI.md` + `.agents/skills/*/SKILL.md` |

Each agent is a senior-level specialist (8+ years expertise) with deep knowledge baked into reference files:

| Agent | Role | Reference topics |
|---|---|---|
| **Lead** | Tech Lead / PM orchestrator | Task decomposition, cross-team coordination, quality gates |
| **BA** | Business Analyst | Requirements analysis, acceptance criteria, API contracts, story mapping |
| **FE** | Frontend Engineer | Components, state, performance, a11y, security, CSS, forms, testing |
| **BE** | Backend Engineer | API design, database, auth, error handling, observability, caching, async |
| **QA** | QA Engineer | Test strategy, E2E, test data, mocking, perf testing, security testing, CI |
| **DevOps** | DevOps / SRE | IaC, Docker, K8s, CI/CD, monitoring, security, DR, cost optimization |

## Architecture

```
                    ┌─────────────────┐
                    │   Lead Agent    │  orchestrator
                    │   (Tech Lead)   │
                    └───────┬─────────┘
                            │ spawn & assign
          ┌─────────┬───────┼───────┬──────────┐
          ▼         ▼       ▼       ▼          ▼
       ┌─────┐  ┌─────┐ ┌─────┐ ┌──────┐  ┌───────┐
       │ BA  │  │ FE  │ │ BE  │ │  QA  │  │DevOps │
       └─────┘  └─────┘ └─────┘ └──────┘  └───────┘
```

Each agent has:
- **Skill index** (~80-150 lines) — always loaded in context. Core principles, anti-patterns, decision frameworks.
- **Reference files** (3-9 per agent) — loaded on-demand when the task requires deep knowledge.

This keeps the always-loaded context slim while providing access to thousands of lines of senior expertise when needed.

## Quick start

### Install

```bash
npm install -D aigent-team
```

Or use directly:

```bash
npx aigent-team init
```

### Initialize

```bash
npx aigent-team init
```

Interactive wizard that:
1. Detects which AI tools you have installed (Claude Code, Cursor, Codex, Antigravity)
2. Lets you pick which team agents to enable
3. Creates `aigent-team.config.json`

### Generate

```bash
npx aigent-team generate
```

Generates agent configs for all configured platforms. Run this after changing your config or updating aigent-team.

### Validate

```bash
npx aigent-team validate
```

Checks generated files against each platform's constraints (file size, frontmatter format, naming).

## Configuration

Create `aigent-team.config.json` (or `.ts` / `.js`) in your project root:

```json
{
  "projectName": "my-app",
  "platforms": ["claude-code", "cursor"],
  "teams": ["lead", "fe", "be", "qa"],
  "overrides": {
    "fe": {
      "techStack": {
        "frameworks": ["Next.js 15", "React 19"],
        "libraries": ["Tailwind CSS 4", "Zustand", "TanStack Query"]
      }
    },
    "be": {
      "techStack": {
        "frameworks": ["NestJS", "Prisma"],
        "libraries": ["PostgreSQL", "Redis", "BullMQ"]
      }
    }
  }
}
```

### Config options

| Field | Type | Required | Description |
|---|---|---|---|
| `projectName` | `string` | Yes | Your project name |
| `platforms` | `string[]` | Yes | Target platforms: `claude-code`, `cursor`, `codex`, `antigravity` |
| `teams` | `string[]` | Yes | Agent teams to enable: `lead`, `ba`, `fe`, `be`, `qa`, `devops` |
| `overrides` | `object` | No | Per-team overrides for `techStack`, `tools`, `globs` |
| `overrides.<team>.techStack` | `object` | No | Override `languages`, `frameworks`, `libraries`, `buildTools` |

### Programmatic config

```typescript
// aigent-team.config.ts
import { defineConfig } from 'aigent-team';

export default defineConfig({
  projectName: 'my-app',
  platforms: ['claude-code', 'cursor'],
  teams: ['lead', 'fe', 'be', 'qa'],
  overrides: {
    fe: {
      techStack: {
        frameworks: ['Next.js 15'],
      },
    },
  },
});
```

### Platform-specific flags

```bash
# Generate only for a specific platform
npx aigent-team generate --platform claude-code
```

## Generated output

After running `aigent-team generate`, you'll see:

```
# Claude Code
.claude/agents/lead-agent.md              # Skill index (always loaded)
.claude/agents/lead-agent/references/     # Deep reference docs
.claude/agents/fe-agent.md
.claude/agents/fe-agent/references/
  ├── component-architecture.md
  ├── state-management.md
  ├── performance.md
  ├── accessibility.md
  ├── security.md
  ├── testing.md
  ├── css-styling.md
  ├── forms.md
  └── review-checklist.md
...
CLAUDE.md                                 # Agent team overview

# Cursor
.cursor/rules/fe-agent.mdc               # Glob-scoped skill
.cursor/rules/fe-refs/                    # Glob-scoped references
...

# Codex
AGENTS.md                                 # Combined agent doc
.codex/agents/fe-agent.md                 # Individual agent
.codex/agents/fe-agent/references/        # References
...

# Antigravity
GEMINI.md                                 # Agent overview
.agents/skills/fe-agent/SKILL.md          # Skill file
.agents/skills/fe-agent/references/       # References
...
```

## What to commit

Generated files **should be committed** to your repo — they are the actual agent configs your AI tools read. Add this to your workflow:

```bash
npx aigent-team generate
git add .claude/ .cursor/ .codex/ .agents/ CLAUDE.md AGENTS.md GEMINI.md
git commit -m "chore: regenerate agent configs"
```

Only `.aigent-team/` (local overrides) and `aigent-team.config.json` are your source files. Everything else is generated output.

## Local overrides

Create a `.aigent-team/` directory in your project to override any template locally:

```
.aigent-team/
├── teams/
│   └── fe/
│       └── references/
│           └── component-architecture.md   # Your custom version
└── shared/
    └── git-workflow.md                     # Your git workflow
```

Local overrides take priority over built-in templates. This lets you customize agent knowledge for your specific project without forking.

## How the Lead agent works

The Lead agent acts as orchestrator. When it receives a task, it:

1. **Analyzes** the requirement — identifies which teams are involved
2. **Spawns** the right team agents (BA for specs, FE/BE for implementation, QA for tests)
3. **Coordinates** cross-team work (e.g., FE+BE align on API contract via BA specs)
4. **Reviews** output quality before delivery

This mirrors how a real tech lead operates — delegating to specialists and ensuring alignment.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

Issues and PRs welcome at [github.com/ducsatthu/aigent-team](https://github.com/ducsatthu/aigent-team).

## Author

**Đức Trần Xuân** ([@ducsatthu](https://github.com/ducsatthu)) — ductranxuan.29710@gmail.com

## License

[MIT](LICENSE)
