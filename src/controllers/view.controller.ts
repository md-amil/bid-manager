import { Controller, Get, Render, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';

@Controller()
export class ViewController {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
  ) {}

  @Get()
  @Render('index')
  async getIndex() {
    const campaigns = await this.campaignModel.find().sort({ createdAt: -1 }).exec();
    const recentLogs = await this.bidLogModel.find().sort({ createdAt: -1 }).limit(10).exec();
    
    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalSpend: campaigns.reduce((sum, c) => sum + c.spend, 0),
      totalSales: campaigns.reduce((sum, c) => sum + c.sales, 0),
      averageROI: campaigns.length > 0 
        ? campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns.length 
        : 0,
    };

    return { campaigns, recentLogs, stats };
  }

  @Get('campaigns')
  @Render('campaigns')
  async getCampaigns() {
    const campaigns = await this.campaignModel.find().sort({ createdAt: -1 }).exec();
    return { campaigns };
  }

  @Get('campaigns/:id')
  @Render('campaign-detail')
  async getCampaignDetail(@Param('id') id: string) {
    const campaign = await this.campaignModel.findOne({ campaignId: id }).exec();
    const logs = await this.bidLogModel
      .find({ campaignId: id })
      .sort({ createdAt: -1 })
      .exec();
    
    return { campaign, logs };
  }

  @Get('logs')
  @Render('logs')
  async getLogs() {
    const logs = await this.bidLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    
    const successCount = logs.filter(l => l.status === 'success').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;
    
    return { logs, successCount, failedCount };
  }
}
