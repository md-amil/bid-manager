import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SyncProducer {
  private readonly logger = new Logger(SyncProducer.name);
  constructor(@InjectQueue('campaignSync') private syncQueue: Queue) {}

  async syncCampaignData(scopeId: string = '3838241482724308'): Promise<any> {
    this.logger.log('Syncing campaign data from Amazon API');
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const job = await this.syncQueue.add('sync', {
        scopeId,
        endDate,
        startDate,
      });
      return job;
    } catch (error) {
      this.logger.error('Error syncing campaign data');
    }
  }
}
