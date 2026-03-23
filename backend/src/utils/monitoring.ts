/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import os from 'os';
import prisma from './prisma';
import { logger } from './logger';

/**
 * Application metrics tracking
 */
interface AppMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    lastMinute: number;
  };
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
}

const metrics: AppMetrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    lastMinute: 0,
  },
  responseTime: {
    avg: 0,
    p95: 0,
    p99: 0,
  },
};

// Store response times for percentile calculation
const responseTimes: number[] = [];
const MAX_RESPONSE_TIMES = 1000; // Keep last 1000 requests

// Reset per-minute counter every minute
setInterval(() => {
  metrics.requests.lastMinute = 0;
}, 60000);

/**
 * Track a request
 */
export function trackRequest(success: boolean, responseTime: number): void {
  metrics.requests.total++;
  metrics.requests.lastMinute++;
  
  if (success) {
    metrics.requests.success++;
  } else {
    metrics.requests.errors++;
  }

  // Track response time
  responseTimes.push(responseTime);
  if (responseTimes.length > MAX_RESPONSE_TIMES) {
    responseTimes.shift();
  }

  // Calculate percentiles
  if (responseTimes.length > 0) {
    const sorted = [...responseTimes].sort((a, b) => a - b);
    metrics.responseTime.avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    metrics.responseTime.p95 = sorted[Math.floor(sorted.length * 0.95)];
    metrics.responseTime.p99 = sorted[Math.floor(sorted.length * 0.99)];
  }
}

/**
 * Get current metrics
 */
export function getMetrics(): AppMetrics {
  return { ...metrics };
}

/**
 * Get system health information
 */
export async function getSystemHealth() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
    },
    process: {
      pid: process.pid,
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    },
    metrics: getMetrics(),
  };
}

/**
 * Check database connectivity
 */
export async function checkDatabase(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get comprehensive health status
 */
export async function getHealthStatus() {
  const [systemHealth, dbHealth] = await Promise.all([
    getSystemHealth(),
    checkDatabase(),
  ]);

  const isHealthy = dbHealth.healthy;
  const overallStatus = isHealthy ? 'healthy' : 'unhealthy';

  return {
    ...systemHealth,
    status: overallStatus,
    services: {
      database: dbHealth,
    },
  };
}

/**
 * Middleware to track request metrics
 */
export function metricsMiddleware(_req: any, res: any, next: any) {
  const start = Date.now();
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const success = res.statusCode < 400;
    trackRequest(success, duration);
  });
  
  next();
}

// Made with Bob
