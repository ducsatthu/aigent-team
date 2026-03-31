---
name: Rollback Procedure
description: Revert a deployment due to errors, performance regression, or unexpected behavior in production
trigger: When a deployment needs to be reverted due to errors, performance regression, or unexpected behavior in production.
useCases:
  - DevOps Agent reverting a broken deployment in production
  - Lead Agent coordinating an emergency rollback during an incident
  - DevOps Agent executing a planned rollback after failed canary analysis
tags: [devops, rollback, deployment, incident-response]
governance:
  version: "0.9.0"
  owner: devops-team
  status: draft
---

# Skill: Rollback Procedure

**Trigger**: When a deployment needs to be reverted due to errors, performance regression, or unexpected behavior in production.

## Steps

1. **Assess the situation**:
   - What symptoms are observed? (errors, latency, data corruption)
   - When did the issue start? (correlate with deployment time)
   - What was deployed? (commit hash, image tag, config changes)
   - Is this a full outage or degraded service?

2. **Decide rollback strategy**:
   - **Application rollback**: revert to previous container image/build
   - **Database rollback**: run down-migration (only if migration was part of deploy)
   - **Config rollback**: revert environment variables or feature flags
   - **Infrastructure rollback**: revert IaC changes via previous state

3. **Execute application rollback**:
   ```bash
   # Kubernetes
   kubectl rollout undo deployment/service-name
   kubectl rollout status deployment/service-name

   # Docker Compose
   docker compose up -d --no-build  # with previous image tag in .env

   # AWS ECS
   aws ecs update-service --cluster prod --service service-name --task-definition service-name:PREVIOUS_VERSION
   ```

4. **Verify rollback succeeded**:
   - Run health checks (use health-check skill)
   - Check error rates in monitoring dashboard
   - Verify the previous version is running:
     ```bash
     kubectl get deployment service-name -o jsonpath='{.spec.template.spec.containers[0].image}'
     ```

5. **Communicate status**:
   - Notify stakeholders: rollback completed, service restored
   - Create incident ticket with timeline
   - Document: what was deployed, what broke, what was rolled back

6. **Post-rollback**:
   - Do NOT re-deploy the broken version
   - Root cause analysis before next attempt
   - Add test coverage for the failure scenario
   - Update deployment checklist if a step was missed

## Expected Output

- Confirmation that previous version is running
- Health check results showing service is healthy
- Incident timeline documentation
- Root cause investigation action items
