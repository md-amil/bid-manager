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
      const job = await this.syncQueue.add('sync', {
        auth:auth??{
          accessToken,
          scopeId,
        },
      });
      return job;
    } catch (error) {
      this.logger.error('Error syncing campaign data',);
    }
  }
}