---
title: Docker Best Practices
description: Base image selection, multi-stage builds, layer optimization, and container security hardening.
whenToRead: When writing or reviewing Dockerfiles and container configurations
tags: [devops, docker, containers, images]
---

# Docker Reference

## Base Image Selection

| Language | Dev/Build Stage | Production Stage | Target Size |
|---|---|---|---|
| Go | `golang:1.22-alpine` | `gcr.io/distroless/static-debian12` | < 20 MB |
| Node.js | `node:20-alpine` | `node:20-alpine` or `gcr.io/distroless/nodejs20-debian12` | < 150 MB |
| Python | `python:3.12-slim` | `python:3.12-slim` | < 200 MB |
| Java | `eclipse-temurin:21-jdk-alpine` | `eclipse-temurin:21-jre-alpine` or distroless | < 250 MB |
| Rust | `rust:1.77-alpine` | `gcr.io/distroless/cc-debian12` | < 30 MB |

### Rules

- Never use `:latest`. Pin major.minor at minimum.
- Prefer Alpine or distroless for production. Debian slim if Alpine causes
  musl compatibility issues.
- Distroless = no shell, no package manager. Best for compiled languages.
- Rebuild base images weekly to pick up security patches.

---

## Multi-Stage Build Pattern

```dockerfile
# ---- Build stage ----
FROM golang:1.22-alpine AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app ./cmd/server

# ---- Production stage ----
FROM gcr.io/distroless/static-debian12
COPY --from=build /app /app
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app"]
```

### Key Points

- Build dependencies stay in the build stage — never leak into production.
- Copy dependency manifests first, then source code (layer caching).
- Strip debug symbols in compiled binaries (`-ldflags="-s -w"` for Go).
- Use `COPY --from=build` to pull only the final artifact.

---

## Security Hardening

### Non-Root Execution

```dockerfile
# Create user in build stage
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# In production stage
USER appuser:appgroup
```

Or with distroless, use the built-in `nonroot` user:
```dockerfile
USER nonroot:nonroot
```

### Read-Only Filesystem

In Kubernetes, set `readOnlyRootFilesystem: true` in the security context.
If the app needs to write temp files, mount an `emptyDir` at the specific path.

### Drop All Capabilities

```yaml
securityContext:
  capabilities:
    drop: ["ALL"]
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
```

### No Secrets in Images

- Never `COPY .env` or `COPY credentials`.
- Never use `ARG` or `ENV` for secrets — they persist in image layers.
- Pass secrets at runtime via mounted volumes or environment variables from
  a secrets manager.
- Use `docker history` to verify no secrets leaked into layers.

---

## .dockerignore

Every project must have a `.dockerignore`:

```
.git
.github
.gitignore
.env*
*.md
docs/
node_modules/
__pycache__/
*.pyc
.pytest_cache/
coverage/
.nyc_output/
dist/
build/
*.log
docker-compose*.yml
Dockerfile*
.dockerignore
terraform/
k8s/
helm/
.vscode/
.idea/
```

### Why It Matters

- Reduces build context size (faster builds).
- Prevents secrets (`.env`) from entering the image.
- Avoids cache-busting from irrelevant file changes.

---

## Layer Ordering

Order instructions from least-frequently-changed to most-frequently-changed:

```dockerfile
# 1. Base image (changes rarely)
FROM node:20-alpine

# 2. System dependencies (changes rarely)
RUN apk add --no-cache dumb-init

# 3. Working directory
WORKDIR /app

# 4. Dependency manifest (changes sometimes)
COPY package.json package-lock.json ./
RUN npm ci --production

# 5. Application code (changes often)
COPY src/ ./src/

# 6. Runtime config
USER node
EXPOSE 3000
CMD ["dumb-init", "node", "src/index.js"]
```

### Layer Cache Tips

- Separate `COPY` for dependency files vs source code.
- Use `--mount=type=cache` for package manager caches (BuildKit):
  ```dockerfile
  RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
  ```
- Combine `RUN` commands that are logically related to reduce layers:
  ```dockerfile
  RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates && \
      rm -rf /var/lib/apt/lists/*
  ```

---

## Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/app", "healthcheck"]
```

Or for HTTP services:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1
```

### Rules

- Always define a `HEALTHCHECK` in the Dockerfile or in K8s probes (not both,
  K8s probes take precedence).
- Use a dedicated health endpoint, not the main route.
- Health check should verify the app can serve traffic, not just that the
  process is alive.

---

## Image Size Targets

| Category | Target | Action if Exceeded |
|---|---|---|
| Static binary (Go/Rust) | < 30 MB | Check for embedded assets, strip symbols |
| Node.js | < 150 MB | Audit `node_modules`, use `--production` |
| Python | < 200 MB | Remove build deps, use slim base |
| Java | < 250 MB | Use JRE not JDK, jlink custom runtime |
| General | < 500 MB | Investigate — likely build deps leaked |

### Checking Size

```bash
# Size of final image
docker images myapp:latest --format "{{.Size}}"

# Layer-by-layer breakdown
docker history myapp:latest

# Deep analysis
dive myapp:latest
```

---

## Build Best Practices

- Enable BuildKit: `DOCKER_BUILDKIT=1`
- Tag with git SHA for traceability: `myapp:abc1234`
- Also tag with semver if releasing: `myapp:1.2.3`
- Scan images before push:
  ```bash
  trivy image myapp:abc1234
  ```
- Push to a private registry (ECR, GCR, ACR, Harbor). Never deploy from
  Docker Hub in production.
- Set `imagePullPolicy: IfNotPresent` in K8s when using immutable SHA tags.
- Use `.dockerignore` in every project — no exceptions.
