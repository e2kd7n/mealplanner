/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import prisma from './prisma';

interface LogPrunerConfig {
  logDir: string;
  maxLogSizeMB: number;
  maxLogAgeDays: number;
  maxDatabaseLogsDays: number;
  pruneInterval: number; // milliseconds
}

class LogPruner {
  private config: LogPrunerConfig;
  private pruneTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<LogPrunerConfig>) {
    this.config = {
      logDir: process.env.LOG_DIR || 
        (process.env.NODE_ENV === 'production' ? '/mealplanner/logs' : path.join(process.cwd(), 'logs')),
      maxLogSizeMB: parseInt(process.env.MAX_LOG_SIZE_MB || '50'),
      maxLogAgeDays: parseInt(process.env.MAX_LOG_AGE_DAYS || '30'),
      maxDatabaseLogsDays: parseInt(process.env.MAX_DATABASE_LOGS_DAYS || '30'),
      pruneInterval: parseInt(process.env.LOG_PRUNE_INTERVAL || '86400000'), // 24 hours
      ...config,
    };
  }

  /**
   * Start automatic log pruning
   */
  start(): void {
    if (this.pruneTimer) {
      return; // Already running
    }

    logger.info('Starting log pruner', {
      logDir: this.config.logDir,
      maxLogSizeMB: this.config.maxLogSizeMB,
      maxLogAgeDays: this.config.maxLogAgeDays,
      pruneIntervalHours: this.config.pruneInterval / 3600000,
    });

    // Run immediately on start
    this.pruneAll().catch(error => {
      logger.error('Initial log pruning failed', error);
    });

    // Schedule periodic pruning
    this.pruneTimer = setInterval(() => {
      this.pruneAll().catch(error => {
        logger.error('Scheduled log pruning failed', error);
      });
    }, this.config.pruneInterval);
  }

  /**
   * Stop automatic log pruning
   */
  stop(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
      logger.info('Log pruner stopped');
    }
  }

  /**
   * Prune all logs (files and database)
   */
  async pruneAll(): Promise<void> {
    logger.info('Starting log pruning cycle');
    
    try {
      await Promise.all([
        this.pruneLogFiles(),
        this.pruneDatabaseLogs(),
      ]);
      
      logger.info('Log pruning cycle completed successfully');
    } catch (error) {
      logger.error('Log pruning cycle failed', error);
      throw error;
    }
  }

  /**
   * Prune log files based on size and age
   */
  private async pruneLogFiles(): Promise<void> {
    if (!fs.existsSync(this.config.logDir)) {
      logger.warn('Log directory does not exist', { logDir: this.config.logDir });
      return;
    }

    const files = fs.readdirSync(this.config.logDir);
    const logFiles = files.filter(file => file.endsWith('.log'));
    
    let totalPruned = 0;
    let totalSizeFreed = 0;

    for (const file of logFiles) {
      const filePath = path.join(this.config.logDir, file);
      
      try {
        const stats = fs.statSync(filePath);
        const fileSizeMB = stats.size / (1024 * 1024);
        const fileAgeDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

        // Check if file is too large
        if (fileSizeMB > this.config.maxLogSizeMB) {
          await this.truncateLogFile(filePath, stats.size);
          totalSizeFreed += stats.size;
          totalPruned++;
          logger.info('Truncated oversized log file', {
            file,
            sizeMB: fileSizeMB.toFixed(2),
            maxSizeMB: this.config.maxLogSizeMB,
          });
        }
        // Check if file is too old
        else if (fileAgeDays > this.config.maxLogAgeDays) {
          fs.unlinkSync(filePath);
          totalSizeFreed += stats.size;
          totalPruned++;
          logger.info('Deleted old log file', {
            file,
            ageDays: fileAgeDays.toFixed(1),
            maxAgeDays: this.config.maxLogAgeDays,
          });
        }
      } catch (error) {
        logger.error('Failed to prune log file', { file, error });
      }
    }

    if (totalPruned > 0) {
      logger.info('Log file pruning completed', {
        filesPruned: totalPruned,
        sizeFreedMB: (totalSizeFreed / (1024 * 1024)).toFixed(2),
      });
    }
  }

  /**
   * Truncate a log file to keep only recent entries
   */
  private async truncateLogFile(filePath: string, currentSize: number): Promise<void> {
    try {
      // Keep last 25% of the file
      const keepSize = Math.floor(currentSize * 0.25);
      const skipSize = currentSize - keepSize;

      // Read the last portion of the file
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(keepSize);
      fs.readSync(fd, buffer, 0, keepSize, skipSize);
      fs.closeSync(fd);

      // Write back only the kept portion
      fs.writeFileSync(filePath, buffer);
      
      // Add truncation notice
      const notice = `\n\n=== LOG TRUNCATED ON ${new Date().toISOString()} ===\n\n`;
      fs.appendFileSync(filePath, notice);
    } catch (error) {
      logger.error('Failed to truncate log file', { filePath, error });
      throw error;
    }
  }

  /**
   * Prune old database logs
   */
  private async pruneDatabaseLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.maxDatabaseLogsDays);

      const result = await prisma.clientLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      if (result.count > 0) {
        logger.info('Database logs pruned', {
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString(),
          maxAgeDays: this.config.maxDatabaseLogsDays,
        });
      }
    } catch (error) {
      logger.error('Failed to prune database logs', error);
      throw error;
    }
  }

  /**
   * Get current log statistics
   */
  async getLogStats(): Promise<{
    fileStats: { file: string; sizeMB: number; ageDays: number }[];
    databaseStats: { totalLogs: number; oldestLog: Date | null; newestLog: Date | null };
  }> {
    const fileStats: { file: string; sizeMB: number; ageDays: number }[] = [];

    if (fs.existsSync(this.config.logDir)) {
      const files = fs.readdirSync(this.config.logDir);
      const logFiles = files.filter(file => file.endsWith('.log'));

      for (const file of logFiles) {
        const filePath = path.join(this.config.logDir, file);
        try {
          const stats = fs.statSync(filePath);
          fileStats.push({
            file,
            sizeMB: stats.size / (1024 * 1024),
            ageDays: (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24),
          });
        } catch (error) {
          logger.error('Failed to get stats for log file', { file, error });
        }
      }
    }

    const [totalLogs, oldestLog, newestLog] = await Promise.all([
      prisma.clientLog.count(),
      prisma.clientLog.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.clientLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      fileStats,
      databaseStats: {
        totalLogs,
        oldestLog: oldestLog?.createdAt || null,
        newestLog: newestLog?.createdAt || null,
      },
    };
  }
}

// Singleton instance
const logPruner = new LogPruner();

export default logPruner;

// Made with Bob