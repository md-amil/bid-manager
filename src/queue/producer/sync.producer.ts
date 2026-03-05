import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { IAmazonAuth } from 'src/interfaces/index.type';

@Injectable()
export class SyncProducer {
  private readonly logger = new Logger(SyncProducer.name);
  constructor(
    @InjectQueue('campaignSync') private syncQueue: Queue,
    private readonly cls: ClsService
  ) { }

  async syncCampaignData(auth:IAmazonAuth): Promise<any> {
    this.logger.log('Syncing campaign data from Amazon API');
    const scopeId = this.cls.get('scopeId');
    const accessToken = this.cls.get('accessToken');
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const job = await this.syncQueue.add('sync', {
        auth:auth??{
          accessToken,
          scopeId,
        },
        endDate,
        startDate,
      });
      return job;
    } catch (error) {
      this.logger.error('Error syncing campaign data',);
    }
  }
}