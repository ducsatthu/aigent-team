# Architecture

## Overview

aigent-team follows a **compiler architecture** — a single source of truth (YAML + Markdown templates) compiled to multiple platform-native output formats. This is analogous to how TypeScript compiles to JavaScript, or how React compiles JSX to DOM calls.

```
                          ┌──────────────────┐
                          │  Source of Truth  │
                          │  YAML + Markdown  │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
              │  Override  │ │  Override  │ │  Override  │
              │  Config    │ │  Local     │ │  Shared    │
              └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                          ┌────────▼─────────┐
                          │   Agent Loader   │
                          │   (merge all)    │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │ Template Engine   │
                          │ (assemble MD)     │
                          └────────┬─────────┘
                                   │
              ┌────────────┬───────┼───────┬────────────┐
              │            │       │       │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─▼──┐ ┌──▼───┐ ┌─────▼─────┐
        │Claude Code│ │Cursor │ │Codex│ │Anti- │ │  Future   │
        │ Compiler  │ │Compiler│ │    │ │gravity│ │ Compiler  │
        └─────┬─────┘ └───┬───┘ └─┬──┘ └──┬───┘ └─────┬─────┘
              │            │       │       │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─▼──┐ ┌──▼───┐ ┌─────▼─────┐
        │.claude/   │ │.cursor│ │AGEN│ │.agen │ │  ...      │
        │agents/    │ │/rules/│ │TS.md│ │ts/   │ │           │
        └───────────┘ └───────┘ └────┘ └──────┘ └───────────┘
```

## Core Concepts

### 1. Agent Definition

`AgentDefinition` is the central data structure. Everything flows through it:

```typescript
interface AgentDefinition {
  // Identity
  id: string;              // "fe", "be", "qa", "devops", "lead", "ba"
  name: string;            // "Frontend Agent"
  description: string;     // What this agent does
  role: TeamRole;          // Maps to template directory

  // Content (assembled from files)
  skillContent: string;    // From skill.md — slim index, always loaded
  rulesContent: string;    // From rules.md — hard constraints, always loaded (top of context)
  systemPrompt: string;    // Legacy — replaced by skillContent
  conventions: string;     // From conventions.md (legacy fallback)
  reviewChecklist: string; // From review-checklist.md (legacy fallback)

  // Configuration
  techStack: TechStackConfig;    // Languages, frameworks, libraries, build tools
  tools: ToolPermissions;        // Allowed/denied tool list
  workflows: WorkflowDefinition[]; // Step-by-step procedures
  globs: string[];               // File patterns for editor scoping

  // Knowledge
  sharedKnowledge: string[];     // Resolved markdown from shared/
  references: ReferenceFile[];   // On-demand deep knowledge docs
  skills: SkillFile[];           // On-demand executable procedures
}
```

### 2. Three-Layer Knowledge Model

Each agent has three layers of knowledge:

```
┌─────────────────────────────────────┐
│         Rules (rules.md)            │  Always loaded — TOP of context
│  ~30-50 lines                       │  Hard constraints:
│  ✓ Scope rules (what NOT to modify) │  - Scope, action, escalation limits
│  ✓ Action rules (what NOT to do)    │  - Output format constraints
│  ✓ Escalation rules (when to ask)   │
│  ✓ Output rules (quality gates)     │
├─────────────────────────────────────┤
│         Skill Index (skill.md)      │  Always loaded — after rules
│  ~80-150 lines                      │  Core principles, anti-patterns,
│  ✓ Decision frameworks              │  reference + skill catalog
│  ✓ Key anti-patterns                │
│  ✓ Reference file catalog           │
│  ✓ Executable skills catalog        │
└─────────────────────────────────────┘
                  │
                  │ reads on-demand
                  ▼
┌─────────────────────────────────────┐
│  Reference Files (references/)      │  Loaded when task requires
│  150-400 lines each                 │  Deep patterns, code examples,
│  3-9 files per agent                │  checklists
├─────────────────────────────────────┤
│  Skill Files (skills/)              │  Loaded when task requires
│  ~50-100 lines each                 │  Step-by-step procedures,
│  2+ files per agent                 │  commands, expected outputs
└─────────────────────────────────────┘
```

**Why three layers?**
- **Rules** are constraints, not knowledge — they must be prominently placed (top of context) so agents can't miss them
- **Skill index** tells the agent **what it knows** and **when to look deeper**
- **References** provide deep domain knowledge; **skills** provide executable procedures
- Keeps always-loaded context slim while providing access to thousands of lines of expertise

### 3. Merge Priority

Three sources of configuration, merged bottom-to-top:

```
Priority (highest → lowest):
┌─────────────────────────────────────┐
│  .aigent-team/teams/<role>/         │  Project-specific local overrides
│  (user's custom files)              │  Full control per project
├─────────────────────────────────────┤
│  aigent-team.config.json overrides  │  Config-level customization
│  { overrides: { fe: { ... } } }    │  Tech stack, tools, globs
├─────────────────────────────────────┤
│  templates/teams/<role>/            │  Built-in defaults
│  (shipped with package)             │  Senior-level knowledge base
└─────────────────────────────────────┘
```

### 4. Compiler Strategy Pattern

Each platform has a compiler that extends `BaseCompiler`:

```typescript
abstract class BaseCompiler {
  abstract readonly platform: Platform;
  abstract compile(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[];
  abstract validate(outputs: CompiledOutput[]): ValidationResult;

  // Shared helpers
  protected compileReferences(agent, baseDir, extension): CompiledOutput[];
  protected compileSkills(agent, baseDir, extension): CompiledOutput[];
  protected formatFrontmatter(data): string;
}
```

Adding a new platform = creating one new file:

```typescript
// src/compilers/windsurf.compiler.ts
export class WindsurfCompiler extends BaseCompiler {
  readonly platform = 'windsurf';
  compile(agents, config) { /* ... */ }
  validate(outputs) { /* ... */ }
}
```

### 5. Platform Output Mapping

Each compiler translates the same `AgentDefinition` into platform-native format:

| Platform | Skill Index | References | Skills | Metadata |
|---|---|---|---|---|
| Claude Code | `.claude/agents/{id}-agent.md` | `…/references/*.md` | `…/skills/*.md` | YAML frontmatter |
| Cursor | `.cursor/rules/{id}-agent.mdc` | `.cursor/rules/{id}-refs/*.mdc` | `.cursor/rules/{id}-skills/*.mdc` | MDC frontmatter |
| Codex | `AGENTS.md` + `.codex/agents/{id}-agent.md` | `…/references/*.md` | `…/skills/*.md` | YAML frontmatter |
| Antigravity | `.agents/skills/{id}-agent/SKILL.md` | `…/references/*.md` | `…/skills/*.md` | YAML frontmatter |

## Module Map

```
src/
├── core/                          # Domain logic (no I/O side effects)
│   ├── types.ts                   # All interfaces + Zod schemas
│   ├── agent-loader.ts            # Load templates, merge overrides
│   ├── template-engine.ts         # Assemble markdown content
│   └── config-loader.ts           # Load user config files
│
├── compilers/                     # Output generators (pure transforms)
│   ├── base.compiler.ts           # Abstract base + shared helpers
│   ├── claude-code.compiler.ts    # Claude Code output
│   ├── cursor.compiler.ts         # Cursor output
│   ├── codex.compiler.ts          # Codex output
│   ├── antigravity.compiler.ts    # Antigravity output
│   └── index.ts                   # Compiler factory
│
├── cli/                           # User-facing commands (I/O + orchestration)
│   ├── init.ts                    # Interactive setup wizard
│   ├── generate.ts                # Generate configs
│   └── validate.ts                # Validate outputs
│
├── detectors/                     # Platform auto-detection
│   └── platform-detector.ts       # Detect installed AI tools
│
└── index.ts                       # Public API exports
```

## Agent Team Architecture

```
                    ┌─────────────────┐
                    │   Lead Agent    │  Orchestrator
                    │   (Tech Lead)   │  - Task analysis & decomposition
                    └───────┬─────────┘  - Agent spawning & assignment
                            │            - Cross-team coordination
                            │            - Quality gates
          ┌─────────┬───────┼───────┬──────────┐
          ▼         ▼       ▼       ▼          ▼
       ┌─────┐  ┌─────┐ ┌─────┐ ┌──────┐  ┌───────┐
       │ BA  │  │ FE  │ │ BE  │ │  QA  │  │DevOps │
       │     │  │     │ │     │ │      │  │       │
       │Specs│  │ UI  │ │API  │ │Tests │  │Infra  │
       └─────┘  └─────┘ └─────┘ └──────┘  └───────┘
         │         │       │       │          │
         ▼         ▼       ▼       ▼          ▼
       4 refs    9 refs  9 refs  8 refs    9 refs
      2 skills  2 skills 2 skills 2 skills  2 skills
```

### Agent Responsibilities

| Agent | Role | Unique Capability |
|---|---|---|
| **Lead** | Orchestrator | Spawns agents, coordinates cross-team work, enforces quality gates |
| **BA** | Business Analyst | Translates requirements → specs, acceptance criteria, API contracts |
| **FE** | Frontend | Components, state, a11y, perf, security — React/Vue/Angular/Svelte |
| **BE** | Backend | APIs, database, auth, caching, async — NestJS/Express/FastAPI/Spring |
| **QA** | QA Engineer | Test strategy, E2E automation, contract testing, performance testing |
| **DevOps** | DevOps / SRE | IaC, Docker, K8s, CI/CD, monitoring, disaster recovery |

### Orchestration Flow (Feature Implementation)

```
User Request: "Add user registration"
        │
        ▼
┌───────────────┐
│  Lead Agent   │ Analyzes requirement
│               │ Identifies teams: BA, FE, BE, QA
└───────┬───────┘
        │
        ├──→ BA Agent → User stories + acceptance criteria + API contract
        │
        ├──→ FE Agent → Registration form + validation + UI states
        │    (reads BA's API contract for request/response shapes)
        │
        ├──→ BE Agent → /api/v1/auth/register endpoint + DB migration
        │    (reads BA's API contract for implementation)
        │
        ├──→ QA Agent → E2E tests + integration tests + edge cases
        │    (reads BA's acceptance criteria for test scenarios)
        │
        └──→ Lead Agent → Reviews all outputs, ensures consistency
```

## Data Flow

```
                    aigent-team.config.json
                            │
                            ▼
                    ┌───────────────┐
                    │ config-loader │ Zod validation
                    └───────┬───────┘
                            │ AigentTeamConfig
                            ▼
templates/teams/    ┌───────────────┐    .aigent-team/
    agent.yaml ───→ │ agent-loader  │ ←── local overrides
    rules.md ─────→ │               │     (rules.md, skill.md,
    skill.md ─────→ │  deepmerge    │      references/, skills/)
    references/ ──→ │               │
    skills/ ──────→ │               │
templates/shared/ → │               │
                    └───────┬───────┘
                            │ AgentDefinition[]
                            ▼
                    ┌───────────────┐
                    │template-engine│ assembleSkillIndex()
                    └───────┬───────┘
                            │ string (markdown)
                            ▼
                    ┌───────────────┐
                    │   compilers   │ platform-specific transform
                    └───────┬───────┘
                            │ CompiledOutput[]
                            ▼
                    ┌───────────────┐
                    │  file system  │ write with strategy
                    └───────────────┘
```

## File Writing Strategies

| Strategy | Behavior | Used For |
|---|---|---|
| `replace` | Always overwrite | Agent files, references, skills (regenerated content) |
| `skip-if-exists` | Don't touch if present | CLAUDE.md (user may have customized) |
| `merge` | Append if not present | Shared sections in combined files |

## Validation Pipeline

Each compiler validates its own output:

```
Compile → CompiledOutput[] → Validate → Write (if valid)
                                │
                                ├── Claude Code: warn if >300 lines
                                ├── Cursor: require .mdc extension + frontmatter
                                ├── Codex: require AGENTS.md
                                └── Antigravity: SKILL.md name = directory name
```

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Language | TypeScript (strict mode) | Type safety, IDE support |
| Module | ESM (ES2022) | Modern module system |
| CLI | Commander.js | Standard CLI framework |
| Prompts | Inquirer | Interactive terminal UI |
| Validation | Zod | Runtime schema validation |
| Build | tsup | Fast, zero-config bundler |
| Test | Vitest | Fast, ESM-native test runner |
| Merge | deepmerge-ts | Type-safe deep object merging |
| YAML | gray-matter + yaml | Frontmatter parsing + YAML stringify |
