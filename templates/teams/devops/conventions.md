## Infrastructure as Code

- **Terraform** is the default for cloud infrastructure. Pulumi/CDK when team has strong preference and TypeScript expertise.
- Directory structure:
  ```
  infra/
  ├── modules/              # Reusable modules (vpc, rds, eks, etc.)
  │   ├── vpc/
  │   │   ├── main.tf
  │   │   ├── variables.tf
  │   │   └── outputs.tf
  │   └── ...
  ├── environments/
  │   ├── dev/
  │   │   ├── main.tf       # Calls modules with dev-specific values
  │   │   ├── terraform.tfvars
  │   │   └── backend.tf    # Remote state config for dev
  │   ├── staging/
  │   └── production/
  └── global/               # Shared resources (IAM, DNS, ECR)
  ```
- **State management**: Remote backend (S3+DynamoDB or GCS) per environment per component. Workspace-based isolation is acceptable for small projects but explicit directory separation is preferred for production.
- **Plan → Review → Apply** cycle. Always run `terraform plan -out=plan.tfplan` first. Apply from the saved plan, never `terraform apply` directly.
- **Import before recreate**: If Terraform wants to destroy and recreate a stateful resource (database, S3 bucket), stop and investigate. Use `terraform import` or `lifecycle { prevent_destroy = true }` for critical resources.
- **Module versioning**: Pin module versions in production. Tag releases. Never point to `main` branch for module sources.

## Docker Standards

- **Base images**: Use specific version tags, never `latest`. Prefer slim variants:
  - Node.js: `node:22-slim` or `node:22-alpine`
  - Python: `python:3.12-slim`
  - Go: Build with `golang:1.22`, run on `gcr.io/distroless/static-debian12`
  - Java: `eclipse-temurin:21-jre-jammy`
- **Multi-stage builds** mandatory. Builder stage has dev dependencies and compiles. Runtime stage has only production dependencies and the built artifact.
- **Security**:
  - Create and use non-root user: `RUN adduser --disabled-password --no-create-home appuser && USER appuser`
  - No `sudo`, no `curl` in final image (install in builder stage, copy binary only)
  - `COPY --chown=appuser:appuser` for application files
  - Read-only root filesystem where possible: `readOnlyRootFilesystem: true` in K8s securityContext
- **Health checks**: Every container has `HEALTHCHECK` instruction or K8s liveness/readiness probes.
- **Image size targets**: Node.js app <200MB, Go app <50MB, Python app <300MB. Measure with `docker images`.
- **.dockerignore** must include: `.git`, `node_modules`, `__pycache__`, `.env*`, `*.md`, `test/`, `docs/`, `.vscode/`, `.idea/`.

## Kubernetes Standards

- **Namespaces**: One namespace per service per environment. Format: `{service}-{env}` (e.g., `api-production`, `worker-staging`).
- **Resource management**:
  - Always set `resources.requests` (scheduler guarantee) and `resources.limits` (OOM/CPU throttle ceiling)
  - Requests = p50 actual usage. Limits = p99 + 30% headroom. Profile with real traffic, not guesses.
  - CPU limits are controversial — set for burst workloads, omit for latency-sensitive services (CPU throttling causes latency spikes). Always set memory limits.
- **Probes**:
  - `livenessProbe`: Is the process alive? Failure = K8s restarts the pod. Use `/health/live`. Don't check dependencies here.
  - `readinessProbe`: Can the pod serve traffic? Failure = removed from Service endpoints. Use `/health/ready`. Check DB connection, cache availability.
  - `startupProbe`: Is the app still starting? Use for slow-starting apps (JVM warmup, large model loading). Prevents premature liveness kills.
  - Intervals: liveness every 10s, readiness every 5s, startup every 5s with failureThreshold 30.
- **Pod Disruption Budget**: `minAvailable: 50%` or `maxUnavailable: 1` for all production deployments. Prevents K8s from draining all pods simultaneously during node upgrades.
- **Security context** on every pod:
  ```yaml
  securityContext:
    runAsNonRoot: true
    runAsUser: 65534
    fsGroup: 65534
    capabilities:
      drop: [ALL]
    readOnlyRootFilesystem: true
  ```
- **Network Policies**: Default deny all ingress. Explicitly allow only the traffic paths you need. Services that don't need to talk to each other must not be able to.
- **Secrets**: Use `ExternalSecrets` operator or `Vault` sidecar. Never store secrets in K8s Secrets manifests in git (even if base64 encoded — base64 is not encryption).
- **Image pull policy**: `IfNotPresent` for tagged images. Never `Always` in production (causes unnecessary registry traffic). Never use `latest` tag.

## CI/CD Pipeline Standards

- **Pipeline stages** (in order):
  1. **Lint** — code formatting, linting, type checking. Fast, catches obvious issues.
  2. **Unit test** — runs in parallel with lint. Fails fast.
  3. **Build** — Docker image build. Uses cache from previous builds.
  4. **Security scan** — SAST, dependency audit, container image scan. Blocks on critical/high.
  5. **Integration test** — runs against built image with test dependencies.
  6. **Deploy staging** — automatic on merge to main.
  7. **E2E test** — runs against staging.
  8. **Deploy production** — manual approval gate. Canary rollout.
- **Speed targets**: Total pipeline <15 minutes. Lint+unit <3 min. Build <5 min. Integration <5 min. Optimize with parallelization and caching.
- **Caching strategy**:
  - Docker layer cache — mount BuildKit cache, or use registry cache (`--cache-from`/`--cache-to`)
  - Dependency cache — cache `node_modules` (by lockfile hash), `.pip-cache`, `GOMODCACHE`
  - Test cache — Vitest/Jest cache, Go test cache
- **Artifact tagging**: `{branch}-{short-sha}-{build-number}` (e.g., `main-a1b2c3d-42`). Production deploys also get semantic version tags.
- **Branch protection**: Main branch requires — CI passing, 1+ approval, no force push, signed commits preferred.

## Monitoring & Alerting

- **Three pillars** — all services must have all three:
  1. **Metrics**: Request rate, error rate, latency (p50/p95/p99), saturation (CPU, memory, disk, connections)
  2. **Logs**: Structured JSON, shipped to centralized aggregator, retained 30 days (hot) + 90 days (cold)
  3. **Traces**: Distributed traces across service boundaries, sampled at 10% in production (100% for errors)
- **Dashboard per service**: At minimum — request rate, error rate, latency percentiles, resource utilization. Golden signals: Latency, Traffic, Errors, Saturation.
- **Alert on symptoms, not causes**:
  - GOOD: "Error rate >1% for 5 minutes" — this means users are affected
  - BAD: "CPU >80%" — this might be fine during a deploy
  - GOOD: "p99 latency >2s for 10 minutes" — users are experiencing slow responses
  - BAD: "Memory >70%" — this might be normal for a JVM app
- **Alert severity**:
  - **P1/Critical**: Pages on-call immediately. User-facing outage. Example: error rate >5%, complete service unavailability.
  - **P2/High**: Slack notification to team. Degraded performance. Example: error rate >1%, p99 >2x baseline.
  - **P3/Medium**: Ticket created. Non-urgent. Example: disk usage >80%, certificate expiring in 14 days.
  - **P4/Low**: Dashboard only. Informational. Example: cost anomaly, deprecation warning.
- **On-call requirements**: Runbook for every P1/P2 alert. Runbook includes — what the alert means, how to diagnose, common fixes, escalation path.

## Security

- **Least privilege**: IAM roles with minimum required permissions. No `*` in resource ARN. No `AdministratorAccess` on service roles.
- **Network security**: VPC with private subnets for all application workloads. Public subnets only for load balancers and bastion hosts. Security groups = allow specific ports from specific sources only.
- **Secrets rotation**: Database passwords rotated quarterly. API keys rotated on employee offboarding. TLS certificates auto-renewed (cert-manager or ACM).
- **Image security**: Scan images in CI (Trivy). Block deployments of images with critical vulnerabilities. Use signed images (cosign/Notary) in production.
- **Audit logging**: CloudTrail/GCP Audit Log enabled. Log all IAM changes, security group changes, and production access.

## Disaster Recovery

- **RPO/RTO** defined per service tier:
  - Tier 1 (critical): RPO <1 hour, RTO <15 minutes. Multi-AZ, automated failover, real-time replication.
  - Tier 2 (important): RPO <4 hours, RTO <1 hour. Multi-AZ, manual failover, periodic replication.
  - Tier 3 (internal): RPO <24 hours, RTO <4 hours. Single-AZ, restore from backup.
- **Backup verification**: Monthly restore test to verify backups are usable. Document restore time and compare against RTO.
- **Failover testing**: Quarterly chaos testing — kill a node, kill a database replica, simulate AZ failure. Verify automated recovery works.
- **Runbooks**: Every critical service has a disaster recovery runbook with step-by-step restore procedure, verified by the last person who ran it.

## Cost Management

- **Tagging policy**: All resources tagged with `project`, `environment`, `team`, `cost-center`. Untagged resources get flagged in weekly report.
- **Right-sizing review**: Monthly review of instance utilization. Any instance with <30% avg CPU utilization gets downsized.
- **Reserved capacity**: 1-year commitments for steady-state workloads (60-70% of base). Spot instances for batch processing and stateless burst.
- **Storage lifecycle**: S3/GCS objects transitioned to infrequent access after 30 days, glacier/archive after 90 days. Set lifecycle policies on every bucket.
- **Budget alerts**: 80% and 100% monthly budget. Daily anomaly detection (>20% deviation from rolling 7-day average).
