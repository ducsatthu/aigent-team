# Infrastructure as Code Reference

## Terraform Directory Structure

```
infra/
├── modules/                    # Reusable modules (internal registry)
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── eks-cluster/
│   ├── rds/
│   └── s3-bucket/
├── environments/
│   ├── dev/
│   │   ├── main.tf            # Module calls with dev params
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfvars   # Dev-specific values
│   │   ├── backend.tf         # Remote state config for dev
│   │   └── providers.tf
│   ├── staging/
│   └── production/
├── global/                     # Shared resources (IAM, DNS zones)
│   ├── iam/
│   ├── dns/
│   └── ecr/
└── scripts/
    ├── plan.sh
    ├── apply.sh
    └── import.sh
```

### Rules

- One state file per environment per component. Never share state across envs.
- `global/` resources are applied once and referenced via `terraform_remote_state`
  or SSM parameters.
- Modules live in a separate repo or `modules/` directory with semantic versions.

---

## State Management

### Remote Backend (AWS Example)

```hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "environments/production/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

### State Rules

1. **Always remote.** Never commit `.tfstate` to git.
2. **Always locked.** DynamoDB (AWS), GCS (GCP), or Terraform Cloud.
3. **Always encrypted.** Enable server-side encryption on the bucket.
4. **State per component.** Split large configs: `network`, `compute`, `data`,
   `monitoring`. Cross-reference with `terraform_remote_state`.
5. **Never hand-edit state.** Use `terraform state mv`, `terraform import`,
   `terraform state rm`.

### State Key Convention

```
environments/{env}/{component}/terraform.tfstate
```

Examples: `environments/production/network/terraform.tfstate`,
`environments/staging/eks/terraform.tfstate`.

---

## Plan-Review-Apply Cycle

```
Developer pushes IaC change
  → CI runs `terraform fmt -check`
  → CI runs `terraform validate`
  → CI runs `tflint` / `checkov` / `tfsec`
  → CI runs `terraform plan` and posts output to PR
  → Reviewer approves plan output (not just code)
  → Merge triggers `terraform apply` with saved plan file
  → Apply output posted to PR / Slack
```

### Plan Safety

- Always save plan to file: `terraform plan -out=tfplan`
- Apply the exact plan: `terraform apply tfplan`
- Never run `terraform apply` without a saved plan in CI.
- Require plan output review for any change touching production.

### Drift Detection

- Schedule weekly `terraform plan` in CI (no apply).
- Alert if drift detected (non-empty plan on unchanged code).
- Investigate and reconcile — do not auto-apply drift corrections.

---

## Module Versioning

### Semantic Versioning

```hcl
module "vpc" {
  source  = "git::https://github.com/company/tf-modules.git//vpc?ref=v2.1.0"
}
```

- **Major** (v2→v3): Breaking changes — variable removed, resource recreated.
- **Minor** (v2.1→v2.2): New feature — new optional variable, new output.
- **Patch** (v2.1.0→v2.1.1): Bug fix — no interface change.

### Rules

- Pin module versions in all environments. Never use `ref=main`.
- Upgrade dev first, validate, then promote to staging, then production.
- Module changes require a CHANGELOG entry.
- Modules must have `variables.tf` with descriptions and types for every input.
- Modules must have `outputs.tf` exposing values consumers need.

---

## Import Before Recreate

When Terraform wants to destroy and recreate a critical resource:

1. **Stop.** Review the plan carefully.
2. Check if `lifecycle { prevent_destroy = true }` should be set.
3. If migrating existing infrastructure into Terraform:
   ```bash
   terraform import aws_db_instance.main my-database-id
   ```
4. After import, run `plan` — adjust config until plan shows no changes.
5. For state moves (renaming resources):
   ```bash
   terraform state mv aws_s3_bucket.old aws_s3_bucket.new
   ```
6. Use `moved` blocks (Terraform 1.1+) for refactoring:
   ```hcl
   moved {
     from = aws_s3_bucket.old
     to   = aws_s3_bucket.new
   }
   ```

---

## Tagging Policy

Every cloud resource must carry these tags:

| Tag | Example | Purpose |
|---|---|---|
| `Environment` | `production` | Cost allocation, access control |
| `Team` | `platform` | Ownership |
| `Service` | `user-api` | Dependency mapping |
| `ManagedBy` | `terraform` | Drift tracking |
| `CostCenter` | `eng-platform` | Finance reporting |
| `Repository` | `github.com/co/infra` | Code traceability |

### Enforcement

```hcl
# In provider or module
default_tags {
  tags = {
    Environment = var.environment
    Team        = var.team
    ManagedBy   = "terraform"
    Repository  = var.repository
  }
}
```

- Use AWS Config rules, GCP Organization Policies, or OPA/Sentinel to reject
  untagged resources.
- CI lint step checks every resource block for required tags.

---

## Resource Naming Convention

```
{company}-{environment}-{region}-{service}-{resource_type}[-{qualifier}]
```

Examples:
- `acme-prod-use1-userapi-rds-primary`
- `acme-stg-euw1-platform-eks`
- `acme-dev-use1-shared-vpc`

### Rules

- Lowercase, hyphens only (no underscores — some cloud providers reject them).
- Max 63 characters (DNS label limit).
- Region abbreviated: `use1` = us-east-1, `euw1` = eu-west-1.
- Use variables and `locals` to construct names — never hardcode.

```hcl
locals {
  name_prefix = "${var.company}-${var.environment}-${var.region_short}-${var.service}"
}

resource "aws_s3_bucket" "assets" {
  bucket = "${local.name_prefix}-assets"
}
```

---

## Terraform Style Guide

- `terraform fmt` on every save. Enforce in CI.
- One resource type per file for large configs, or group by logical domain.
- Variables: always include `description`, `type`, and `default` (if optional).
- Outputs: always include `description`.
- Use `count` for simple toggles, `for_each` for collections.
- Avoid `depends_on` unless absolutely necessary — implicit dependencies preferred.
- Keep provider versions pinned with `~>` (pessimistic constraint):
  ```hcl
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  ```
