import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BidAdjustmentService } from '../services/bid-adjustment.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';

@Controller('api/campaigns')
export class CampaignController {
  constructor(
    private bidAdjustmentService: BidAdjustmentService,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
  ) {}

  @Get()
  async getAllCampaigns() {
    // return await this.campaignModel.find().exec();
     const campaigns = await this.bidAdjustmentService.syncCampaignData();
     return campaigns;
  }

  @Get(':id')
  async getCampaign(@Param('id') id: string) {
    return await this.campaignModel.findOne({ campaignId: id }).exec();
  }

  @Post()
  async createCampaign(@Body() campaignData: any) {
    const campaign = new this.campaignModel(campaignData);
    return await campaign.save();
  }

  @Post('sync')
  async syncCampaigns() {
    const campaigns = await this.bidAdjustmentService.syncCampaignData();
    console.log({campaigns})
    return { message: 'Campaign sync initiated' };
  }

  @Post('adjust-bids')
  async adjustBids() {
    await this.bidAdjustmentService.adjustBidsForAllCampaigns();
    return { message: 'Bid adjustment completed' };
  }

  @Get(':id/logs')
  async getCampaignLogs(@Param('id') id: string) {
    return await this.bidLogModel
      .find({ campaignId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  @Get('logs/recent')
  async getRecentLogs() {
    return await this.bidLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }
}
