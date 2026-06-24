import { logger } from '../utils/logger';

class HealthMonitorService {
  private interval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.interval) return;
    logger.info('Health monitor started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info('Health monitor stopped');
  }
}

export const healthMonitorService = new HealthMonitorService();
