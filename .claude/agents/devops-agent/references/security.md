# Security Reference

## Least Privilege IAM

### Principles

- Every service gets its own IAM role/service account. No shared credentials.
- Grant minimum permissions required. Start with zero, add as needed.
- Use condition-based policies (source IP, time, MFA) for sensitive operations.
- No wildcard (`*`) actions or resources in production policies.
- Review IAM policies quarterly; remove unused permissions.

### IAM Pattern (AWS Example)

```hcl
# Per-service role with scoped permissions
resource "aws_iam_role" "user_api" {
  name               = "${local.name_prefix}-user-api"
  assume_role_policy = data.aws_iam_policy_document.eks_assume.json
}

resource "aws_iam_policy" "user_api" {
  name = "${local.name_prefix}-user-api"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "arn:aws:s3:::${var.bucket_name}/user-uploads/*"
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = "arn:aws:secretsmanager:*:*:secret:user-api/*"
      }
    ]
  })
}
```

### Service Account Mapping (Kubernetes)

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: user-api
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/user-api
    # GKE: iam.gke.io/gcp-service-account: user-api@project.iam.gserviceaccount.com
```

### Human Access

- Use SSO (Okta, Azure AD) for all human access. No local IAM users.
- Require MFA for console and CLI access.
- Break-glass accounts stored in physical safe or sealed-secret system.
- Admin access via just-in-time (JIT) elevation, not permanent grants.
- All access changes require PR review.

---

## Network Security

### VPC Design

```
VPC (10.0.0.0/16)
├── Public Subnets (10.0.0.0/20, 10.0.16.0/20, 10.0.32.0/20)
│   └── Load Balancers, NAT Gateways, Bastion (if needed)
├── Private Subnets (10.0.48.0/20, 10.0.64.0/20, 10.0.80.0/20)
│   └── Application workloads (EKS nodes, EC2, ECS)
└── Data Subnets (10.0.96.0/20, 10.0.112.0/20, 10.0.128.0/20)
    └── Databases, caches, message brokers
```

### Rules

- **Three availability zones minimum** for production.
- Application workloads in private subnets only.
- Databases in data subnets with no internet route.
- Egress via NAT Gateway (or VPC endpoints for AWS services).
- No SSH/RDP to production instances — use SSM Session Manager or
  `kubectl exec` (with audit logging).

### Security Groups / Firewall Rules

- Default: deny all inbound, deny all outbound.
- Allow only required ports between specific security groups.
- Reference security groups by ID, not CIDR (self-documenting, auto-updating).
- No `0.0.0.0/0` inbound rules except on load balancers (ports 80/443 only).
- Document every security group rule with a description.

```hcl
resource "aws_security_group_rule" "api_from_alb" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.api.id
  description              = "Allow ALB to reach API on port 8080"
}
```

---

## Secrets Management

### Secrets Lifecycle

```
Create → Store in Vault/SM → Reference in config → Rotate → Revoke
```

### Rotation Schedule

| Secret Type | Rotation Period | Method |
|---|---|---|
| Database credentials | 90 days | Automated (Vault dynamic secrets) |
| API keys (internal) | 90 days | Automated rotation |
| API keys (third-party) | Per vendor policy | Manual with ticket |
| TLS certificates | Auto-renew (cert-manager) | Let's Encrypt / ACM |
| SSH keys | 180 days | Key rotation pipeline |
| Encryption keys | 365 days | AWS KMS auto-rotation |

### Rules

- Never store secrets in: git, CI pipeline files, Docker images, environment
  variables in K8s manifests, ConfigMaps.
- Use: HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager,
  Azure Key Vault, SOPS for encrypted files.
- Mount as files, not env vars (env vars appear in `kubectl describe pod`,
  crash dumps, `/proc/*/environ`).
- Audit all secret access — who read what, when.
- Revoke immediately on employee departure or credential compromise.

---

## Image Scanning

### Pipeline Integration

```yaml
# Scan in CI before pushing to registry
- name: Scan image
  run: |
    trivy image --exit-code 1 --severity CRITICAL,HIGH \
      --ignore-unfixed myapp:${{ github.sha }}
```

### Scanning Layers

| Layer | Tool | When |
|---|---|---|
| Base image CVEs | Trivy, Grype | Every build + nightly |
| Application dependencies | Snyk, npm audit, pip-audit | Every build |
| IaC misconfigurations | Checkov, tfsec, KICS | Every PR |
| Secrets in code | gitleaks, trufflehog | Every commit |
| Runtime behavior | Falco, Sysdig | Continuous |
| Container compliance | Docker Bench, OPA | Nightly |

### Rules

- Block deployment on CRITICAL or HIGH vulnerabilities.
- Allow MEDIUM/LOW with documented exception and timeline to fix.
- Scan running images nightly — new CVEs appear after deploy.
- Track vulnerability metrics: time-to-remediate, open count by severity.
- Base image rebuilds trigger downstream rebuilds automatically.

---

## Audit Logging

### What to Log

| Event | Required Fields |
|---|---|
| Authentication (success/fail) | who, when, source IP, method |
| Authorization (denied) | who, what resource, what action |
| Resource creation/modification/deletion | who, what, when, before/after |
| Secret access | who, which secret, when |
| Configuration changes | who, what changed, PR link |
| Privilege escalation | who, from/to role, when |

### Implementation

- Enable cloud provider audit logs (CloudTrail, GCP Audit, Azure Activity).
- Enable K8s audit logging for all write operations.
- Ship audit logs to immutable storage (S3 with Object Lock, WORM).
- Retain audit logs for minimum 1 year (adjust per compliance: SOC2, HIPAA, PCI).
- Alert on: root account usage, IAM policy changes, security group changes,
  failed auth spike, secret access from unexpected sources.

### Kubernetes Audit Policy

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  - level: Metadata
    resources:
      - group: ""
        resources: ["secrets", "configmaps"]
  - level: RequestResponse
    resources:
      - group: ""
        resources: ["pods/exec", "pods/portforward"]
    verbs: ["create"]
  - level: Metadata
    verbs: ["create", "update", "patch", "delete"]
```

---

## Supply Chain Security

- Sign container images with cosign/Sigstore.
- Verify signatures before admission (Kyverno, OPA Gatekeeper).
- Pin dependencies to exact versions (lockfiles).
- Pin CI actions to SHA, not tag.
- Use private registries — pull-through cache for public images.
- Generate and store SBOMs (Software Bill of Materials) with each build.
- Review and approve new dependencies before adding.
