---
title: Cost Optimization
description: Right-sizing strategies, reserved capacity planning, storage lifecycle policies, and budget alerting.
whenToRead: When reviewing cloud spend, right-sizing resources, or setting up cost controls
tags: [devops, cost, cloud, optimization]
---

# Cost Optimization Reference

## Right-Sizing

### Process

1. **Collect data.** 14-30 days of CPU and memory utilization metrics.
2. **Identify waste.** Instances/pods where p95 utilization < 30%.
3. **Resize.** Adjust resource requests/limits or instance type.
4. **Validate.** Monitor for 7 days post-change. Watch for OOMs and throttling.
5. **Repeat.** Monthly right-sizing review.

### Kubernetes Right-Sizing

```
# Current allocation vs actual usage
Allocated CPU: 4000m → p95 usage: 800m → Right-size to: 1000m request, 2000m limit
Allocated Memory: 4Gi → p95 usage: 1.2Gi → Right-size to: 1.5Gi request, 2Gi limit
```

- Use VPA (Vertical Pod Autoscaler) in recommendation mode for data.
- Use Goldilocks or Kubecost for visibility.
- Set HPA (Horizontal Pod Autoscaler) based on CPU, memory, or custom metrics.
- Review HPA min/max replicas quarterly — over-provisioned minimums waste money.

### Compute Right-Sizing

| Signal | Action |
|---|---|
| CPU p95 < 20% | Downsize instance or reduce CPU request |
| Memory p95 < 40% | Downsize instance or reduce memory request |
| CPU p95 > 80% | Upsize or add HPA |
| Memory p95 > 80% | Upsize — memory pressure causes OOMs |
| GPU utilization < 50% | Consider time-sharing or smaller GPU |

---

## Reserved Capacity

### When to Reserve

| Workload Pattern | Strategy | Savings |
|---|---|---|
| Steady 24/7 (databases, core APIs) | Reserved Instances / Committed Use | 30-60% |
| Steady daytime only | Reserved + scheduled scaling | 20-40% |
| Spiky / batch | Spot/Preemptible + on-demand fallback | 50-80% |
| Unpredictable | On-demand (do not reserve) | 0% |

### Rules

- Reserve only after 3+ months of stable usage data.
- Start with 1-year reservations. Use 3-year only for well-understood workloads.
- Prefer convertible reservations over standard (flexibility to change instance type).
- Review reservation coverage monthly. Unused reservations are pure waste.
- Use AWS Savings Plans (compute flexibility) over RIs where possible.

### Spot / Preemptible Instances

- Use for: CI runners, batch jobs, stateless workers, dev/test environments.
- Never use for: databases, stateful services, single-replica production.
- Always implement graceful shutdown handling (SIGTERM).
- Use multiple instance types and AZs for spot diversification.
- Set `maxPrice` slightly above on-demand to avoid bidding wars.

---

## Storage Lifecycle

### S3 / Object Storage Lifecycle

```
Day 0-30:   Standard storage (frequent access)
Day 30-90:  Infrequent Access (IA)
Day 90-365: Glacier / Archive
Day 365+:   Delete or Deep Archive (per compliance)
```

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "archive-old-assets"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    expiration {
      days = 365
    }
  }
}
```

### Storage Cost Traps

| Trap | Fix |
|---|---|
| Unattached EBS volumes | Weekly scan and delete, tag with expiry |
| Old snapshots | Lifecycle policy, delete snapshots older than retention |
| Unused Elastic IPs | Release unattached EIPs (they cost money when idle) |
| Oversized volumes | Right-size based on usage, use gp3 over gp2 |
| Log retention forever | Set TTL: 7d hot, 30d warm, 90d cold |
| Uncompressed backups | Enable compression before archiving |

---

## Data Transfer Costs

### Cost Hierarchy (AWS, typical)

```
Free:        Inbound from internet, same-AZ within VPC
Cheap:       Cross-AZ within region (~$0.01/GB)
Moderate:    Cross-region (~$0.02/GB)
Expensive:   Outbound to internet (~$0.09/GB)
```

### Optimization Strategies

- **Keep traffic in-AZ.** Co-locate services that communicate heavily.
- **Use VPC endpoints.** Avoid NAT Gateway charges for AWS service access
  (S3, DynamoDB, ECR).
- **CDN for static assets.** CloudFront/Cloudflare reduces origin egress.
- **Compress data in transit.** gzip/brotli for HTTP, compression for backups.
- **Cache aggressively.** Redis/Memcached for repeated external API calls.
- **Use Private Link** for cross-account or cross-VPC communication.

### NAT Gateway Cost Alert

NAT Gateways charge per GB processed. Common cost traps:
- Docker image pulls through NAT (use VPC endpoint for ECR).
- Log shipping through NAT (use VPC endpoint for CloudWatch/S3).
- S3 access through NAT (use S3 gateway endpoint — it is free).

---

## Budget Alerts

### Alert Thresholds

| Threshold | Action |
|---|---|
| 50% of monthly budget | Info notification to Slack |
| 75% of monthly budget | Warning to team lead |
| 90% of monthly budget | Alert to engineering manager |
| 100% of monthly budget | Escalate — investigate immediately |
| Anomaly (> 20% day-over-day) | Alert to on-call |

### Implementation

```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "monthly-total"
  budget_type  = "COST"
  limit_amount = "50000"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 75
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.budget_alerts.arn]
  }
}
```

### Per-Team Budgets

- Tag all resources with `CostCenter` and `Team`.
- Create per-team budget alerts.
- Share cost dashboards with engineering leads weekly.
- Include cost delta in deploy notifications.

---

## Tagging for Cost Tracking

### Required Tags (reiterated from IaC reference)

| Tag | Purpose for Cost |
|---|---|
| `Environment` | Split prod vs dev/staging spend |
| `Team` | Ownership and accountability |
| `Service` | Per-service cost tracking |
| `CostCenter` | Finance allocation |

### Cost Allocation Reports

- Enable AWS Cost and Usage Reports (CUR) or GCP billing export.
- Visualize in Grafana, Kubecost, or cloud-native tools.
- Track: cost per service, cost per environment, cost per customer (if multi-tenant).
- Review weekly in engineering stand-up.

---

## Quick Wins Checklist

- [ ] Delete unattached EBS volumes and unused EIPs.
- [ ] Enable S3 lifecycle policies on all buckets.
- [ ] Use gp3 instead of gp2 for EBS volumes (20% cheaper, better performance).
- [ ] Add VPC endpoints for S3, ECR, CloudWatch, DynamoDB.
- [ ] Right-size RDS instances (check Performance Insights).
- [ ] Stop or terminate dev/staging resources outside business hours.
- [ ] Use Graviton/ARM instances where possible (20% cheaper).
- [ ] Enable Spot for CI runners and batch jobs.
- [ ] Compress and set TTL on all log streams.
- [ ] Review and delete old container images in ECR (lifecycle policy).
- [ ] Consolidate underutilized EKS clusters.
- [ ] Enable S3 Intelligent-Tiering for unpredictable access patterns.
