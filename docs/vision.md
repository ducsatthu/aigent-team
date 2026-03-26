# Vision & Roadmap

## Mission

Make every development team work with AI agents that have **senior-level expertise** — not generic copilots, but specialized team members that understand architecture, trade-offs, and production-grade patterns.

## Problem

Today's AI coding tools are **general-purpose generalists**. They:
- Give basic, textbook advice instead of battle-tested patterns
- Don't know your team's conventions, tech stack, or architecture
- Can't coordinate across frontend, backend, QA, and DevOps
- Require manual per-platform configuration that drifts over time
- Lose context when switching between tasks

## Solution

aigent-team provides:
1. **Specialized agents** with deep domain knowledge (8+ years expertise per role)
2. **Single source of truth** — one config, compiled to every AI platform
3. **On-demand deep knowledge** — slim context + reference files loaded when needed
4. **Team orchestration** — Lead agent coordinates specialists for complex tasks
5. **Cross-platform** — same agents work across Claude Code, Cursor, Codex, Antigravity
6. **Hard guardrails** — rules that constrain agent scope, actions, and escalation behavior
7. **Executable skills** — actionable procedures agents can perform on-demand, not just knowledge

---

## Future Direction

Những hướng phát triển lớn mà dự án hướng tới, chưa đặt timeline cụ thể:

### Agent Customization & Community

Cho phép teams tự tạo agent roles mới ngoài 6 built-in (data-engineer, mobile, security...), mix references từ nhiều roles, và chia sẻ templates qua community registry. Config inheritance cho phép org-level base + project-level overrides.

### Context-Aware Agents

Agents hiểu codebase cụ thể của project: tự scan cấu trúc, detect frameworks từ package.json, infer conventions từ code hiện có, phân tích git history để biết hotspot files và common bugs. Thay vì chỉ có generic knowledge, agents adapt theo từng dự án.

### Multi-Agent Workflows

Workflow engine cho phép chain agents theo pipeline (BA → FE+BE → QA), shared context giữa các agents (BA specs → API contracts → implementation), conflict detection khi FE và BE diverge, và review pipeline tự động.

### Knowledge Evolution

Agents tự improve theo thời gian: học từ post-mortems, track acceptance/rejection rate của suggestions, extract patterns từ merged PRs thành reusable references, adapt knowledge theo framework version (React 18 vs 19).

### Enterprise & Scale

Monorepo support (agent configs per workspace), audit trail, metrics dashboard, và self-hosted registry cho air-gapped environments.

---

## Platform Expansion

### Planned Compilers

| Platform | Status | Priority |
|---|---|---|
| Claude Code | Shipped | — |
| Cursor | Shipped | — |
| Codex (OpenAI) | Shipped | — |
| Antigravity (Google) | Shipped | — |
| Windsurf (Codeium) | Planned | High |
| Copilot (GitHub) | Planned | High |
| Aider | Planned | Medium |
| Continue.dev | Planned | Medium |
| Cline | Planned | Low |
| Amazon Q | Planned | Low |

Adding a new platform requires **one file** — a new compiler extending `BaseCompiler`.

### Planned Agent Roles

| Role | Focus | Priority |
|---|---|---|
| Mobile | React Native, Flutter, Swift, Kotlin | High |
| Data Engineer | Pipelines, ETL, Spark, dbt, Airflow | High |
| Security | OWASP, penetration testing, compliance | Medium |
| ML/AI | Model training, MLOps, experiment tracking | Medium |
| Technical Writer | API docs, user guides, architecture docs | Medium |
| Database Admin | Schema design, query optimization, migration | Low |
| Platform Engineer | Internal developer platform, self-service | Low |

---

## Design Principles

### 1. Senior-Level by Default
Every piece of knowledge in aigent-team should reflect what a senior engineer (8+ years) would know. No basic tutorials, no obvious advice. Decision frameworks, trade-offs, production gotchas.

### 2. Three-Layer Knowledge Architecture
Agents have three distinct content layers, each serving a different purpose:
- **Rules** (always loaded, top of context) — hard constraints that limit behavior. Agents must obey these.
- **Skill index** (always loaded) — core principles, anti-patterns, decision frameworks. ~80-150 lines.
- **References + Skills** (on-demand) — deep knowledge docs and executable procedures, loaded when the task requires them.

This keeps the always-loaded context slim while providing access to deep expertise when needed.

### 3. Single Source of Truth
One template, many outputs. Never manually maintain platform-specific configs. Change once, regenerate everywhere.

### 4. Extensible by Design
- New platform? Add one compiler file.
- New agent role? Add one template directory.
- Custom knowledge? Drop files in `.aigent-team/`.
- No forking required for customization.

### 5. Human-Readable Everything
All configs are YAML + Markdown. No binary formats, no proprietary schemas. Version control friendly, diff-able, reviewable in PRs.

### 6. Progressive Complexity
- `npx aigent-team init` → works with zero knowledge
- `aigent-team.config.json` → customize tech stack
- `.aigent-team/` directory → full control over agent knowledge
- Custom compilers → extend for new platforms

---

## Non-Goals

Things we intentionally **do not** plan to build:

- **Runtime agent execution** — We generate configs, we don't run agents. The AI platforms handle execution.
- **Model fine-tuning** — We work with any model via prompts, not training.
- **Code generation** — Agents guide the AI, they don't generate code themselves.
- **IDE plugin** — We integrate with AI tools that are already IDE plugins.
- **SaaS platform** — aigent-team is a CLI tool, open source, runs locally.
