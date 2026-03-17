import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignReport, } from 'src/schemas/reports/campaign-report';
import { ReportResponse } from './amazon/amazon-api.service';
// import { CampaignApiService } from './amazon/campaign-api.service';
import { KeywordReport } from 'src/schemas/reports/keyword-report.schema';
import { SearchTermReport } from 'src/schemas/reports/search-term-report.schema';
import { TargetReport } from 'src/schemas/reports/target-report.schema';
import { AdvertisedProductReport } from 'src/schemas/reports/advertised-product-report.schema';
import { AdGroupReport } from 'src/schemas/reports/adgroup-report.schema';
import { AmazonMapper } from './amazon/amazon.mapper';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectModel(CampaignReport.name) private campReport: Model<CampaignReport>,
    @InjectModel(KeywordReport.name) private keyReport: Model<KeywordReport>,
    @InjectModel(TargetReport.name) private targetReport: Model<TargetReport>,
    @InjectModel(SearchTermReport.name) private searchReport: Model<SearchTermReport>,
    @InjectModel(AdvertisedProductReport.name) private advertisedProductReport: Model<AdvertisedProductReport>,
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
        update: { $set: AmazonMapper.targetReport(data)},
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

}