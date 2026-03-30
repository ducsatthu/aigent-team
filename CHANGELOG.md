# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.0] - 2026-03-30

### Added

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
- `PluginCompiler` — platform-agnostic compiler producing `manifest.json` + agents/skills/references/shared + `cursor-ide-plugin/` (Cursor IDE bundle: `.cursor-plugin/plugin.json`, `rules/`, `skills/*/SKILL.md` per [plugins reference](https://cursor.com/docs/reference/plugins.md))
- `PluginManifest` with per-agent metadata (`PluginAgentMeta`) for install reconstruction
- `plugin-loader` module — reads plugin bundles and reconstructs `AgentDefinition[]`
- `InstallRecord` type for tracking installed plugins
- `output.pluginDir` config option for custom plugin output directory
- `GenerateScope` type and `GENERATE_SCOPES` const

### Changed

- `BaseCompiler` refactored with decomposed methods: `compileHubFile()`, `compileAgentIndexes()`, `compileAllSkills()`, `compileAllReferences()`, `compileWithScope()`
- All 4 platform compilers refactored to use decomposed methods (backward compatible — `compile()` delegates to `compileWithScope(['all'])`)
- `GenerateOptions` expanded with `scopes` and `teams` fields
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
