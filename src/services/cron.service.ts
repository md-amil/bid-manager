import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Campaign, CampaignDocument } from 'src/schemas/campaign.schema';
import { SyncProducer } from 'src/queue/producer/sync.producer';
import { ReportProducer } from 'src/queue/producer/report.producer';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly syncProducer: SyncProducer,
    private readonly reportProducer: ReportProducer,
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignDocument>,
  ) {}

  /**
   * Daily data sync at 02:00 UTC.
   * Fetches all active profile scope IDs from the DB and queues a sync job for each.
   */
  @Cron('0 2 * * *', { name: 'daily-sync', timeZone: 'UTC' })
  async handleDailySync(): Promise<void> {
    this.logger.log('Starting daily campaign data sync');
    try {
      const scopeIds = await this.campaignModel.distinct('scopeId').exec();
      this.logger.log(`Syncing ${scopeIds.length} profile(s)`);

      for (const scopeId of scopeIds as string[]) {
        await this.syncProducer.syncCampaignData(scopeId);
      }

      this.logger.log('Daily sync jobs enqueued');
    } catch (error: unknown) {
      this.logger.error(
        'Daily sync failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Daily report generation at 06:00 UTC.
   * Generates SP campaign, keyword, and search-term reports for each profile.
   * On completion the ReportProcessor automatically triggers the bid-adjustment queue.
   */
  @Cron('0 6 * * *', { name: 'daily-reports', timeZone: 'UTC' })
  async handleDailyReports(): Promise<void> {
    this.logger.log('Starting daily report generation');
    try {
      const scopeIds = await this.campaignModel.distinct('scopeId').exec();
      this.logger.log(`Generating reports for ${scopeIds.length} profile(s)`);

      for (const scopeId of scopeIds as string[]) {
        await this.reportProducer.generateReport(scopeId);
      }

      this.logger.log('Daily report jobs enqueued');
    } catch (error: unknown) {
      this.logger.error(
        'Daily report generation failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
