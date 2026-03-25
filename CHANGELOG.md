# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
