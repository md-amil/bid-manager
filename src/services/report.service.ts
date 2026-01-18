import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignReport } from 'src/schemas/report.schema';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectModel(CampaignReport.name) private reportModal: Model<CampaignReport>,
  ) { }


  async createReport(payload:any[]){
    this.logger.log('Creating report');
    const bulkWrite = await this.reportModal.bulkWrite(
      payload.map(doc => ({
        updateOne: {
          filter: { campaignId: doc.campaignId, date: doc.date },
          update: { $set: doc },
          upsert: true,
        }
      }))
    );
    return payload;
  }


  async upsertReport(payload: any) {
    this.logger.log('Upserting report');
    return this.reportModal.findOneAndUpdate({ date: payload.date }, payload, { upsert: true, new: true }).exec();
  }

  async getReports(campaignId:string) {
    return this.reportModal.find({ campaignId }).sort({ createdAt: -1 }).exec();
  }


  async getMatrices(scopeId: string, campaignId: string) {
  
  }
  
}