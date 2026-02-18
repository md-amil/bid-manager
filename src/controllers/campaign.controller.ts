import { Controller, Get, Post, Body, Param, Request, Req } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';
import { AmazonApiService } from 'src/services/amazon/amazon-api.service';
import { SyncProducer } from 'src/queue/producer/sync.producer';
import { ReportProducer } from 'src/queue/producer/report.producer';
import { BidService } from 'src/services/amazon/bid.service';
import { ReportDocument } from 'src/schemas/reports/report.schema';
import { CampaignApiService } from 'src/services/amazon/campaign-api.service';
import { BidProducer } from 'src/queue/producer/bid.producer';
import { CampaignService } from 'src/services/campaign.service';


@Controller('api/campaigns')
export class CampaignController {
  constructor(
    // private campaignService: CampaignService,
    private campaignApi: CampaignApiService,
    private readonly syncProducer: SyncProducer,
    private readonly reportProducer: ReportProducer,
    private readonly bidProducer: BidProducer,
    private readonly campaignService: CampaignService,
    // private readonly bidService: BidService,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
  ) { }

  @Get()
  async getAllCampaigns(@Req() request: any) {
    const scopeId = request.session.selectedProfile?.profileId
    return this.campaignModel.find({ scopeId }).exec();
    // return await this.campaignApi.getCampaigns();
  }

  @Post()
  async createCampaign(@Body() campaignData: any) {
    const campaign = new this.campaignModel(campaignData);
    return await campaign.save();
  }

  @Post('sync')
  async syncCampaigns(@Request() req: any) {
    const scopeId = req.session.selectedProfile?.profileId;
    const job = await this.syncProducer.syncCampaignData(scopeId);
    // const reportJob = await this.reportProducer.generateReport(scopeId);
    return { message: 'Campaign sync initiated' };
  }

  @Post('adjust-bids')
  async adjustBids(@Request() req: any) {
    const profile = req.session.selectedProfile?.profileId
    const campaigns = await this.campaignService.getCampaigns(profile)
    const campaignIds = campaigns.map(({ campaignId }) => campaignId)
    const budgetUsages = await this.campaignApi.getBudgetUses(['93618166928305'], profile)
    console.log(campaigns.length, "campaign length",budgetUsages.length)
    await this.bidProducer.scheduleBidAdjustment(campaigns,budgetUsages[0])
    return { message: 'Bid adjustment scheduled' };
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


  @Get('decide-budget')
  async calculateBudget() {
    // return this.bidService.budgetDisicion(json[0] as any)
  }
}
