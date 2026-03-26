import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignReport, ReportDocument, } from 'src/schemas/reports/campaign-report';
import { ReportResponse } from './amazon/amazon-api.service';
// import { CampaignApiService } from './amazon/campaign-api.service';
import { KeywordReport } from 'src/schemas/reports/keyword-report.schema';
import { SearchTermReport } from 'src/schemas/reports/search-term-report.schema';
import { TargetReport } from 'src/schemas/reports/target-report.schema';
import { AdReport } from 'src/schemas/reports/ad-report.schema';
import { AdGroupReport } from 'src/schemas/reports/adgroup-report.schema';
import { AmazonMapper } from './amazon/amazon.mapper';
import { IMetrics } from 'src/engine/interfaces';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectModel(CampaignReport.name) private campReport: Model<CampaignReport>,
    @InjectModel(KeywordReport.name) private keyReport: Model<KeywordReport>,
    @InjectModel(TargetReport.name) private targetReport: Model<TargetReport>,
    @InjectModel(SearchTermReport.name) private searchReport: Model<SearchTermReport>,
    @InjectModel(AdReport.name) private advertisedProductReport: Model<AdReport>,
    @InjectModel(AdGroupReport.name) private adGroupReport: Model<AdGroupReport>,
    // private campaignApi: CampaignApiService
  ) { }

  async saveReport(payload: any[], meta: ReportResponse) {
    if (meta.configuration.reportTypeId) {
      switch (meta.name?.split('-')[0]) {
        case 'campaign':
          return this.saveCampaignReport(payload);
        case 'adGroup':
          return this.saveAdGroupReport(payload);
        case 'ad':
          return this.saveAdvertisedProductReport(payload);
        case 'keywords':
          return this.saveKeywordReport(payload);
        case 'targeting':
          return this.saveTargetingReport(payload);
        case 'searchTerm':
          return this.saveSearchTermReport(payload);
        default:
          this.logger.warn(`Unknown report type: ${meta.configuration.reportTypeId}`);
          return;
      }
    }
  }

  async saveCampaignReport(payload: any[]) {
    this.logger.log('Saving campaign report with' + payload.length + ' entries');
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, campaignId: data.campaignId },
        update: { $set: data },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.campReport.bulkWrite(bulkOps);
      this.logger.log(`Campaign report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
      return result;
    }
    this.logger.warn('No campaign report data to save');
  }

  async saveAdGroupReport(payload: any[]) {
    this.logger.log('Saving ad group report with ' + payload.length + ' entries');
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, adGroupId: data.adGroupId },
        update: { $set: data },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.adGroupReport.bulkWrite(bulkOps);
      this.logger.log(`Ad group report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
      return result;
    }
    this.logger.warn('No ad group report data to save');
  }

  async saveKeywordReport(payload: any[]) {
    this.logger.log('Saving keyword report with' + payload.length + 'entries');
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, keywordId: data.keywordId },
        update: { $set: data },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.keyReport.bulkWrite(bulkOps);
      this.logger.log(`Keyword report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
      return result;
    } else {
      this.logger.warn('No keyword report data to save');
      return null;
    }
  }

  async saveTargetingReport(payload: any[]) {
    this.logger.log('Saving targeting report with' + payload.length + 'entries');
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, targetId: data.keywordId },
        update: { $set: AmazonMapper.targetReport(data) },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.targetReport.bulkWrite(bulkOps);
      this.logger.log(`Targeting report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
      return result;
    } else {
      this.logger.warn('No Target report data to save');
      return null;
    }
  }

  async saveSearchTermReport(payload: any[]) {
    this.logger.log('Saving search term with' + payload.length + ' entries');
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, keywordId: data.keywordId },
        update: { $set: data },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.searchReport.bulkWrite(bulkOps);
      this.logger.log(`search term report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
      return result;
    } else {
      this.logger.warn('No search term report data to save');
      return null;
    }
  }

  async saveAdvertisedProductReport(payload: any[]) {
    this.logger.log('Saving advertised product report with ' + payload.length + ' entries');
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, adId: data.adId },
        update: { $set: data },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.advertisedProductReport.bulkWrite(bulkOps);
      this.logger.log(`Advertised product report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
      return result;
    } else {
      this.logger.warn('No advertised product report data to save');
      return null;
    }
  }

  async getReports(campaignId: string) {
    return this.campReport.find({ campaignId }).sort({ createdAt: -1 }).exec();
  }


  async getLatestKeywordReports(keywordIds: string[]) {
    return this.keyReport.aggregate([
      {
        $match: {
          keywordId: { $in: keywordIds }
        }
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$keywordId',
          latestReport: { $first: '$$ROOT' }
        }
      }
    ]);
  }

  async getLatestCampaignReports(campaignIds: string[]) {
    return this.campReport.aggregate([
      {
        $match: {
          campaignId: { $in: campaignIds }
        }
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$campaignId',
          latestReport: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestReport' }
      }
    ]);
  }

  async getLatestAdGroupReports(adGroupIds: string[]) {
    return this.adGroupReport.aggregate([
      {
        $match: {
          adGroupId: { $in: adGroupIds }
        }
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$adGroupId',
          latestReport: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestReport' }
      }
    ]);
  }

  async getSearchTermsByAdGroup(adGroupId: string) {
    return this.searchReport.aggregate([
      {
        $match: {
          adGroupId: adGroupId
        }
      },
      {
        $group: {
          _id: '$searchTerm',
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          cost: { $sum: '$cost' },
          sales7d: { $sum: '$sales7d' },
          sales14d: { $sum: '$sales14d' },
          purchase: { $sum: '$purchases7d' },
          purchase14d: { $sum: '$purchases14d' },
          keyword: { $first: '$keyword' },
          matchType: { $first: '$matchType' },
          searchTerm: { $first: '$searchTerm' }
        }
      },
      {
        $sort: { cost: -1 }
      }
    ]);
  }

  async getTargetingReportsByAdGroup(adGroupId: string) {
    return this.targetReport.aggregate([
      {
        $match: { adGroupId: adGroupId }
      },
      {
        $group: {
          _id: '$targetId',
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          cost: { $sum: '$cost' },
          sales7d: { $sum: '$sales7d' },
          sales14d: { $sum: '$sales14d' },
          purchases7d: { $sum: '$purchases7d' },
          purchases14d: { $sum: '$purchases14d' },
          keyword: { $first: '$keyword' },
          matchType: { $first: '$matchType' },
          targeting: { $first: '$targeting' }
        }
      },
      {
        $addFields: {
          targetId: '$_id'
        }
      },
      {
        $sort: { cost: -1 }
      }
    ]);
  }

  async getTargetingReportsByTargetIds(targetIds: string[]) {
    if (!targetIds || targetIds.length === 0) {
      return [];
    }

    return this.targetReport.aggregate([
      {
        $match: {
          targetId: { $in: targetIds }
        }
      },
      {
        $group: {
          _id: '$targetId',
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          cost: { $sum: '$cost' },
          sales7d: { $sum: '$sales7d' },
          sales14d: { $sum: '$sales14d' },
          purchases7d: { $sum: '$purchases7d' },
          purchases14d: { $sum: '$purchases14d' },
          keyword: { $first: '$keyword' },
          matchType: { $first: '$matchType' },
          targeting: { $first: '$targeting' }
        }
      },
      {
        $addFields: {
          targetId: '$_id'
        }
      },
      {
        $sort: { cost: -1 }
      }
    ]);
  }

  //   async getCampaignTotalCost(campaignId: string, startDate?: string, endDate?: string) {
  //   const matchStage: any = { campaignId };

  //   // Add date filtering if dates are provided
  //   if (startDate || endDate) {
  //     matchStage.date = {};
  //     if (startDate) {
  //       matchStage.date.$gte = startDate;
  //     }
  //     if (endDate) {
  //       matchStage.date.$lte = endDate;
  //     }
  //   }

  //   const result = await this.report.aggregate([
  //     {
  //       $match: matchStage
  //     },
  //     {
  //       $group: {
  //         _id: '$campaignId',
  //         totalCost: { $sum: '$cost' },
  //         totalSales: { $sum: '$sales1d' },
  //         totalSales7d: { $sum: '$sales7d' },
  //         totalSales14d: { $sum: '$sales14d' },
  //         totalImpressions: { $sum: '$impressions' },
  //         totalClicks: { $sum: '$clicks' }
  //       }
  //     }
  //   ]);
  //   return result[0] || {
  //     totalCost: 0,
  //     totalSales: 0,
  //     totalSales7d: 0,
  //     totalSales14d: 0,
  //     totalImpressions: 0,
  //     totalClicks: 0
  //   };
  // }


  async getBidReports(campaignId: string): Promise<{ metrics30d: IMetrics; metrics7d: IMetrics }> {
    const now = new Date();
    const last7Days = new Date();
    last7Days.setDate(now.getDate() - 7);
    const last30days = new Date();
    last30days.setDate(now.getDate() - 30);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const nowStr = formatDate(now);
    const last7DaysStr = formatDate(last7Days);
    const last30daysStr = formatDate(last30days);

    const result = await this.campReport.aggregate([
      {
        $match: {
          campaignId
        }
      },
      {
        $facet: {
          last30d: [
            {
              $match: {
                date: { $gte: last30daysStr, $lte: nowStr }
              }
            },
            {
              $group: {
                _id: null,
                cost: { $sum: '$cost' },
                sales: { $sum: '$sales1d' },
                purchase: { $sum: '$purchases1d' },
                impression: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' }
              }
            }
          ],
          last7d: [
            {
              $match: {
                date: { $gte: last7DaysStr, $lte: nowStr }
              }
            },
            {
              $group: {
                _id: null,
                cost: { $sum: '$cost' },
                sales: { $sum: '$sales1d' },
                purchase: { $sum: '$purchases1d' },
                impression: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' }
              }
            }
          ]
        }
      }
    ]);
    const data = result[0];
    console.log(data)
    return {
      metrics30d: data.last30d[0] || { totalCost: 0, totalSales: 0, totalImpressions: 0, totalClicks: 0 },
      metrics7d: data.last7d[0] || { totalCost: 0, totalSales: 0, totalImpressions: 0, totalClicks: 0 }
    };
  }
  async getSearchTermReport(campaignId: string) {
    const response = await this.searchReport.aggregate([
      {
        $match: { campaignId },
      },
      {
        $sort: { date: -1 },
      },
      {
        $group: {
          _id: '$campaignId',
          latestDate: { $first: '$date' },
          docs: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          latestDate: 1,
          searchTerms: {
            $filter: {
              input: '$docs',
              as: 'doc',
              cond: { $eq: ['$$doc.date', '$latestDate'] },
            },
          },
        },
      },
    ]);
    return response[0]?.searchTerms || [];
  }


  async getCampaignTotalCost(campaignId: string, startDate?: string, endDate?: string) {
    const matchStage: any = { campaignId };
    // Add date filtering if dates are provided
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        matchStage.date.$gte = startDate;
      }
      if (endDate) {
        matchStage.date.$lte = endDate;
      }
    }

    const result = await this.campReport.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: '$campaignId',
          totalCost: { $sum: '$cost' },
          totalSales: { $sum: '$sales1d' },
          totalSales7d: { $sum: '$sales7d' },
          totalSales14d: { $sum: '$sales14d' },
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' }
        }
      }
    ]);
    return result[0] || {
      totalCost: 0,
      totalSales: 0,
      totalSales7d: 0,
      totalSales14d: 0,
      totalImpressions: 0,
      totalClicks: 0
    };
  }

}

