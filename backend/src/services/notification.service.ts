import { logger } from '../utils/logger';

class NotificationService {
  private enabled = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  async send(title: string, message: string): Promise<void> {
    if (!this.enabled) return;
    logger.info(`Notification: ${title} - ${message}`);
  }
}

export const notificationService = new NotificationService();
