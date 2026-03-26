# CI/CD Reference

## Pipeline Stages

```
┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐
│  Lint   │──▶│   Test   │──▶│  Build  │──▶│   Scan   │──▶│  Deploy  │──▶│ Verify │
└─────────┘   └──────────┘   └─────────┘   └──────────┘   └──────────┘   └────────┘
```

### Stage Details

| Stage | What | Tools | Fail Behavior |
|---|---|---|---|
| **Lint** | Code format, style, IaC validation | eslint, ruff, terraform fmt, hadolint | Block merge |
| **Test** | Unit, integration, contract tests | jest, pytest, go test | Block merge |
| **Build** | Compile, Docker build, asset bundling | Docker, webpack, go build | Block merge |
| **Scan** | Vulnerability scan, SAST, secrets detection | Trivy, Semgrep, gitleaks, Snyk | Block merge (critical/high) |
| **Deploy** | Push to environment | ArgoCD sync, helm upgrade, kubectl apply | Auto-rollback |
| **Verify** | Smoke tests, synthetic checks | curl, k6, playwright | Alert + auto-rollback |

---

## Speed Targets

| Metric | Target | Action if Exceeded |
|---|---|---|
| Lint + Test | < 5 min | Parallelize, use test splitting |
| Full pipeline (to staging) | < 10 min | Cache aggressively, optimize build |
| Full pipeline (to production) | < 15 min | Investigate — likely a build or test issue |
| Rollback | < 2 min | Must be automated, not a new pipeline run |
| Docker build | < 3 min | Fix layer ordering, use BuildKit cache |

### Speed Optimization

- Run lint, test, and scan in parallel where possible.
- Use job-level caching for dependencies.
- Split test suites across parallel runners.
- Only build what changed (monorepo: use path filters).

---

## Caching Strategies

### Dependency Caching

```yaml
# GitHub Actions example
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: deps-${{ hashFiles('package-lock.json') }}
    restore-keys: deps-
```

### Docker Layer Caching

```yaml
# GitHub Actions with BuildKit
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### What to Cache

| Asset | Cache Key | TTL |
|---|---|---|
| npm/yarn/pnpm | `package-lock.json` hash | Until lockfile changes |
| pip | `requirements.txt` hash | Until lockfile changes |
| Go modules | `go.sum` hash | Until lockfile changes |
| Docker layers | BuildKit GHA cache | 7 days / LRU |
| Terraform providers | `.terraform.lock.hcl` hash | Until lockfile changes |
| Test fixtures | Commit SHA | Per commit |

---

## Artifact Tagging

### Image Tags

Every build produces an image tagged with:

```
registry.company.com/service-name:<git-sha-short>
```

Additionally, on release:

```
registry.company.com/service-name:<semver>
registry.company.com/service-name:<semver>-<git-sha-short>
```

### Rules

- Primary tag is **always the git SHA** (7+ characters). This is the source of truth.
- Semver tags are applied on release branches or tags.
- Never overwrite a tag. Tags are immutable.
- Never use `:latest` in production pipelines.
- Store build metadata as image labels:
  ```dockerfile
  LABEL org.opencontainers.image.revision="${GIT_SHA}" \
        org.opencontainers.image.created="${BUILD_DATE}" \
        org.opencontainers.image.source="${REPO_URL}"
  ```

---

## Branch Protection

### Required for `main` / `master`

- Require PR with at least 1 approval.
- Require status checks to pass (lint, test, scan).
- Require up-to-date branch before merging.
- Require signed commits (optional but recommended).
- No force pushes.
- No direct pushes (all changes via PR).

### Branch Strategy

```
main ─────────────────────────────────────────── (always deployable)
  └── feature/TICKET-123-add-caching ────── PR ──▶ merge
  └── fix/TICKET-456-oom-error ──────────── PR ──▶ merge
  └── release/1.2.0 ─── tag v1.2.0 ──▶ deploy
```

- Trunk-based development preferred: short-lived branches (< 2 days).
- Release branches only if you need hotfix capability on older versions.
- Delete branches after merge.

---

## Rollback Mechanisms

### Strategy 1: Redeploy Previous Artifact (Preferred)

```bash
# ArgoCD
argocd app set myapp -p image.tag=<previous-sha>
argocd app sync myapp

# Helm
helm rollback myapp <previous-revision>

# kubectl
kubectl rollout undo deployment/myapp
```

- Fastest method: the previous image already exists in the registry.
- No new build needed.
- Rollback target is tracked in Git history.

### Strategy 2: Git Revert

```bash
git revert <bad-commit>
git push origin main
# Pipeline runs automatically, deploys the revert
```

- Preferred when the code change itself is the problem.
- Creates audit trail in Git.
- Slower than artifact redeploy (requires full pipeline).

### Strategy 3: Feature Flag Disable

```
Toggle off the feature flag in LaunchDarkly / Unleash / Flipt
```

- Fastest for feature-level issues.
- No deployment needed.
- Requires the change to be behind a flag.

### Rollback Rules

- Rollback must be possible within 2 minutes.
- Every deployment must record which artifact was deployed.
- Keep last 10 revisions in Helm / ArgoCD.
- Test rollback procedure quarterly.
- Automated rollback on failed verify stage (smoke tests).

---

## Pipeline Security

- Secrets injected via CI provider's secrets manager, never in pipeline files.
- Pin action versions to SHA, not tags (supply chain attack mitigation):
  ```yaml
  uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
  ```
- Use OIDC for cloud authentication — no long-lived credentials.
- Scan pipeline definitions with `actionlint` (GitHub) or equivalent.
- Audit who can modify pipeline files (same rigor as production access).

---

## Environments and Promotion

```
PR Branch → dev (auto-deploy on push)
main      → staging (auto-deploy on merge)
tag/v*    → production (manual approval gate, then auto-deploy)
```

### Environment Parity

- Same Docker image across all environments (only config changes).
- Same K8s manifests with env-specific values via Helm values or Kustomize overlays.
- Same pipeline stages for all environments (skip nothing for staging).
- Production deploy requires approval from at least one person who did not
  author the change.
