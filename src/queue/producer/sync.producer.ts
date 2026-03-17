import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { IAmazonAuth } from 'src/interfaces/index.type';
import { CampaignService } from 'src/services/campaign.service';

@Injectable()
export class SyncProducer {
  private readonly logger = new Logger(SyncProducer.name);
  constructor(
    @InjectQueue('campaignSync') private syncQueue: Queue,
    private campaignService:CampaignService,
    private readonly cls: ClsService
  ) { }

  async syncCampaignData(auth?: IAmazonAuth): Promise<any> {
    this.logger.log('Syncing campaign data from Amazon API');
    const scopeId = this.cls.get('scopeId');
    const accessToken = this.cls.get('accessToken');
    try {
      const job = await this.syncQueue.add('sync', {
        auth: auth ?? {
          accessToken,
          scopeId,
        },
      });
      return job;
    } catch (error) {
      this.logger.error('Error syncing campaign data',);
    }
  }


  async initializeSyncing(auth: IAmazonAuth) {
    const campaigns = await this.campaignService.getCampaigns(auth.scopeId)
    if(campaigns.length) return console.log("campaign already initialized")
    this.syncCampaignData(auth)
  }
}