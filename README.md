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

Each agent has three layers of knowledge:
- **Rules** (~30-50 lines) — always loaded, top of context. Hard constraints: scope limits, prohibited actions, escalation triggers, output requirements.
- **Skill index** (~80-150 lines) — always loaded. Core principles, anti-patterns, decision frameworks, reference + skill catalogs.
- **Reference files** (3-9 per agent) + **Skill files** (2+ per agent) — loaded on-demand when the task requires deep knowledge or executable procedures.

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
.claude/agents/fe-agent.md               # Rules + skill index (always loaded)
.claude/agents/fe-agent/references/       # Deep reference docs
  ├── component-architecture.md
  ├── state-management.md
  └── ...
.claude/agents/fe-agent/skills/           # Executable procedures
  ├── analyze-bundle.md
  └── component-audit.md
CLAUDE.md                                 # Agent team overview

# Cursor
.cursor/rules/fe-agent.mdc               # Glob-scoped skill (includes rules)
.cursor/rules/fe-refs/                    # Glob-scoped references
.cursor/rules/fe-skills/                  # Glob-scoped skills

# Codex
AGENTS.md                                 # Combined agent doc
.codex/agents/fe-agent.md                 # Individual agent
.codex/agents/fe-agent/references/        # References
.codex/agents/fe-agent/skills/            # Skills

# Antigravity
GEMINI.md                                 # Agent overview
.agents/skills/fe-agent/SKILL.md          # Skill file
.agents/skills/fe-agent/references/       # References
.agents/skills/fe-agent/skills/           # Skills
```

## How agents are loaded by each platform

After `aigent-team generate`, the files are placed in each platform's expected directories. Here's how each AI tool discovers and uses them:

### Claude Code

Files in `.claude/agents/` are **automatically available** as specialized agents. Claude Code discovers them on startup.

**How to use:**
```
# In Claude Code, just ask — it will pick the right agent based on the task
> Review this React component for accessibility issues
  → Claude spawns fe-agent, which reads references/accessibility.md

# Or explicitly request an agent
> Use the fe-agent to review my frontend code
> Ask the qa-agent to write E2E tests for this feature

# The Lead agent can orchestrate multiple agents
> Implement the user registration feature
  → Lead analyzes → spawns BA (specs) → FE + BE (code) → QA (tests)
```

`CLAUDE.md` is loaded as project context automatically — it tells Claude which agents are available.

### Cursor

Files in `.cursor/rules/` are **loaded automatically** based on frontmatter settings:
- `alwaysApply: true` → always active (Lead, BA agents)
- `globs: "**/*.tsx, **/*.ts"` → activated when you open matching files

**How it works:** When you open a `.tsx` file, Cursor loads `fe-agent.mdc` automatically. The agent's knowledge applies to Cursor's suggestions, completions, and chat responses. Reference files in `fe-refs/` are also glob-scoped and loaded when relevant.

No manual action needed — just open files and use Cursor as normal.

### Codex (OpenAI)

`AGENTS.md` is **read automatically** as the project instruction file. Individual agents in `.codex/agents/` are available as subagents.

**How to use:**
```
# Codex reads AGENTS.md on startup for project context
# Use subagents in conversations:
> @fe-agent review this component
> @devops-agent check my Dockerfile
```

### Antigravity (Google)

`GEMINI.md` is loaded as project context. Skills in `.agents/skills/` are **auto-discovered**.

**How to use:**
```
# Antigravity loads skills from .agents/skills/ automatically
# Reference the skill by name:
> Use the fe-agent skill to review this code
> Run the qa-agent skill to generate tests
```

### Reference files — on-demand loading

Reference files are **not** loaded into context by default (that would bloat the context window). Instead:

1. The **skill index** (always loaded) contains a table of available references
2. When the agent encounters a relevant task, it **reads the reference file** on-demand
3. Example: FE agent working on forms → reads `references/forms.md` for validation patterns

This is why the skill index includes a "When to read" table:

```markdown
| Reference | When to read |
|-----------|-------------|
| component-architecture.md | Creating or reviewing components |
| state-management.md | Choosing state solution |
| performance.md | Optimizing or auditing performance |
```

The agent decides which references to load based on the task — you don't need to do anything manually.

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

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System design, data flow, module map, compiler pattern |
| [Agent Reference](docs/agents.md) | All 6 agents — roles, capabilities, reference file catalog |
| [Vision & Roadmap](docs/vision.md) | Future plans, design principles, platform expansion |
| [Contributing](CONTRIBUTING.md) | Development setup, how to add agents/compilers |
| [Changelog](CHANGELOG.md) | Release history |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

Issues and PRs welcome at [github.com/ducsatthu/aigent-team](https://github.com/ducsatthu/aigent-team).

## Author

**Đức Trần Xuân** ([@ducsatthu](https://github.com/ducsatthu)) — ductranxuan.29710@gmail.com

## License

[MIT](LICENSE)
