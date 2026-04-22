/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import logPruner from '../utils/logPruner';

interface LogEntry {
  level: string;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
  sessionId?: string;
}

interface LogBatchRequest {
  logs: LogEntry[];
}

/**
 * Store client-side logs
 * Accepts batched log entries from frontend
 */
export const storeClientLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { logs } = req.body as LogBatchRequest;

    // Validate request
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      res.status(400).json({ error: 'Invalid log batch format' });
      return;
    }

    // Limit batch size to prevent abuse
    if (logs.length > 100) {
      res.status(400).json({ error: 'Batch size exceeds maximum (100 logs)' });
      return;
    }

    // Validate and sanitize each log entry
    const validLogs = logs
      .filter(log => {
        return (
          log.level &&
          log.message &&
          log.timestamp &&
          typeof log.level === 'string' &&
          typeof log.message === 'string' &&
          typeof log.timestamp === 'number'
        );
      })
      .map(log => ({
        level: log.level.toLowerCase(),
        message: log.message.substring(0, 5000), // Limit message length
        timestamp: BigInt(log.timestamp),
        context: log.context?.substring(0, 255),
        sessionId: log.sessionId?.substring(0, 255) || 'unknown',
        userAgent: log.userAgent?.substring(0, 1000),
        url: log.url?.substring(0, 2000),
        stack: log.stack?.substring(0, 10000),
        data: log.data ? sanitizeLogData(log.data) : null,
      }));

    if (validLogs.length === 0) {
      res.status(400).json({ error: 'No valid logs in batch' });
      return;
    }

    // Store logs in database (async, don't wait)
    prisma.clientLog
      .createMany({
        data: validLogs,
        skipDuplicates: true,
      })
      .catch((error: any) => {
        // Log storage errors but don't fail the request
        logger.error('Failed to store client logs', error);
      });

    // Log critical errors to backend logger for immediate alerting
    const criticalErrors = validLogs.filter(log => log.level === 'error');
    if (criticalErrors.length > 0) {
      criticalErrors.forEach(log => {
        logger.warn(`Client Error: ${log.message}`, {
          context: log.context,
          sessionId: log.sessionId,
          url: log.url,
        });
      });
    }

    // Return success immediately (don't wait for DB write)
    res.status(202).json({ 
      success: true, 
      received: validLogs.length,
      message: 'Logs accepted for processing'
    });
  } catch (error) {
    logger.error('Error processing client logs', error);
    res.status(500).json({ error: 'Failed to process logs' });
  }
};

/**
 * Get client logs (admin only)
 */
export const getClientLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      level,
      context,
      sessionId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    const where: any = {};

    if (level) where.level = level as string;
    if (context) where.context = context as string;
    if (sessionId) where.sessionId = sessionId as string;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.clientLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 1000),
        skip: Number(offset),
      }),
      prisma.clientLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    logger.error('Error fetching client logs', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

/**
 * Get log statistics (admin only)
 */
export const getLogStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [
      totalLogs,
      errorCount,
      warnCount,
      uniqueSessions,
      topContexts,
      topErrors,
    ] = await Promise.all([
      prisma.clientLog.count({ where }),
      prisma.clientLog.count({ where: { ...where, level: 'error' } }),
      prisma.clientLog.count({ where: { ...where, level: 'warn' } }),
      prisma.clientLog.groupBy({
        by: ['sessionId'],
        where,
        _count: true,
      }),
      prisma.clientLog.groupBy({
        by: ['context'],
        where,
        _count: true,
        orderBy: { _count: { context: 'desc' } },
        take: 10,
      }),
      prisma.clientLog.groupBy({
        by: ['message'],
        where: { ...where, level: 'error' },
        _count: true,
        orderBy: { _count: { message: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      totalLogs,
      errorCount,
      warnCount,
      uniqueSessions: uniqueSessions.length,
      topContexts: topContexts.map((c: any) => ({
        context: c.context,
        count: c._count,
      })),
      topErrors: topErrors.map((e: any) => ({
        message: e.message.substring(0, 100),
        count: e._count,
      })),
    });
  } catch (error) {
    logger.error('Error fetching log stats', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * Delete old logs (admin only, for maintenance)
 */
export const deleteOldLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { daysOld = 30 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(daysOld));

    const result = await prisma.clientLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Deleted ${result.count} old client logs`);
    res.json({ 
      success: true, 
      deleted: result.count,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    logger.error('Error deleting old logs', error);
    res.status(500).json({ error: 'Failed to delete logs' });
  }
};

/**
 * Sanitize log data to prevent storing sensitive information
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apikey',
    'authorization',
    'cookie',
    'session',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    } else if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      // Truncate very long strings
      sanitized[key] = sanitized[key].substring(0, 1000) + '... [truncated]';
    }
  }

  return sanitized;
}

/**
 * Get log file and database statistics (admin only)
 */
export const getLogFileStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await logPruner.getLogStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching log file stats', error);
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
};

/**
 * Manually trigger log pruning (admin only)
 */
export const triggerLogPruning = async (_req: Request, res: Response): Promise<void> => {
  try {
    await logPruner.pruneAll();
    res.json({
      success: true,
      message: 'Log pruning completed successfully'
    });
  } catch (error) {
    logger.error('Error triggering log pruning', error);
    res.status(500).json({ error: 'Failed to prune logs' });
  }
};

// Made with Bob