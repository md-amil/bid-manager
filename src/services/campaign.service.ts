import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AmazonApiService } from './amazon/amazon-api.service';
import { Campaign, CampaignDocument } from 'src/schemas/campaign.schema';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectQueue('campaignSync') private syncQueue: Queue,
    @InjectQueue('reportProcessor') private reportQueue: Queue,

    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
  ) { }

  // async syncCampaignData(scopeId: string = '3838241482724308'): Promise<any> {
  //   this.logger.log('Syncing campaign data from Amazon API');
  //   try {
  //     const endDate = new Date().toISOString();
  //     const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  //     const job = await this.syncQueue.add('sync', {
  //       scopeId,
  //       endDate,
  //       startDate,
  //     });
  //     return job;
  //   } catch (error) {
  //     this.logger.error('Error syncing campaign data',);
  //   }
  // }

  async getCampaigns(scopeId: string) {
    return this.campaignModel.find({ scopeId }).sort({ createdAt: -1 }).exec();
  }

  async getCampaignById(campaignId: string) {
    const data = await this.campaignModel.aggregate([
      {
        $match: {
          campaignId
        }
      },
      {
        $lookup: {
          from: 'adgroups',                 // collection name
          localField: 'campaignId',
          foreignField: 'campaignId',
          as: 'adGroups'
        }
      }
    ]);
    console.log(data[0], 'aggregateddata');
    return data[0];
    // return this.campaignModel.find({scopeId,campaignId}).populate('').sort({ createdAt: -1 }).exec();
  }
  async getAdgroupsByCampaign(campaignId: string) {
    // Implement logic to get ad groups by campaign ID
  }

  async generateReport() {
    this.logger.log('Generating report');
    try {
      const job = await this.reportQueue.add('generateReport', {
        name: "sponser report",
        startDate: "2026-01-04",
        endDate: "2026-01-07",
      });
      return job;
    } catch (error) {
      this.logger.error('Error generating report', error);
    }
  }
}