### Infrastructure as Code
- [ ] Changes are in Terraform/Pulumi/CDK — no manual console changes
- [ ] Remote state configured with locking enabled
- [ ] `terraform plan` reviewed — no unexpected destroys on stateful resources
- [ ] Resources tagged: project, environment, team, cost-center
- [ ] Module versions pinned (not pointing to main branch)
- [ ] Sensitive variables marked as `sensitive = true`
- [ ] No hardcoded values — all configurable via variables with defaults

### Docker & Container Security
- [ ] Multi-stage build — final image contains only runtime dependencies
- [ ] Non-root user configured (`USER` instruction, `runAsNonRoot: true`)
- [ ] Base image uses specific version tag (not `latest`)
- [ ] Base image is slim/distroless variant
- [ ] No secrets in Dockerfile, build args, or image layers
- [ ] .dockerignore excludes .git, node_modules, .env, test files
- [ ] Image scanned with Trivy — 0 critical, 0 high vulnerabilities
- [ ] Image size within target (<200MB for Node, <50MB for Go)
- [ ] HEALTHCHECK instruction present

### Kubernetes
- [ ] Resource requests AND limits set (requests = p50 usage, limits = p99 + headroom)
- [ ] Liveness probe checks process health only (not dependencies)
- [ ] Readiness probe checks ability to serve traffic (DB connected, cache available)
- [ ] PodDisruptionBudget configured (`minAvailable: 50%` or `maxUnavailable: 1`)
- [ ] Security context: `runAsNonRoot`, `drop: [ALL]` capabilities, `readOnlyRootFilesystem`
- [ ] Network policies restrict pod-to-pod traffic (default deny, explicit allow)
- [ ] Secrets via ExternalSecrets/Vault — not in K8s manifests (base64 is not encryption)
- [ ] Minimum 2 replicas for production deployments
- [ ] Image pull policy is `IfNotPresent` (not `Always`)
- [ ] Anti-affinity rules spread pods across nodes/AZs

### CI/CD Pipeline
- [ ] All stages present: lint → test → build → security scan → deploy
- [ ] Security scanning: SAST, dependency audit, container scan, secret detection
- [ ] Build uses caching (Docker layers, dependency cache, test cache)
- [ ] Artifacts tagged with branch-sha-buildnumber (not `latest`)
- [ ] Production deploy has manual approval gate
- [ ] Rollback mechanism defined and tested (automated on error rate spike)
- [ ] Pipeline total <15 minutes
- [ ] Pipeline steps containerized (runs same locally and in CI)

### Monitoring & Alerting
- [ ] New service has all 3 pillars: metrics, logs, traces
- [ ] Dashboard with golden signals: latency, traffic, errors, saturation
- [ ] Alerts on symptoms (error rate, latency) not causes (CPU, memory)
- [ ] Alert severity appropriate (P1 pages on-call, P2 Slack, P3 ticket)
- [ ] Runbook exists for every P1/P2 alert
- [ ] Log format is structured JSON with request_id, service, environment

### Security
- [ ] IAM roles follow least privilege — no `*` resources, no admin policies
- [ ] Network: app in private subnets, only LB in public, security groups restrictive
- [ ] No hardcoded secrets, API keys, or credentials anywhere in code
- [ ] TLS everywhere — external (HTTPS) and internal (mTLS or VPC-internal)
- [ ] Audit logging enabled for infrastructure changes
- [ ] Image signing verified for production deployments

### Disaster Recovery & Reliability
- [ ] Backup schedule configured for databases and persistent storage
- [ ] Backup restore tested within the last month
- [ ] Multi-AZ deployment for Tier 1 services
- [ ] Failover procedure documented in runbook
- [ ] RTO/RPO requirements documented and achievable
- [ ] Graceful shutdown handles SIGTERM (drain connections, finish in-flight requests)

### Cost
- [ ] All new resources tagged for cost tracking
- [ ] Instance sizing justified by usage metrics (not "biggest available")
- [ ] Spot/preemptible used for stateless workloads where possible
- [ ] Storage lifecycle policies set (transition to cold storage, expiration)
- [ ] Cost impact estimated before provisioning (especially for data transfer, managed services)
