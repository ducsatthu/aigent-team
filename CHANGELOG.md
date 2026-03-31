# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.4.0] - 2026-03-31

### Added

- **9-Layer Skill Content Architecture (L0–L8)** — Structured content management across all agent templates:

  - **L0 Use Case / L1 Metadata / L2 Core Skill / L3 References (Phase 1 — Frontmatter Infrastructure)**
    - YAML frontmatter parsing with `gray-matter` for all markdown files (skills, references, examples, contracts, scripts, assets)
    - Skills now have `name`, `description`, `trigger`, `useCases`, `tags` populated from frontmatter
    - References now have `title`, `description`, `whenToRead`, `tags` populated from frontmatter
    - Skill catalog table in agent index shows `trigger` column when available
    - Reference catalog table shows `whenToRead` for on-demand loading guidance
    - All 12 built-in skills and 42 references enriched with frontmatter metadata
    - Backward compatible — files without frontmatter still work

  - **L4 Examples (Phase 2)**
    - `ExampleFile` type — few-shot examples for AI output quality
    - `examples/` directory per agent with frontmatter: `name`, `description`, `skillRef`, `tags`
    - Examples catalog table in agent skill index
    - Proof-of-concept: BA acceptance criteria example, FE component audit example
    - All 4 platform compilers + plugin bundles support examples

  - **L5 Scripts (Phase 3)**
    - `ScriptFile` type with `language` field (auto-inferred from extension: `.sh`→bash, `.py`→python, `.js`→javascript, `.ts`→typescript)
    - `scripts/` directory per agent, scanning `*.{md,sh,py,js,ts}`
    - Scripts catalog table in agent skill index
    - Proof-of-concept: DevOps health-check script

  - **L6 Assets (Phase 3)**
    - `AssetFile` type with `format` field (auto-inferred: `.md`→markdown, `.json`→json, `.yaml`→yaml, `.html`→html)
    - `assets/` directory per agent, scanning `*.{md,json,yaml,yml,html}`
    - Assets catalog table in agent skill index
    - Proof-of-concept: BA story template, QA test report template

  - **L7 Output Contracts (Phase 2)**
    - `OutputContract` type — self-validation rubrics and checklists
    - `output-contracts/` directory per agent with frontmatter: `name`, `description`, `skillRef`, `format`, `tags`
    - Output contracts catalog table in agent skill index
    - Proof-of-concept: BA user story rubric, QA test plan rubric

  - **L8 Governance (Phase 4)**
    - `GovernanceMetadata` — `version`, `owner`, `status` (`draft`/`active`/`review-needed`/`deprecated`), `lastReviewedAt`, `deprecatedReason`
    - Governance parsed from skill frontmatter, **excluded from AI output** (manifest/audit only)
    - Governance entries included in plugin `manifest.json`
    - Proof-of-concept governance on 4 skills: active, review-needed, draft, deprecated

- **`aigent-team audit` command** — Report skill governance status:
  - Status breakdown: active, draft, review-needed, deprecated, no status
  - Error: deprecated skills (exits with code 1)
  - Warning: skills needing review, missing governance metadata
  - Info: draft skills, missing version/owner/trigger

- **Generate scopes** expanded: `--scope examples`, `--scope output-contracts`, `--scope scripts`, `--scope assets`
- **Interactive wizard** updated with Examples, Output Contracts, Scripts, Assets checkboxes
- **Plugin manifest** (`manifest.json`) now includes `files.examples`, `files.outputContracts`, `files.scripts`, `files.assets` counts and optional `governance` array
- **`PLUGIN_ARTIFACT_CATEGORIES`** expanded with `examples`, `contracts`, `scripts`, `assets`
- **Local overrides** support for all new content types in `.aigent-team/teams/{role}/`
- **`ContentLayer`** and **`LoadingStrategy`** types for future progressive loading

### Changed

- `AgentDefinition` extended with `examples`, `outputContracts`, `scripts`, `assets` fields
- `SkillFile` extended with optional `governance` field
- `GENERATE_SCOPES` expanded: `all | agents | skills | references | examples | output-contracts | scripts | assets | plugin`
- `BaseCompiler` extended with `compileAllExamples()`, `compileAllOutputContracts()`, `compileAllScripts()`, `compileAllAssets()` (default no-op)
- All 4 platform compilers implement examples, contracts, scripts, assets compilation + plugin bundle sections
- `plugin-loader` reads examples, contracts, scripts, assets from plugin bundles
- `assembleSkillIndex()` now includes catalog tables for all content layers
- CLI version bumped to 0.4.0

## [0.3.0] - 2026-03-30

### Added

- **Interactive `generate` command** — When running `aigent-team generate` without flags, an interactive wizard prompts for:
  - Generate mode: Platform configs or Plugin bundle
  - Scopes: Agents, Skills, References (checkbox selection)
  - Team agents: select which roles to generate (defaults from config)
  - Target platforms: select which platforms to generate for (defaults from config)
- **Generate Scope (`--scope`)** — Control which output types are generated:
  - `--scope agents` — only agent skill index + hub files
  - `--scope skills` — only executable skill files
  - `--scope references` — only reference files
  - `--scope plugin` — self-contained plugin bundle with manifest
  - Multi-scope: `--scope agents,skills` for combining scopes
- **Team Filter (`--team`)** — Override config teams from CLI:
  - `--team fe,be` — generate only for specified roles
  - Combines with `--scope`: `--scope skills --team fe`
- **Plugin System** — Generate, install, and uninstall plugin bundles:
  - `aigent-team generate --scope plugin` — creates platform-agnostic bundle with `manifest.json`
  - `aigent-team install <path>` — installs plugin by compiling to platform-native formats
  - `aigent-team install <path> --force` — overwrite existing files
  - `aigent-team install <path> --platform cursor` — install for specific platform only
  - `aigent-team uninstall <name>` — removes all installed files + cleanup empty directories
  - `aigent-team install <path> --cursor-user-plugin` — copies `cursor-ide-plugin/` from the bundle to `~/.cursor/plugins/local/<name>` ([Cursor Plugins](https://cursor.com/docs/plugins))
  - Install records tracked at `.aigent-team/installed/{name}.json` for safe uninstall
- `PluginCompiler` — generates self-contained per-platform bundles inside plugin directory + `manifest.json`. Each bundle (e.g. `claude-code-plugin/`, `cursor-ide-plugin/`) contains all agents, skills, kb (references + shared knowledge), and rules
- `PluginManifest` with per-agent metadata (`PluginAgentMeta`) for install reconstruction
- `plugin-loader` module — reads plugin bundles and reconstructs `AgentDefinition[]`
- `InstallRecord` type for tracking installed plugins
- `output.pluginDir` config option for custom plugin output directory
- `GenerateScope` type and `GENERATE_SCOPES` const

### Changed

- **`init` no longer auto-generates** — `aigent-team init` now only creates `aigent-team.config.json`. Run `aigent-team generate` separately to generate platform configs with full scope/team control.
- **Plugin structure simplified** — Plugin output no longer duplicates top-level `agents/`, `skills/`, `references/`, `shared/` directories. All content is self-contained inside per-platform bundles (e.g. `claude-code-plugin/`, `cursor-ide-plugin/`).
- **Shared knowledge in all bundles** — Claude Code and Antigravity plugin bundles now include shared knowledge files under `kb/shared/` (Cursor and Codex already included them).
- `plugin-loader` reads from platform bundles instead of top-level directories, preferring `claude-code-plugin/` as canonical source.
- `BaseCompiler` refactored with decomposed methods: `compileHubFile()`, `compileAgentIndexes()`, `compileAllSkills()`, `compileAllReferences()`, `compileWithScope()`
- All 4 platform compilers refactored to use decomposed methods (backward compatible — `compile()` delegates to `compileWithScope(['all'])`)
- `GenerateOptions` expanded with `scopes`, `teams`, and `platforms` fields
- CLI version bumped to 0.2.0 → 0.3.0

## [0.2.0] - 2026-03-26

### Added

- **Agent Rules (Guardrails)** — Each agent now has `rules.md` with hard constraints:
  - Scope rules: file patterns agents must not modify (FE can't touch backend, QA can't touch source code, etc.)
  - Action rules: prohibited behaviors (no `any`, no logging PII, no skipping tests, etc.)
  - Escalation rules: when agents must stop and ask instead of deciding alone
  - Output rules: format and quality constraints on agent deliverables
- **Executable Skills** — On-demand procedural skill files in `skills/` per agent:
  - FE: `analyze-bundle`, `component-audit`
  - BE: `database-migration`, `api-load-test`
  - QA: `generate-test-data`, `flaky-test-diagnosis`
  - DevOps: `health-check`, `rollback-procedure`
  - Lead: `parallel-orchestration`, `sprint-review`
  - BA: `story-decomposition`, `requirement-validation`
- `SkillFile` type for on-demand executable procedures (parallel to `ReferenceFile`)
- `rulesContent` and `skills` fields on `AgentDefinition`
- `rules` override support in `AgentOverrideSchema` for config-level customization
- Local override support: `.aigent-team/teams/{role}/rules.md` and `.aigent-team/teams/{role}/skills/`
- Skills compiled to platform-native format for all 4 platforms
- Rules injected at the top of skill index for maximum visibility

## [0.1.0] - 2026-03-25

### Added

- Initial release
- 6 agent roles: Lead (orchestrator), BA, FE, BE, QA, DevOps
- 4 platform compilers: Claude Code, Cursor, Codex, Antigravity
- Slim skill index (~80-150 lines) + on-demand reference files per agent
- Interactive `init` wizard with platform auto-detection
- `generate` command with per-platform flag (`--platform`)
- `validate` command to check generated files against platform constraints
- Local overrides via `.aigent-team/` directory
- Config overrides for techStack, tools, globs per team
- Programmatic config support (`aigent-team.config.ts`)
- Senior-level reference docs: 42 reference files across all agents
- Shared knowledge templates (git workflow, project conventions)
- Lead agent orchestration: task decomposition, cross-team coordination, quality gates
