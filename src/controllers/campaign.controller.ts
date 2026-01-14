import { Controller, Get, Post, Body, Param, Request, Req } from '@nestjs/common';
import { BidAdjustmentService } from '../services/amazon/bid-adjustment.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';
import { AmazonApiService } from 'src/services/amazon/amazon-api.service';
import { AmazonSyncService } from 'src/services/amazon/amazon-sync.service';
import { CampaignService } from 'src/services/campaign.service';
import { SyncProducer } from 'src/queue/producer/sync.producer';
import { ReportProducer } from 'src/queue/producer/report.producer';

@Controller('api/campaigns')
export class CampaignController {
  constructor(
    // private campaignService: CampaignService,
    private amazonApi: AmazonApiService,
    private readonly syncProducer: SyncProducer,
    private readonly reportProducer: ReportProducer,

    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
    // @InjectConnection() private readonly connection: Connection,
  ) { }

  @Get()
  async getAllCampaigns(@Req() request:Request) {
    console.log({request})
    return this.campaignModel.find({}).exec();
    return await this.amazonApi.getCampaigns();
  }

  @Post()
  async createCampaign(@Body() campaignData: any) {
    const campaign = new this.campaignModel(campaignData);
    return await campaign.save();
  }

  @Post('sync')
  async syncCampaigns(@Request() req: any) {
    console.log(req.session.selectedProfile,'session')
    // return 
    const job = await this.syncProducer.syncCampaignData(req.session.selectedProfile.profileId);
    return { message: 'Campaign sync initiated', job:job.id};
  }

  @Post('adjust-bids')
  async adjustBids(@Request() req: any) {
    const profile = req.session.selectedProfile
    if(!profile) return { message: 'NO Profile found' };

    const response = await this.reportProducer.generateReport(req.session.selectedProfile.profileId);
    return { message: 'Bid adjustment completed',ack:response?.id };
  }

  @Get(':id')
  async getCampaign(@Param('id') id: string) {
    return await this.campaignModel.findOne({ campaignId: id }).exec();
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
