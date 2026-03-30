# Documentation Index

> This file is the entry point for understanding the aigent-team project.
> AI agents and humans should start here to understand what exists, what's planned, and what was decided.

## How This Docs Directory Works

```
docs/
├── INDEX.md              ← You are here. Start point for all docs.
├── base/                 ← Stable documentation. Describes the project as-is.
│   ├── vision.md         ← Mission, problem, solution, roadmap
│   ├── architecture.md   ← System design, data flow, compiler pipeline
│   └── agents.md         ← Agent roles, capabilities, interactions
├── rfcs/                 ← Proposals for new features (in-progress or approved)
│   └── rfc-NNN-*.md      ← Numbered proposals with status tracking
└── decisions/            ← Finalized decisions (extracted from completed RFCs)
    └── adr-NNN-*.md      ← Architecture Decision Records
```

### Document Lifecycle

```
Idea → RFC (draft) → RFC (approved) → ADR (decision record) → Base docs updated
                  ↓
            RFC (rejected/deferred) — kept for historical context
```

- **RFC** = Request for Comments. A proposal with problem, solution, technical design, and implementation plan.
- **ADR** = Architecture Decision Record. Short, permanent record of a decision made. Never deleted, only superseded.
- **Base docs** = Updated after implementation is complete to reflect current state.

---

## Base Documentation (current state)

| Doc | What it covers | Last updated |
|-----|---------------|--------------|
| [vision.md](base/vision.md) | Mission, problem statement, solution pillars, future roadmap | v0.2.0 |
| [architecture.md](base/architecture.md) | Compiler pipeline, data flow, module responsibilities, output formats | v0.2.0 |
| [agents.md](base/agents.md) | 6 agent roles, capabilities, when to use each, interaction patterns | v0.2.0 |

---

## RFCs (proposals)

| # | Title | Status | Created | Summary |
|---|-------|--------|---------|---------|
| [RFC-001](rfcs/rfc-001-generate-scope.md) | Generate Scope & Plugin Mode | `completed` | 2026-03-30 | `--scope`, `--team` options for `generate`. Plugin bundle + `install`/`uninstall` commands. |

### RFC Status Values

- `draft` — Under discussion, not yet approved
- `approved` — Approved for implementation, work can begin
- `in-progress` — Implementation started (link to branch/PR)
- `completed` — Implemented and merged. ADR extracted, base docs updated.
- `rejected` — Not moving forward. Reason documented in RFC.
- `deferred` — Good idea, not now. Will revisit.

---

## Decisions (ADRs)

> No decisions recorded yet. ADRs will be created as RFCs are completed.

ADR format: `adr-NNN-<short-title>.md`

---

## Version History

Tracks how the project has evolved. Each entry links to the relevant docs/decisions at that point.

| Version | Date | Key Changes | Docs |
|---------|------|-------------|------|
| v0.1.0 | 2026-03-25 | Initial release. 6 agents, 4 platforms, skill index + references. | base/* |
| v0.2.0 | 2026-03-26 | Agent rules (guardrails), executable skills, local overrides. | base/* |
| v0.3.0 | 2026-03-30 | `--scope`, `--team` filters, plugin bundle, install/uninstall commands. | [RFC-001](rfcs/rfc-001-generate-scope.md) |

---

## For AI Agents Reading This Project

1. **Start here** (INDEX.md) to understand doc structure
2. **Read base docs** for current architecture and capabilities
3. **Check RFCs** for upcoming changes — status tells you if it's planned or already implemented
4. **Check ADRs** for why past decisions were made
5. **Read CHANGELOG.md** (project root) for release history
6. **Read CLAUDE.md** (project root) for code conventions and commands
