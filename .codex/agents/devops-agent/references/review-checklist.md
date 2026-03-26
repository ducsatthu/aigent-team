# DevOps Review Checklist

Use this checklist when reviewing infrastructure, deployment, and platform
changes. Not every item applies to every PR — use judgment, but default to
checking rather than skipping.

---

## Infrastructure as Code

- [ ] Changes are in Terraform/Pulumi/CDK — no ClickOps.
- [ ] `terraform plan` output attached to PR.
- [ ] No resources being destroyed unexpectedly (check plan for `destroy`).
- [ ] State is remote with locking enabled.
- [ ] Module versions pinned (no `ref=main`).
- [ ] Provider versions pinned with pessimistic constraint (`~>`).
- [ ] All resources tagged: Environment, Team, Service, ManagedBy, CostCenter.
- [ ] Resource naming follows convention (`{company}-{env}-{region}-{service}-{type}`).
- [ ] No hardcoded values — uses variables with descriptions and types.
- [ ] Sensitive values marked with `sensitive = true`.
- [ ] `lifecycle { prevent_destroy = true }` on critical resources (databases, S3).
- [ ] Outputs have descriptions.
- [ ] No `depends_on` unless absolutely necessary (prefer implicit).

---

## Docker

- [ ] Base image pinned to specific version (no `:latest`).
- [ ] Multi-stage build separates build and runtime.
- [ ] Final image uses slim or distroless base.
- [ ] Runs as non-root user (`USER` directive or K8s securityContext).
- [ ] No secrets in image (no `COPY .env`, no secrets in `ARG`/`ENV`).
- [ ] `.dockerignore` present and comprehensive.
- [ ] Layer order optimized (deps before source code).
- [ ] `HEALTHCHECK` defined (or deferred to K8s probes).
- [ ] Image size within targets (Go < 30MB, Node < 150MB, Python < 200MB).
- [ ] Scanned with Trivy — no CRITICAL or HIGH vulnerabilities.
- [ ] BuildKit enabled (`DOCKER_BUILDKIT=1`).

---

## Kubernetes

- [ ] Resource requests AND limits set on every container.
- [ ] Liveness and readiness probes defined.
- [ ] Startup probe added for slow-starting apps.
- [ ] Minimum 2 replicas for production deployments.
- [ ] PodDisruptionBudget defined for 2+ replica deployments.
- [ ] Security context set:
  - [ ] `runAsNonRoot: true`
  - [ ] `readOnlyRootFilesystem: true`
  - [ ] `allowPrivilegeEscalation: false`
  - [ ] `capabilities.drop: ["ALL"]`
- [ ] Image uses immutable tag (git SHA or semver), not `:latest`.
- [ ] `imagePullPolicy` matches tag type (IfNotPresent for SHA/semver).
- [ ] Secrets sourced from ExternalSecrets/Vault, not inline K8s Secrets.
- [ ] NetworkPolicy exists for the namespace (default-deny + explicit allows).
- [ ] Service account created (not using `default`).
- [ ] TopologySpreadConstraints or pod anti-affinity for zone distribution.
- [ ] Prometheus scrape annotations present (if metrics endpoint exists).
- [ ] No `hostNetwork`, `hostPID`, `hostIPC`, `privileged` unless justified.

---

## CI/CD

- [ ] Pipeline runs lint, test, build, scan, deploy in order.
- [ ] Full pipeline completes in < 15 minutes.
- [ ] Dependencies cached (lockfile-based cache key).
- [ ] Docker build uses layer caching (BuildKit GHA cache or equivalent).
- [ ] Images tagged with git SHA (immutable).
- [ ] Image scanned before push to registry.
- [ ] Branch protection enforced (PR required, status checks, no force push).
- [ ] CI actions pinned to SHA, not tag.
- [ ] Secrets injected via CI secrets manager, not in pipeline files.
- [ ] Production deploy requires approval gate.
- [ ] Rollback mechanism documented and tested.
- [ ] Same image deployed across all environments (only config differs).
- [ ] No `--force` or `--skip-tests` flags in pipeline.

---

## Monitoring and Observability

- [ ] Golden signals dashboard exists (latency, traffic, errors, saturation).
- [ ] Dashboard definition stored in Git.
- [ ] Prometheus metrics endpoint exposed (`/metrics`).
- [ ] Alert rules defined for error rate and latency SLOs.
- [ ] Every alert has a severity label (P1-P4).
- [ ] Every alert links to a runbook.
- [ ] Logs are structured JSON with trace_id.
- [ ] No PII or secrets in logs.
- [ ] Log retention configured (not infinite).
- [ ] Traces instrumented at service boundaries.
- [ ] SLO defined and error budget tracked.

---

## Security

- [ ] Service has its own IAM role/service account (not shared).
- [ ] IAM permissions follow least privilege (no wildcards in prod).
- [ ] No secrets in git, environment variables in manifests, or Docker images.
- [ ] Secrets sourced from Vault/SM with rotation schedule.
- [ ] Network access restricted (security groups reference SG IDs, not `0.0.0.0/0`).
- [ ] TLS termination configured (no plaintext in transit).
- [ ] Image signed and signature verified on admission.
- [ ] Dependency versions pinned (lockfiles committed).
- [ ] SAST and secrets scanning enabled in CI.
- [ ] Audit logging enabled for sensitive operations.
- [ ] K8s RBAC configured (no cluster-admin for workloads).

---

## Disaster Recovery

- [ ] DR tier assigned and documented.
- [ ] Backup schedule meets RPO for assigned tier.
- [ ] Backup restore tested within the last 30 days.
- [ ] Failover procedure documented in runbook.
- [ ] Failover tested within the last 90 days.
- [ ] Recovery can be performed by any on-call engineer (not just the author).
- [ ] Critical data has cross-region replication.
- [ ] etcd / cluster state backed up.

---

## Cost

- [ ] All resources tagged for cost tracking.
- [ ] Instance/pod sizing justified (not over-provisioned).
- [ ] Storage lifecycle policies configured.
- [ ] VPC endpoints used for AWS service access (avoid NAT costs).
- [ ] Spot/preemptible used for non-critical workloads.
- [ ] Budget alerts configured for the team/service.
- [ ] No idle resources (unattached volumes, unused EIPs, stopped instances).
- [ ] Estimated monthly cost included in PR for new infrastructure.

---

## General

- [ ] Change is reversible (can roll back without data loss).
- [ ] Change has been tested in staging/dev first.
- [ ] Documentation updated (runbooks, architecture diagrams, service catalog).
- [ ] Affected teams notified (if cross-cutting change).
- [ ] On-call team aware of the change timing.
- [ ] Change window appropriate (not Friday afternoon, not during peak).
