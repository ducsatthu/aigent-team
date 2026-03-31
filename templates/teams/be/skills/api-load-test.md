---
name: API Load Test
description: Validate endpoint performance under load using k6, autocannon, or hey and analyze bottlenecks
trigger: When validating endpoint performance under load, before a release with traffic expectations, or investigating latency issues.
useCases:
  - BE Agent benchmarking a new endpoint before production release
  - QA Agent running performance regression tests in CI
  - DevOps Agent investigating latency spikes in a production service
tags: [be, performance, load-testing, benchmarking]
---

# Skill: API Load Test

**Trigger**: When validating endpoint performance under load, before a release with traffic expectations, or investigating latency issues.

## Steps

1. **Identify target endpoints** — Focus on:
   - High-traffic endpoints (homepage, search, API gateways)
   - Endpoints with database queries (list, search, aggregation)
   - Endpoints with external dependencies (third-party APIs, file uploads)

2. **Define load profile**:
   - Expected concurrent users
   - Requests per second target
   - Ramp-up period
   - Test duration (minimum 5 minutes for stable results)

3. **Run load test**:
   ```bash
   # Using k6
   k6 run --vus 50 --duration 5m load-test.js
   # Using autocannon
   npx autocannon -c 50 -d 300 http://localhost:3000/api/endpoint
   # Using hey
   hey -n 10000 -c 50 http://localhost:3000/api/endpoint
   ```

4. **Collect metrics** — Measure during the test:
   - Response time: p50, p95, p99
   - Throughput: requests/second
   - Error rate: 4xx, 5xx percentage
   - Resource usage: CPU, memory, DB connections, open file descriptors

5. **Analyze results**:
   - Compare against SLA targets (e.g., p95 < 200ms)
   - Identify bottlenecks (slow queries, connection pool exhaustion, CPU saturation)
   - Check for memory leaks (growing memory over test duration)

6. **Document findings** — Record baseline for future comparison

## Expected Output

- Performance summary table (p50, p95, p99, throughput, error rate)
- Identified bottlenecks with specific recommendations
- Baseline metrics for regression tracking
