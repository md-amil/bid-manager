import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../../schemas/campaign.schema';
// import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../../schemas/bid-adjustment-log.schema';
import { ConfigService } from '@nestjs/config';
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { ReportDocument } from 'src/schemas/reports/report.schema';
import { OptimizationLog } from 'src/schemas/optimization.schema';
import { REASON } from 'src/utils/constant';


type TCalWindow = '1d' | '7d' | '14d' | '30d';
type MetricFn = (spend: number, sales: number) => number | null;
type BudgetDecision = {
  campaignId: number,
  currentBudget: number;
  newBudget: number;
  action: 'INCREASE' | 'DECREASE' | 'NO_CHANGE';
  utilization: number;
  reason: string;
  signals:string[];
};

@Injectable()
export class BidService {
  private readonly logger = new Logger(BidService.name);

  constructor(
    @InjectModel(OptimizationLog.name) private optimization: Model<OptimizationLog>,
    private configService: ConfigService,
    // @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    // @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
    // @InjectQueue('campaignSync') private syncQueue: Queue,
  ) { }

  calculator(fn: MetricFn) {
    return (data: any, window: TCalWindow): number | null => {
      const spend = data.spend ?? data.cost ?? 0;
      const salesByWindow = {
        '1d': data.sales1d ?? 0,
        '7d': data.sales7d ?? 0,
        '14d': data.sales14d ?? 0,
        '30d': data.sales30d ?? 0,
      };
      const sales = salesByWindow[window];
      return sales > 0 && spend > 0 ? +fn(spend, sales)!.toFixed(2) : null;
    }
  }

  get getRoi() {
    return this.calculator((spend, sales) => (((sales - spend) / spend) * 100));
  }
  get getAcos() {
    return this.calculator((spend, sales) => (spend / sales) * 100);
  }

  get config() {
    return {
      highRTH: parseFloat(this.configService.get('HIGH_ROI_THRESHOLD', '3.0')),
      lowRTH: parseFloat(this.configService.get('LOW_ROI_THRESHOLD', '1.0')),
      increasePct: parseFloat(this.configService.get('BID_INCREASE_PERCENTAGE', '15')),
      decreasePct: parseFloat(this.configService.get('BID_DECREASE_PERCENTAGE', '10')),
      targetAcos: parseFloat(this.configService.get('TARGET_ACOS', '30')),
      minUtil: parseFloat(this.configService.get('MIN_UTILIZATION', '0.3')),
      minBid: parseFloat(this.configService.get('MIN_BID_AMOUNT', '0.25')),
      maxBid: parseFloat(this.configService.get('MAX_BID_AMOUNT', '10.00')),
    };
  }

  // calculateROI(sales: number, spend: number): number {
  //   if (spend === 0) return 0;
  //   return sales / spend;
  // }

  // calculateNewBid(currentBid: number, roi: number): { newBid: number; reason: string; percentage: number } {



  // }

  // async adjustBidsForAllCampaigns(): Promise<void> {
  //   this.logger.log('Starting bid adjustment process for all campaigns');
  //   try {
  //     const campaigns = await this.campaignModel.find({ status: 'active' }).exec();
  //     this.logger.log(`Found ${campaigns.length} active campaigns`);

  //     for (const campaign of campaigns) {
  //       await this.adjustBidForCampaign(campaign);
  //     }

  //     this.logger.log('Bid adjustment process completed');
  //   } catch (error) {
  //     this.logger.error('Error during bid adjustment process', error);
  //     throw error;
  //   }
  // }

  async adjustBidForCampaign(campaign: CampaignDocument): Promise<void> {
    return
    // try {
    //   // Calculate ROI
    //   const roi = this.calculateROI(campaign.sales, campaign.spend);

    //   // Update campaign ROI
    //   campaign.roi = roi;
    //   await campaign.save();

    //   // Calculate new bid
    //   const { newBid, reason, percentage } = this.calculateNewBid(campaign.currentBid, roi);

    //   // Only adjust if bid has changed
    //   if (newBid !== campaign.currentBid) {
    //     this.logger.log(
    //       `Adjusting bid for campaign ${campaign.campaignId} (${campaign.keyword}): ` +
    //       `${campaign.currentBid} -> ${newBid} (ROI: ${roi.toFixed(2)})`
    //     );

    //     // Update bid via Amazon API
    //     try {
    //       // await this.amazonApiService.updateKeywordBid(campaign.campaignId, newBid);

    //       // Log successful adjustment
    //       await this.logBidAdjustment(
    //         campaign,
    //         campaign.currentBid,
    //         newBid,
    //         roi,
    //         reason,
    //         percentage,
    //         'success'
    //       );

    //       // Update campaign with new bid
    //       campaign.currentBid = newBid;
    //       campaign.lastAdjustedAt = new Date();
    //       await campaign.save();

    //     } catch (apiError) {
    //       this.logger.error(`Failed to update bid via Amazon API for ${campaign.campaignId}`, apiError);

    //       // Log failed adjustment
    //       await this.logBidAdjustment(
    //         campaign,
    //         campaign.currentBid,
    //         newBid,
    //         roi,
    //         reason,
    //         percentage,
    //         'failed',
    //         apiError.message
    //       );
    //     }
    //   } else {
    //     this.logger.log(
    //       `No bid adjustment needed for campaign ${campaign.campaignId} ` +
    //       `(ROI: ${roi.toFixed(2)})`
    //     );
    //   }
    // } catch (error) {
    //   this.logger.error(`Error adjusting bid for campaign ${campaign.campaignId}`, error);
    // }
  }

  // private async logBidAdjustment(
  //   campaign: CampaignDocument,
  //   oldBid: number,
  //   newBid: number,
  //   roi: number,
  //   reason: string,
  //   adjustmentPercentage: number,
  //   status: string,
  //   errorMessage?: string
  // ): Promise<void> {
  //   const log = new this.bidLogModel({
  //     campaignId: campaign.campaignId,
  //     // keyword: campaign.keyword,
  //     oldBid,
  //     newBid,
  //     roi,
  //     reason,
  //     adjustmentPercentage,
  //     status,
  //     errorMessage,
  //   });

  //   await log.save();
  // }

  // calculateCampaignBudget(
  //   data: ReportDocument,
  // ): BudgetDecision {
  //   const {
  //     targetAcos,
  //     minUtil,
  //     increasePct,
  //     decreasePct,
  //   } = this.config;

  //   const currentBudget = data.campaignBudgetAmount;
  //   const spend14d = data.spend ?? 0;
  //   const acos14d = (data.spend / data.sales14d * 100 || 0) ?? null;

  //   if (!currentBudget || currentBudget <= 0) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget: 0,
  //       newBudget: 0,
  //       action: 'NO_CHANGE',
  //       utilization: 0,
  //       reason: 'NO_BUDGET_SET',
  //     };
  //   }

  //   const utilization = spend14d / (currentBudget * 14);
  //   if (utilization < minUtil) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: currentBudget,
  //       action: 'NO_CHANGE',
  //       utilization,
  //       reason: 'NOT_BUDGET_LIMITED',
  //     };
  //   }
  //   if (acos14d !== null && acos14d <= targetAcos * 0.7) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: +(currentBudget * (1 + increasePct)).toFixed(2),
  //       action: 'INCREASE',
  //       utilization,
  //       reason: 'LOW_ACOS_HIGH_UTILIZATION',
  //     };
  //   }

  //   if (acos14d !== null && acos14d >= targetAcos * 1.5) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: +(currentBudget * (1 - decreasePct)).toFixed(2),
  //       action: 'DECREASE',
  //       utilization,
  //       reason: 'HIGH_ACOS_HIGH_UTILIZATION',
  //     };
  //   }

  //   return {
  //     campaignId: data.campaignId,
  //     currentBudget,
  //     newBudget: currentBudget,
  //     action: 'NO_CHANGE',
  //     utilization,
  //     reason: 'WITHIN_TARGET_RANGE',
  //   };
  // }

  computeBid(report: ReportDocument) {
    const roi = this.getRoi(report, '7d');
    const acos = this.getAcos(report, '7d');

    // const updated = this.calculateCampaignBudget(report)
    // const { campaignId, currentBudget, newBudget, action, utilization, reason } = updated
    // this.optimization.create({ entityType: 'CAMPAIGN', entityId: campaignId, oldValue: currentBudget, newValue: newBudget, type: 'BUDGET_UPDATE', action, utilization, reason })
    // console.log("campaign bid finally adjusted")
    // let newBid = campaign.currentBid;
    // let reason = 'No adjustment needed';
    // let percentage = 0;

    // if (roi >= highRoiThreshold) {
    //   // High ROI - increase bid
    //   percentage = increasePercentage;
    //   newBid = currentBid * (1 + increasePercentage / 100);
    //   reason = `High ROI (${roi.toFixed(2)}) - Increasing bid`;
    // } else if (roi <= lowRoiThreshold && roi > 0) {
    //   // Low ROI - decrease bid
    //   percentage = -decreasePercentage;
    //   newBid = currentBid * (1 - decreasePercentage / 100);
    //   reason = `Low ROI (${roi.toFixed(2)}) - Decreasing bid`;
    // }

    // // Apply min/max constraints
    // newBid = Math.max(minBid, Math.min(maxBid, newBid));
    // newBid = Math.round(newBid * 100) / 100; // Round to 2 decimal places

    // return { newBid, reason, percentage };
    // return updated
  }



  budgetDisicion(report: ReportDocument) {
    const spend = report.spend ?? 0;
    const clicks = report.clicks ?? 0;
    const sales = report.sales14d ?? 0;
    const acos14d = (spend / sales * 100 || 0)
    const budget = report.campaignBudgetAmount ?? 0
    const { targetAcos, minUtil, increasePct, decreasePct, } = this.config;

    if (budget <= 0) {
      return {
        campaignId: report.campaignId,
        currentBudget: 0,
        newBudget: 0,
        action: 'NO_CHANGE',
        utilization: 0,
        reason: REASON['no-change'],
      };
    }

    if (acos14d <= targetAcos) {
      return {
        campaignId: report.campaignId,
        currentBudget: budget,
        newBudget: +(budget * (1 + increasePct)).toFixed(2),
        action: 'INCREASE',
        reason: REASON.profit,
      }
    }
  }

  // budgetCalculator(
  //   data: ReportDocument,
  // ): BudgetDecision {
  //   const {
  //     targetAcos,
  //     minUtil,
  //     increasePct,
  //     decreasePct,
  //   } = this.config;

  //   const currentBudget = data.campaignBudgetAmount ?? 0;
  //   const spend14d = data.spend ?? 0;
  //   const sales14d = data.sales14d ?? 0;

  //   const acos14d =
  //     sales14d > 0 ? (spend14d / sales14d) * 100 : null;

  //   if (!currentBudget || currentBudget <= 0) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget: 0,
  //       newBudget: 0,
  //       action: 'NO_CHANGE',
  //       utilization: 0,
  //       signals: [],
  //       reason: 'NO_BUDGET_SET',
  //     };
  //   }

  //   const utilization = spend14d / (currentBudget * 14);

  //   /* ---------------------------------------------
  //      1. LAUNCH PHASE (AUTO only)
  //   ----------------------------------------------*/
  //   if (data.isAutoCampaign && data.isNewProduct) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: currentBudget,
  //       action: 'NO_CHANGE',
  //       utilization,
  //       signals: ['RUN_FULL_AUTO_TARGETING'],
  //       reason: 'NEW_PRODUCT_LAUNCH_PHASE',
  //     };
  //   }

  //   /* ---------------------------------------------
  //      2. NOT BUDGET LIMITED
  //   ----------------------------------------------*/
  //   if (utilization < minUtil) {
  //     // Good CVR but limited impressions → bid unlock signal
  //     if (data.lowImpressions && sales14d > 0) {
  //       return {
  //         campaignId: data.campaignId,
  //         currentBudget,
  //         newBudget: currentBudget,
  //         action: 'NO_CHANGE',
  //         utilization,
  //         signals: ['INCREASE_BIDS_25'],
  //         reason: 'GOOD_CONVERSION_LOW_IMPRESSIONS',
  //       };
  //     }

  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: currentBudget,
  //       action: 'NO_CHANGE',
  //       utilization,
  //       signals: [],
  //       reason: 'NOT_BUDGET_LIMITED',
  //     };
  //   }

  //   /* ---------------------------------------------
  //      3. PROFITABLE AUTO CAMPAIGN WITH SEARCH TERMS
  //   ----------------------------------------------*/
  //   if (
  //     data.isAutoCampaign &&
  //     acos14d !== null &&
  //     acos14d <= targetAcos &&
  //     data.hasWinningSearchTerms
  //   ) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: +(currentBudget * 1.25).toFixed(2),
  //       action: 'INCREASE',
  //       utilization,
  //       signals: ['MOVE_TERMS_TO_MANUAL'],
  //       reason: 'AUTO_CAMPAIGN_PROFITABLE_SEARCH_TERMS',
  //     };
  //   }

  //   /* ---------------------------------------------
  //      4. STRONGLY PROFITABLE (SCALE)
  //   ----------------------------------------------*/
  //   if (acos14d !== null && acos14d <= targetAcos * 0.7) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: +(currentBudget * (1 + increasePct)).toFixed(2),
  //       action: 'INCREASE',
  //       utilization,
  //       signals: [],
  //       reason: 'LOW_ACOS_HIGH_UTILIZATION',
  //     };
  //   }

  //   /*---------------------------------------------
  //      5. HIGH SPEND, POOR CONVERSION
  //     ----------------------------------------------*/
  //   if (
  //     spend14d > currentBudget * 7 &&
  //     sales14d === 0
  //   ) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: +(currentBudget * 0.75).toFixed(2),
  //       action: 'DECREASE',
  //       utilization,
  //       signals: ['REVIEW_SEARCH_TERMS', 'ADD_NEGATIVES'],
  //       reason: 'HIGH_SPEND_NO_SALES',
  //     };
  //   }

  //   /* ---------------------------------------------
  //      6. LISTING CONVERSION ISSUE
  //   ----------------------------------------------*/
  //   if (data.listingQualityIssue) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: currentBudget,
  //       action: 'NO_CHANGE',
  //       utilization,
  //       signals: ['REDUCE_BIDS_50'],
  //       reason: 'LISTING_CONVERSION_ISSUE',
  //     };
  //   }

  //   /* ---------------------------------------------
  //      7. HIGH ACOS (CONTROL)
  //   ----------------------------------------------*/
  //   if (acos14d !== null && acos14d >= targetAcos * 1.5) {
  //     return {
  //       campaignId: data.campaignId,
  //       currentBudget,
  //       newBudget: +(currentBudget * (1 - decreasePct)).toFixed(2),
  //       action: 'DECREASE',
  //       utilization,
  //       signals: [],
  //       reason: 'HIGH_ACOS_HIGH_UTILIZATION',
  //     };
  //   }

  //   /* ---------------------------------------------
  //      DEFAULT
  //   ----------------------------------------------*/
  //   return {
  //     campaignId: data.campaignId,
  //     currentBudget,
  //     newBudget: currentBudget,
  //     action: 'NO_CHANGE',
  //     utilization,
  //     signals: [],
  //     reason: 'WITHIN_TARGET_RANGE',
  //   };
  // }


}