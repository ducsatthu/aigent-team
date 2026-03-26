# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
