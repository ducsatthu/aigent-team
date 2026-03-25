# Contributing to aigent-team

## Development setup

```bash
git clone git@github.com:ducsatthu/aigent-team.git
cd aigent-team
npm install
npm run build
```

## Commands

```bash
npm run build          # Build with tsup → dist/
npm run dev            # Watch mode build
npm test               # Run all tests (vitest)
npm run lint           # Type-check (tsc --noEmit)

# Run a single test file
npx vitest run test/compilers/claude-code.compiler.test.ts
```

## Project structure

```
src/
├── core/
│   ├── types.ts              # All interfaces + Zod schemas
│   ├── agent-loader.ts       # Load YAML templates + references
│   ├── template-engine.ts    # Assemble skill index + references
│   └── config-loader.ts      # Load user config
├── compilers/
│   ├── base.compiler.ts      # Abstract compiler class
│   ├── claude-code.compiler.ts
│   ├── cursor.compiler.ts
│   ├── codex.compiler.ts
│   ├── antigravity.compiler.ts
│   └── index.ts              # Compiler registry
├── cli/
│   ├── init.ts               # Interactive wizard
│   ├── generate.ts           # Generate command
│   └── validate.ts           # Validate command
├── detectors/
│   └── platform-detector.ts  # Detect installed AI tools
└── index.ts                  # Public API

templates/
├── teams/
│   ├── lead/                 # Tech Lead / orchestrator
│   ├── ba/                   # Business Analyst
│   ├── fe/                   # Frontend
│   ├── be/                   # Backend
│   ├── qa/                   # QA
│   └── devops/               # DevOps / SRE
│       ├── agent.yaml        # Agent metadata
│       ├── skill.md          # Slim skill index (~80-150 lines)
│       └── references/       # Deep reference docs
│           ├── topic.md
│           └── ...
└── shared/                   # Shared knowledge (git workflow, conventions)
```

## How compilation works

```
agent.yaml + skill.md + references/*.md
        ↓
agent-loader.ts              (load + merge overrides)
template-engine.ts           (assemble skill index)
        ↓
<platform>.compiler.ts       (compile to platform format)
        ↓
Platform-specific output files
```

Each compiler extends `BaseCompiler` and implements:
- `compile(agents, config)` — returns `CompiledOutput[]` with file paths and content
- `validate(outputs)` — checks platform constraints

The `compileReferences()` helper in `BaseCompiler` generates reference file outputs for any compiler.

## Adding a new team agent

1. Create `templates/teams/<role>/agent.yaml` with metadata (id, name, role, techStack, tools, globs)
2. Create `templates/teams/<role>/skill.md` — slim skill index (~150 lines max)
3. Create `templates/teams/<role>/references/*.md` — detailed reference docs
4. Add the role to `TEAM_ROLES` in `src/core/types.ts`
5. Run `npm test` to verify

## Adding a new platform compiler

1. Create `src/compilers/<platform>.compiler.ts` extending `BaseCompiler`
2. Register it in `src/compilers/index.ts`
3. Add the platform to `PLATFORMS` in `src/core/types.ts`
4. Add tests in `test/compilers/<platform>.compiler.test.ts`

## Writing reference files

Reference files should be senior-level — the kind of knowledge that takes 5-8 years to accumulate. Guidelines:

- Lead with **decision frameworks**, not just rules (when to use X vs Y)
- Include **anti-patterns with consequences** (what goes wrong, not just "don't do this")
- Provide **concrete code examples** for non-obvious patterns
- Cover **edge cases and tradeoffs** that juniors miss
- Keep each file focused on one topic (150-400 lines typical)

## Commit conventions

Follow Conventional Commits: `type(scope): description`

```
feat(compiler): add reference file output for cursor
fix(loader): handle missing skill.md gracefully
docs: update README with new agent architecture
test(codex): add reference file generation tests
```

## Pull requests

- Keep PRs focused — one feature or fix per PR
- Update tests for any behavioral changes
- Run `npm test` and `npm run lint` before pushing
- PR description should explain **why**, not just what
