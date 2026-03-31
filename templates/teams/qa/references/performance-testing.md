---
title: Performance Testing
description: Load scenario types, k6 script templates, and threshold definitions for smoke, load, stress, soak, and spike tests.
whenToRead: When writing k6 performance scripts, defining load scenarios, or setting SLO-based thresholds.
tags: [qa, performance, k6, load-testing]
---

# Performance Testing Reference

## Load Scenario Types

| Scenario | Purpose | VUs | Duration | When to run |
|---|---|---|---|---|
| **Smoke** | Verify script works, baseline response | 1-5 | 1 min | Every PR (fast gate) |
| **Load** | Validate SLOs under expected traffic | Target VUs | 10-30 min | Nightly / pre-release |
| **Stress** | Find breaking point | Ramp beyond target | 15-30 min | Weekly / pre-release |
| **Soak** | Detect memory leaks, connection exhaustion | Target VUs | 2-8 hours | Weekly (off-hours) |
| **Spike** | Verify recovery from sudden traffic burst | 0 → peak → 0 | 5-10 min | Pre-release |

---

## k6 Script Examples

### Basic Load Test

```javascript
// tests/performance/load-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const orderLatency = new Trend('order_latency');

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // ramp up
        { duration: '5m', target: 50 },   // steady state
        { duration: '2m', target: 0 },    // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    errors: ['rate<0.01'],
    order_latency: ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // GET — list products
  const listRes = http.get(`${BASE_URL}/api/products`);
  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list has items': (r) => JSON.parse(r.body).length > 0,
  }) || errorRate.add(1);

  sleep(1); // think time between actions

  // POST — create order
  const payload = JSON.stringify({
    items: [{ sku: 'WIDGET-1', quantity: 1 }],
  });
  const orderRes = http.post(`${BASE_URL}/api/orders`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  orderLatency.add(orderRes.timings.duration);
  check(orderRes, {
    'order status 201': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(2);
}
```

### Smoke Test (CI-friendly)

```javascript
// tests/performance/smoke-api.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/health`);
  check(res, {
    'status 200': (r) => r.status === 200,
  });
}
```

### Stress Test

```javascript
// tests/performance/stress-api.js
export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 100 },
        { duration: '3m', target: 200 },   // beyond expected capacity
        { duration: '3m', target: 400 },   // find the breaking point
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // relaxed for stress
    http_req_failed: ['rate<0.05'],     // 5% error rate acceptable
  },
};
```

### Spike Test

```javascript
export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   // baseline
        { duration: '10s', target: 500 },  // spike
        { duration: '2m', target: 500 },   // hold spike
        { duration: '10s', target: 10 },   // drop back
        { duration: '2m', target: 10 },    // recovery
      ],
    },
  },
};
```

---

## Artillery Script Example

```yaml
# tests/performance/load.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 120
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
  ensure:
    p95: 500
    maxErrorRate: 1

scenarios:
  - name: "Browse and order"
    flow:
      - get:
          url: "/api/products"
          capture:
            - json: "$[0].id"
              as: "productId"
      - think: 2
      - post:
          url: "/api/orders"
          json:
            items:
              - productId: "{{ productId }}"
                quantity: 1
          expect:
            - statusCode: 201
```

---

## Threshold Definitions

Thresholds must be derived from SLOs, not arbitrary numbers.

### Mapping SLOs to Thresholds

| SLO | k6 Threshold |
|---|---|
| 99.9 % availability | `http_req_failed: ['rate<0.001']` |
| p95 latency < 500 ms | `http_req_duration: ['p(95)<500']` |
| p99 latency < 1500 ms | `http_req_duration: ['p(99)<1500']` |
| Zero errors on critical path | Custom metric with `rate<0.0` |

### Custom Thresholds

```javascript
export const options = {
  thresholds: {
    // Built-in metrics
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],

    // Custom metrics (tagged)
    'http_req_duration{name:createOrder}': ['p(95)<800'],
    'http_req_duration{name:listProducts}': ['p(95)<200'],

    // Custom counters
    errors: ['rate<0.01'],
  },
};
```

### Tagging Requests

```javascript
http.post(`${BASE_URL}/api/orders`, payload, {
  tags: { name: 'createOrder' },
});
```

---

## Production-Like Environment Requirement

Performance tests are meaningless unless the environment matches production:

### Checklist

- [ ] Same instance types / resource limits (CPU, memory)
- [ ] Same database engine, version, and dataset size (or representative subset)
- [ ] Same network topology (load balancer, CDN excluded or simulated)
- [ ] Same connection pool sizes and timeouts
- [ ] Same external service latencies (mock with realistic delays)
- [ ] Same application configuration (caching, rate limits, feature flags)

### Data Volume

- Load a representative dataset before running tests.
- For a 10M-row production table, use at least 1M rows in perf test DB.
- Index behaviour changes with data volume — small datasets hide slow queries.

### Isolation

- Never run performance tests against production.
- Never share the perf environment with other test suites during a run.
- Reset environment state between runs for reproducibility.

---

## Baseline Tracking

### Why Track Baselines?

A single performance test run is a snapshot. Trends tell the real story.
Track baselines to detect gradual degradation.

### Process

1. **Establish baseline**: Run load test 3 times on a known-good build.
   Average the results.
2. **Store results**: Push metrics to a time-series database (InfluxDB,
   Prometheus) or flat JSON files in the repo.
3. **Compare on PR**: Run smoke perf test, compare against baseline.
   Fail if p95 regresses by > 20 %.
4. **Update baseline**: After each release, re-run and update.

### k6 Output to JSON

```bash
k6 run --out json=results.json tests/performance/load-api.js
```

### k6 Output to InfluxDB

```bash
k6 run --out influxdb=http://influxdb:8086/k6 tests/performance/load-api.js
```

### Grafana Dashboard

Pair InfluxDB with Grafana for visual trend tracking. Key panels:
- p50 / p95 / p99 latency over time
- Error rate over time
- VUs vs response time (to spot saturation)
- Throughput (req/s) over time
