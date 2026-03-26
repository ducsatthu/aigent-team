# Agent Reference

## Agent Team Overview

aigent-team ships with 6 specialized agents, organized in a **lead + specialists** structure:

```
                    ┌─────────────────┐
                    │   Lead Agent    │  Orchestrator
                    └───────┬─────────┘
                            │
          ┌─────────┬───────┼───────┬──────────┐
          ▼         ▼       ▼       ▼          ▼
       ┌─────┐  ┌─────┐ ┌─────┐ ┌──────┐  ┌───────┐
       │ BA  │  │ FE  │ │ BE  │ │  QA  │  │DevOps │
       └─────┘  └─────┘ └─────┘ └──────┘  └───────┘
```

---

## Lead Agent

**Role**: Tech Lead / Project Manager — orchestrates other agents.

**When it activates**: Always available. Use for complex tasks that span multiple teams.

**What it does**:
- Analyzes requirements and identifies which teams are involved
- Decomposes tasks into subtasks and assigns to specialists
- Coordinates cross-team dependencies (FE+BE API contracts, QA test plans)
- Enforces quality gates before delivery

**Rules**: Must not write implementation code. Must not spawn agents without full context template. Must escalate on scope changes, cross-team conflicts, and timeline risks.

**Reference files**:

| File | Content |
|---|---|
| task-decomposition.md | How to break complex features into parallel workstreams |
| cross-team-coordination.md | Managing dependencies, API contract alignment, shared context |
| quality-gates.md | Definition of done, review criteria, release readiness |

**Skills**:

| Skill | Trigger |
|---|---|
| parallel-orchestration.md | Multi-agent feature implementation |
| sprint-review.md | End-of-sprint quality and completeness review |

---

## BA Agent (Business Analyst)

**Role**: Translate business requirements into technical specifications.

**When it activates**: Working with docs, specs, requirements files (`docs/**`, `specs/**`, `*.md`).

**What it does**:
- Writes user stories (As a... I want... So that...)
- Defines acceptance criteria (Given/When/Then)
- Proposes API contracts (request/response schemas)
- Creates data flow diagrams (Mermaid)
- Identifies edge cases and business rules

**Tools**: Read, Write, Edit, Grep, Glob (no Bash — read/write focused).

**Rules**: Must not modify source code or tests. Must not make implementation decisions. Must escalate on conflicting requirements or missing stakeholder input.

**Reference files**:

| File | Content |
|---|---|
| requirements-analysis.md | Breaking down features, identifying stakeholders, scope |
| acceptance-criteria.md | Given/When/Then format, coverage checklist, anti-patterns |
| api-contract-design.md | REST contract templates, design principles, review checklist |
| user-story-mapping.md | Story maps, MVP slicing, RICE prioritization, splitting techniques |

**Skills**:

| Skill | Trigger |
|---|---|
| story-decomposition.md | Breaking epics into implementable stories |
| requirement-validation.md | Validating requirements are complete and consistent |

---

## FE Agent (Frontend)

**Role**: Senior frontend engineer — React, Vue, Angular, Svelte.

**When it activates**: Working with UI files (`**/*.tsx`, `**/*.jsx`, `**/*.css`, `src/components/**`).

**What it does**:
- Component architecture and props API design
- State management decisions (local vs server vs global)
- Performance optimization (Core Web Vitals, bundle size)
- Accessibility (WCAG compliance, keyboard navigation)
- Security (XSS prevention, CSP, auth token handling)

**Rules**: Must not modify backend, infra, or CI/CD files. Must not add dependencies without stating reason and bundle impact. Must escalate on API contract mismatches and breaking shared component changes.

**Reference files (9)**:

| File | When to read |
|---|---|
| component-architecture.md | Creating or reviewing components |
| state-management.md | Choosing state solution |
| performance.md | Optimizing or auditing performance |
| accessibility.md | Implementing or reviewing a11y |
| security.md | Security review or handling user input |
| testing.md | Writing or reviewing frontend tests |
| css-styling.md | Styling decisions, Tailwind patterns |
| forms.md | Form validation, multi-step forms |
| review-checklist.md | Reviewing frontend PRs |

**Skills**:

| Skill | Trigger |
|---|---|
| analyze-bundle.md | Bundle size investigation, dependency audit |
| component-audit.md | Component library health check, finding duplicates |

---

## BE Agent (Backend)

**Role**: Senior backend engineer — NestJS, Express, FastAPI, Spring Boot.

**When it activates**: Working with API/server files (`**/*.ts`, `src/api/**`, `prisma/**`, `migrations/**`).

**What it does**:
- API design (REST, GraphQL, gRPC decisions)
- Database schema design, migrations, query optimization
- Authentication and authorization flows
- Error handling hierarchy and circuit breakers
- Observability (structured logging, distributed tracing)
- Caching strategies and async processing

**Rules**: Must not modify frontend/UI/CSS files. Must not run migrations without approval. Must not log PII or use raw SQL. Must escalate on breaking API changes and new external dependencies.

**Reference files (9)**:

| File | When to read |
|---|---|
| api-design.md | Designing or reviewing API endpoints |
| database.md | Schema design, migrations, indexing |
| auth-security.md | Authentication flows, IDOR prevention |
| error-handling.md | Error hierarchy, retries, circuit breakers |
| observability.md | Logging, tracing, metrics |
| caching.md | Cache-aside, write-through, stampede prevention |
| async-processing.md | Job queues, idempotency, dead letter queues |
| testing.md | Unit/integration/contract testing |
| review-checklist.md | Reviewing backend PRs |

**Skills**:

| Skill | Trigger |
|---|---|
| database-migration.md | Schema changes, new tables, index additions |
| api-load-test.md | Endpoint performance validation under load |

---

## QA Agent

**Role**: Senior QA engineer — Playwright, Cypress, Vitest, Jest.

**When it activates**: Working with test files (`**/*.test.*`, `**/*.spec.*`, `e2e/**`, `playwright/**`).

**What it does**:
- Test strategy and pyramid optimization
- E2E automation with Page Object Model
- Contract testing (Pact)
- Performance testing (k6, Artillery)
- Security testing (OWASP top 10)
- CI integration and flakiness management

**Rules**: Must not modify production source code. Must not commit `.only` or `.skip`. Must not use `sleep()` in tests. Must escalate on coverage drops and actual vulnerabilities found.

**Reference files (8)**:

| File | When to read |
|---|---|
| test-strategy.md | Planning test approach for a feature |
| e2e-testing.md | Writing or reviewing E2E tests |
| test-data.md | Setting up factories, fixtures, database isolation |
| mocking.md | MSW setup, contract drift detection |
| performance-testing.md | Load testing, stress testing |
| security-testing.md | SQL injection, XSS, auth bypass tests |
| ci-integration.md | Pipeline design, test reporting |
| review-checklist.md | Reviewing test PRs |

**Skills**:

| Skill | Trigger |
|---|---|
| generate-test-data.md | Setting up fixtures, seed data, edge case data |
| flaky-test-diagnosis.md | Intermittently failing tests |

---

## DevOps Agent

**Role**: Senior DevOps / SRE — Terraform, Docker, Kubernetes, GitHub Actions.

**When it activates**: Working with infra files (`Dockerfile*`, `**/*.tf`, `.github/workflows/**`, `k8s/**`, `helm/**`).

**What it does**:
- Infrastructure as Code (Terraform modules, state management)
- Container optimization (multi-stage builds, security hardening)
- Kubernetes deployment (probes, PDB, network policies)
- CI/CD pipeline architecture
- Monitoring and alerting (Prometheus, Grafana, SLOs)
- Disaster recovery and cost optimization

**Rules**: Must not modify application business logic. Must not store secrets in plaintext. Must not use `:latest` tags or run containers as root. Must escalate on production incidents and cost increases > 20%.

**Reference files (9)**:

| File | When to read |
|---|---|
| infrastructure-as-code.md | Terraform modules, state management |
| docker.md | Dockerfile optimization, security |
| kubernetes.md | Deployments, services, security context |
| ci-cd.md | Pipeline stages, caching, rollback |
| monitoring.md | Golden signals, PromQL, alerting |
| security.md | Network policies, RBAC, secrets |
| disaster-recovery.md | Backup, failover, chaos engineering |
| cost-optimization.md | Right-sizing, reserved capacity, tagging |
| review-checklist.md | Reviewing infrastructure PRs |

**Skills**:

| Skill | Trigger |
|---|---|
| health-check.md | Post-deployment verification, monitoring setup |
| rollback-procedure.md | Reverting a failed deployment |

---

## Shared Knowledge

All agents share two baseline documents:

| File | Content |
|---|---|
| `project-conventions.md` | Naming conventions, code quality rules, git hygiene |
| `git-workflow.md` | Branch strategy, conventional commits, PR process |

These are injected into every agent's context regardless of role.
