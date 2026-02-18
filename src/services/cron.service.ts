import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BidService } from './amazon/bid.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private bidService: BidService) {}

  // Run every 4 hours
  // @Cron('0 */4 * * *', {
  //   name: 'bid-adjustment',
  //   timeZone: 'America/New_York',
  // })
  // async handleBidAdjustmentCron() {
  //   this.logger.log('Starting scheduled bid adjustment job');
  //   try {
  //     // First, sync latest campaign data from Amazon
  //     // await this.bidAdjustmentService.syncCampaignData();
  //     // Then adjust bids based on ROI
  //     // await this.bidService.adjustBidsForAllCampaigns();
  //     this.logger.log('Scheduled bid adjustment job completed successfully');
  //   } catch (error) {
  //     this.logger.error('Error in scheduled bid adjustment job', error);
  //   }
  // }

  // Optional: Daily sync at midnight
  // @Cron('0 0 * * *', {
  //   name: 'daily-sync',
  //   timeZone: 'America/New_York',
  // })
  // async handleDailySyncCron() {
  //   this.logger.log('Starting daily campaign data sync');
  //   try {
  //     // await this.bidAdjustmentService.syncCampaignData();
  //     this.logger.log('Daily campaign data sync completed');
  //   } catch (error) {
  //     this.logger.error('Error in daily sync job', error);
  //   }
  // }
}
