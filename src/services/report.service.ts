import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignReport } from 'src/schemas/reports/report.schema';
import { ReportResponse } from './amazon/amazon-api.service';
import { CampaignApiService } from './amazon/campaign-api.service';
import { KeywordReport } from 'src/schemas/reports/keyword-report.schema';
import { SearchTermReport } from 'src/schemas/reports/search-term-report.schema';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectModel(CampaignReport.name) private campReport: Model<CampaignReport>,
    @InjectModel(KeywordReport.name) private keyReport: Model<KeywordReport>,
    @InjectModel(SearchTermReport.name)
    private searchReport: Model<SearchTermReport>,

    private campaignApi: CampaignApiService,
  ) {}

  async saveReport(payload: any[], meta: ReportResponse) {
    if (meta.configuration.reportTypeId) {
      switch (meta.configuration.reportTypeId) {
        case 'spCampaigns':
          return this.saveCampaignReport(payload);
        case 'spKeywords':
          return this.saveKeywordReport(payload);
        case 'spSearchTerm':
          return this.saveSearchTermReport(payload);
        default:
          this.logger.warn(
            `Unknown report type: ${meta.configuration.reportTypeId}`,
          );
          return;
      }
    }
  }

  async saveCampaignReport(payload: any[]) {
    this.logger.log('Saving campaign report with', payload.length, 'entries');

    // console.log
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, campaignId: data.campaignId },
        update: { $set: data },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.campReport.bulkWrite(bulkOps);
      this.logger.log(
        `Campaign report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
      );
      return result;
    }
    this.logger.warn('No campaign report data to save');
  }

  async saveKeywordReport(payload: any[]) {
    this.logger.log('Saving keyword report with', payload.length, 'entries');
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, keywordId: data.keywordId },
        update: { $set: data },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.keyReport.bulkWrite(bulkOps);
      this.logger.log(
        `Keyword report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
      );
      return result;
    } else {
      this.logger.warn('No keyword report data to save');
      return null;
    }
  }

  async saveSearchTermReport(payload: any[]) {
    this.logger.log('Saving keyword report with', payload.length, 'entries');
    const bulkOps = payload.map((data) => ({
      updateOne: {
        filter: { date: data.date, keywordId: data.keywordId },
        update: { $set: data },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      const result = await this.searchReport.bulkWrite(bulkOps);
      this.logger.log(
        `Keyword report saved/updated. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`,
      );
      return result;
    } else {
      this.logger.warn('No keyword report data to save');
      return null;
    }
  }

  // async upsertReport(payload: any) {
  //   this.logger.log('Upserting report');
  //   return this.campReport.findOneAndUpdate({ date: payload.date }, payload, { upsert: true, new: true }).exec();
  // }

  async getReports(campaignId: string) {
    return this.campReport.find({ campaignId }).sort({ createdAt: -1 }).exec();
  }

  // async getMatrices(scopeId: string, campaignId: string) {

  // }

  async getLatestKeywordReports(keywordIds: string[]) {
    return this.keyReport.aggregate([
      {
        $match: {
          keywordId: { $in: keywordIds },
        },
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$keywordId',
          latestReport: { $first: '$$ROOT' },
        },
      },
    ]);
  }
}
