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


  async createReport(payload:any){
    this.logger.log('Creating report');
    this.reportModal.create(payload)
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