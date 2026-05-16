/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

export const promRegistry = new Registry();

// Collect default Node.js process metrics: memory, CPU, GC, event loop lag
collectDefaultMetrics({ register: promRegistry, prefix: 'mealplanner_' });

export const httpRequestsTotal = new Counter({
  name: 'mealplanner_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status_code'] as const,
  registers: [promRegistry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'mealplanner_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [promRegistry],
});

export const dbQueryDurationSeconds = new Histogram({
  name: 'mealplanner_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['result'] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [promRegistry],
});
