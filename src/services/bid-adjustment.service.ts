import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';
import { ConfigService } from '@nestjs/config';
import { AmazonApiService } from './amazon-api.service';

@Injectable()
export class BidAdjustmentService {
  private readonly logger = new Logger(BidAdjustmentService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
    private configService: ConfigService,
    private amazonApiService: AmazonApiService,
  ) {}

  calculateROI(sales: number, spend: number): number {
    if (spend === 0) return 0;
    return sales / spend;
  }

  calculateNewBid(currentBid: number, roi: number): { newBid: number; reason: string; percentage: number } {
    const highRoiThreshold = parseFloat(this.configService.get('HIGH_ROI_THRESHOLD', '3.0'));
    const lowRoiThreshold = parseFloat(this.configService.get('LOW_ROI_THRESHOLD', '1.0'));
    const increasePercentage = parseFloat(this.configService.get('BID_INCREASE_PERCENTAGE', '15'));
    const decreasePercentage = parseFloat(this.configService.get('BID_DECREASE_PERCENTAGE', '10'));
    const minBid = parseFloat(this.configService.get('MIN_BID_AMOUNT', '0.25'));
    const maxBid = parseFloat(this.configService.get('MAX_BID_AMOUNT', '10.00'));

    let newBid = currentBid;
    let reason = 'No adjustment needed';
    let percentage = 0;

    if (roi >= highRoiThreshold) {
      // High ROI - increase bid
      percentage = increasePercentage;
      newBid = currentBid * (1 + increasePercentage / 100);
      reason = `High ROI (${roi.toFixed(2)}) - Increasing bid`;
    } else if (roi <= lowRoiThreshold && roi > 0) {
      // Low ROI - decrease bid
      percentage = -decreasePercentage;
      newBid = currentBid * (1 - decreasePercentage / 100);
      reason = `Low ROI (${roi.toFixed(2)}) - Decreasing bid`;
    }

    // Apply min/max constraints
    newBid = Math.max(minBid, Math.min(maxBid, newBid));
    newBid = Math.round(newBid * 100) / 100; // Round to 2 decimal places

    return { newBid, reason, percentage };
  }

  async adjustBidsForAllCampaigns(): Promise<void> {
    this.logger.log('Starting bid adjustment process for all campaigns');

    try {
      const campaigns = await this.campaignModel.find({ status: 'active' }).exec();
      this.logger.log(`Found ${campaigns.length} active campaigns`);

      for (const campaign of campaigns) {
        await this.adjustBidForCampaign(campaign);
      }

      this.logger.log('Bid adjustment process completed');
    } catch (error) {
      this.logger.error('Error during bid adjustment process', error);
      throw error;
    }
  }

  async adjustBidForCampaign(campaign: CampaignDocument): Promise<void> {
    try {
      // Calculate ROI
      const roi = this.calculateROI(campaign.sales, campaign.spend);
      
      // Update campaign ROI
      campaign.roi = roi;
      await campaign.save();

      // Calculate new bid
      const { newBid, reason, percentage } = this.calculateNewBid(campaign.currentBid, roi);

      // Only adjust if bid has changed
      if (newBid !== campaign.currentBid) {
        this.logger.log(
          `Adjusting bid for campaign ${campaign.campaignId} (${campaign.keyword}): ` +
          `${campaign.currentBid} -> ${newBid} (ROI: ${roi.toFixed(2)})`
        );

        // Update bid via Amazon API
        try {
          await this.amazonApiService.updateKeywordBid(campaign.campaignId, newBid);

          // Log successful adjustment
          await this.logBidAdjustment(
            campaign,
            campaign.currentBid,
            newBid,
            roi,
            reason,
            percentage,
            'success'
          );

          // Update campaign with new bid
          campaign.currentBid = newBid;
          campaign.lastAdjustedAt = new Date();
          await campaign.save();

        } catch (apiError) {
          this.logger.error(`Failed to update bid via Amazon API for ${campaign.campaignId}`, apiError);
          
          // Log failed adjustment
          await this.logBidAdjustment(
            campaign,
            campaign.currentBid,
            newBid,
            roi,
            reason,
            percentage,
            'failed',
            apiError.message
          );
        }
      } else {
        this.logger.log(
          `No bid adjustment needed for campaign ${campaign.campaignId} ` +
          `(ROI: ${roi.toFixed(2)})`
        );
      }
    } catch (error) {
      this.logger.error(`Error adjusting bid for campaign ${campaign.campaignId}`, error);
    }
  }

  private async logBidAdjustment(
    campaign: CampaignDocument,
    oldBid: number,
    newBid: number,
    roi: number,
    reason: string,
    adjustmentPercentage: number,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const log = new this.bidLogModel({
      campaignId: campaign.campaignId,
      keyword: campaign.keyword,
      oldBid,
      newBid,
      roi,
      reason,
      adjustmentPercentage,
      status,
      errorMessage,
    });

    await log.save();
  }

  async syncCampaignData(): Promise<void> {
    this.logger.log('Syncing campaign data from Amazon API');

    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days

      // Get performance report
      const report = await this.amazonApiService.getCampaigns(startDate, endDate);
      console.log(report.campaigns)
      return report.campaigns;
      // Update campaigns in database
      // Note: This is simplified - you'll need to parse the actual report format
      // if (report && report.data) {
      //   this.logger.log('Campaign data synced successfully');
      // }
    } catch (error) {
      this.logger.error('Error syncing campaign data', );
    }
  }
}
