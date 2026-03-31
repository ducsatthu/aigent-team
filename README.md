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

Each agent has a 9-layer content architecture (L0–L8):

| Layer | Content | Loading |
|-------|---------|---------|
| **L0** Use Case | Agent identity + role description | Always |
| **L1** Metadata | Frontmatter: name, trigger, tags, whenToRead | Always (catalog) |
| **L2** Core Skill | Rules (~30-50 lines) + skill index (~80-150 lines) | Always |
| **L3** References | Deep reference docs (3-9 per agent) | On-demand |
| **L4** Examples | Few-shot examples for output quality | On-demand |
| **L5** Scripts | Automation and validation scripts | On-demand |
| **L6** Assets | Templates, report formats, checklists | On-demand |
| **L7** Output Contracts | Self-validation rubrics | On-demand |
| **L8** Governance | Version, owner, review status (manifest only) | Never (audit) |

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

> **Note:** `init` only creates the config file. Run `aigent-team generate` to generate platform configs.

### Generate

```bash
npx aigent-team generate
```

When run without flags, an interactive wizard lets you choose:
- **Generate mode**: Platform configs or Plugin bundle
- **Scopes**: Agents, Skills, References, Examples, Output Contracts, Scripts, Assets
- **Team agents**: which roles to generate
- **Target platforms**: which platforms to generate for

You can also pass flags to skip the wizard:

#### Scope filtering

Generate only specific output types:

```bash
# Only agent skill index files (no references or skills)
npx aigent-team generate --scope agents

# Only executable skill files
npx aigent-team generate --scope skills

# Only reference docs
npx aigent-team generate --scope references

# Combine scopes
npx aigent-team generate --scope agents,skills
```

#### Team filtering

Override the config's `teams` array from the CLI:

```bash
# Generate only for FE and BE agents
npx aigent-team generate --team fe,be

# Combine with scope: only skills for QA
npx aigent-team generate --scope skills --team qa
```

### Plugin system

Create a self-contained plugin bundle:

```bash
# Generate plugin bundle
npx aigent-team generate --scope plugin

# Or select "Plugin bundle" in the interactive wizard
npx aigent-team generate
```

This creates a `.aigent-team-plugin/` directory (configurable via `output.pluginDir`) with self-contained per-platform bundles:

```
.aigent-team-plugin/
├── manifest.json              # Metadata: version, roles, platforms, agent info
├── claude-code-plugin/        # Self-contained Claude Code bundle
│   ├── rules/                 # Hub file (CLAUDE.md)
│   ├── agents/                # Agent skill indexes
│   ├── skills/{agent}/        # Executable skill files
│   └── kb/                    # References + shared knowledge
│       ├── {agent}/           # Per-agent reference docs
│       └── shared/            # Shared knowledge files
├── cursor-ide-plugin/         # Self-contained Cursor bundle
│   ├── .cursor-plugin/        # Plugin manifest
│   ├── rules/                 # Shared conventions
│   ├── agents/                # Agent .mdc files
│   ├── skills/                # Skill files
│   └── kb/                    # References
└── ...                        # Other platform bundles
```

Each platform bundle is fully self-contained — all agents, skills, references, and shared knowledge are inside. Users can distribute or install any bundle independently.

Install a plugin into a project:

```bash
# Install plugin — converts to platform-native formats
npx aigent-team install ./path/to/plugin

# Install for specific platform only
npx aigent-team install ./plugin --platform cursor

# Overwrite existing files
npx aigent-team install ./plugin --force

# Uninstall — removes all files installed by the plugin
npx aigent-team uninstall my-plugin-name
```

### Validate

```bash
npx aigent-team validate
```

Checks generated files against each platform's constraints (file size, frontmatter format, naming).

### Audit

```bash
npx aigent-team audit
```

Reports skill governance status across all agents:
- **Status breakdown**: active, draft, review-needed, deprecated
- **Errors**: deprecated skills (exits with code 1 for CI integration)
- **Warnings**: skills needing review, missing governance metadata
- **Info**: draft skills, missing version/owner

Skills opt into governance via frontmatter:

```yaml
---
name: Analyze Bundle Size
governance:
  version: "1.0.0"
  owner: fe-team
  status: active
  lastReviewedAt: "2025-03-15"
---
```

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
| `output.pluginDir` | `string` | No | Plugin output directory (default: `.aigent-team-plugin/`) |

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

### CLI flags

```bash
npx aigent-team generate --platform claude-code    # Single platform
npx aigent-team generate --scope skills            # Only skill files
npx aigent-team generate --team fe,be              # Only FE + BE agents
npx aigent-team generate --scope plugin            # Plugin bundle
npx aigent-team generate --scope examples,scripts  # Only examples + scripts
npx aigent-team install ./plugin --force           # Install plugin
npx aigent-team uninstall my-app                   # Remove plugin
npx aigent-team audit                              # Governance audit
```

## Generated output

After running `aigent-team generate`, you'll see:

```
# Claude Code
.claude/agents/fe-agent.md               # Rules + skill index (always loaded)
.claude/agents/fe-agent/references/       # Deep reference docs (L3)
  ├── component-architecture.md
  ├── state-management.md
  └── ...
.claude/agents/fe-agent/skills/           # Executable procedures (L2)
  ├── analyze-bundle.md
  └── component-audit.md
.claude/agents/fe-agent/examples/         # Few-shot examples (L4)
.claude/agents/fe-agent/contracts/        # Output contracts (L7)
.claude/agents/fe-agent/scripts/          # Automation scripts (L5)
.claude/agents/fe-agent/assets/           # Templates & resources (L6)
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
| [Docs Index](docs/INDEX.md) | Entry point for all documentation, version history, RFC tracker |
| [Architecture](docs/base/architecture.md) | System design, data flow, module map, compiler pattern |
| [Agent Reference](docs/base/agents.md) | All 6 agents — roles, capabilities, reference file catalog |
| [Vision & Roadmap](docs/base/vision.md) | Future plans, design principles, platform expansion |
| [RFC-001: Scope & Plugin](docs/rfcs/rfc-001-generate-scope.md) | `--scope`, `--team`, plugin system design |
| [RFC-002: Content Layers](docs/rfcs/rfc-002-skill-content-layers.md) | 9-layer architecture (L0–L8), frontmatter, governance |
| [Contributing](CONTRIBUTING.md) | Development setup, how to add agents/compilers |
| [Changelog](CHANGELOG.md) | Release history |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

Issues and PRs welcome at [github.com/ducsatthu/aigent-team](https://github.com/ducsatthu/aigent-team).

## Author

**Đức Trần Xuân** ([@ducsatthu](https://github.com/ducsatthu)) — ductranxuan.29710@gmail.com

## License

[MIT](LICENSE)
